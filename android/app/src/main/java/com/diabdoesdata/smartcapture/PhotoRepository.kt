package com.diabdoesdata.smartcapture

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import androidx.room.withTransaction
import java.io.File
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class PhotoRepository(private val context: Context, private val db: CaptureDatabase) {
    private val mutex = Mutex()
    private val dao = db.dao()
    private val resolver = context.contentResolver
    private val collection =
        MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)

    suspend fun begin(session: Session?, shot: Shot?, metadata: JSONObject): Photo =
        withContext(Dispatchers.IO) {
            val id = UUID.randomUUID().toString()
            val now = System.currentTimeMillis()
            val dir = File(context.filesDir, "capture-journal").apply { mkdirs() }
            val v = metadata.getJSONObject("vehicle")
            val parts = listOf("year", "make", "model", "stock").map { v.optString(it) }
            val stamp =
                java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS")
                    .withZone(java.time.ZoneId.systemDefault())
                    .format(java.time.Instant.ofEpochMilli(now))
            Photo(
                    id,
                    session?.id,
                    shot?.code ?: "QUICK_CAMERA",
                    session?.cursor ?: 0,
                    File(dir, "$id.jpg").path,
                    CaptureRules.filename(parts, shot?.code ?: "QUICK_CAMERA", stamp, id),
                    metadata.toString(),
                    now,
                )
                .also { dao.putPhoto(it) }
        }

    suspend fun captured(photo: Photo): Photo =
        withContext(Dispatchers.IO) {
            photo.copy(state = "ready", error = null).also { dao.putPhoto(it) }
        }

    suspend fun failure(photo: Photo, error: String) =
        withContext(Dispatchers.IO) {
            dao.putPhoto((dao.photo(photo.id) ?: photo).copy(error = error))
        }

    /** Retry is idempotent across copy, publication and DB-association interruptions. */
    suspend fun publish(id: String): Photo =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                var job = dao.photo(id) ?: error("Capture no longer available")
                if (job.state == "saved") return@withLock job
                require(job.source == "camera") { "Demo images never enter the device gallery" }
                val file = File(job.tempPath)
                require(file.exists() && file.length() > 0) {
                    "Capture was interrupted before a complete photo was available. Retake this shot."
                }
                requireJpegEndMarker(file)
                val (w, h) = writeMetadata(file, job.metadata, job.capturedAt)
                // Reconcile a crash between insertion and journaling, using our unique name.
                var uri = job.uri?.let(Uri::parse) ?: findOwnImage(job.displayName)
                if (uri == null) {
                    uri =
                        resolver.insert(
                            collection,
                            ContentValues().apply {
                                put(MediaStore.Images.Media.DISPLAY_NAME, job.displayName)
                                put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                                put(MediaStore.Images.Media.RELATIVE_PATH, "DCIM/SmartCapture/")
                                put(MediaStore.Images.Media.DATE_TAKEN, job.capturedAt)
                                put(MediaStore.Images.Media.IS_PENDING, 1)
                            },
                        ) ?: error("Cannot create photo. Check available device storage.")
                }
                job =
                    job.copy(
                        state = "publishing",
                        uri = uri.toString(),
                        width = w,
                        height = h,
                        bytes = file.length(),
                        error = null,
                        metadata =
                            androidx.exifinterface.media
                                .ExifInterface(file)
                                .getAttribute(
                                    androidx.exifinterface.media.ExifInterface.TAG_USER_COMMENT
                                ) ?: job.metadata,
                    )
                dao.putPhoto(job)
                val published = isPublished(uri)
                if (!published) {
                    resolver.openOutputStream(uri, "wt")?.use { out ->
                        file.inputStream().use { it.copyTo(out) }
                    }
                        ?: error(
                            "Cannot open the gallery file. Your original is retained; retry saving."
                        )
                    require(
                        resolver.update(
                            uri,
                            ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) },
                            null,
                            null,
                        ) == 1
                    ) {
                        "Photo publication was interrupted; retry saving."
                    }
                }
                val saved =
                    job.copy(
                        state = "saved",
                        elapsedMs = System.currentTimeMillis() - job.capturedAt,
                        error = null,
                    )
                db.withTransaction {
                    dao.putPhoto(saved)
                    advance(job)
                }
                file.delete() // Private duplicate only, after both publication and association
                // succeed.
                saved
            }
        }

    private fun findOwnImage(name: String): Uri? =
        resolver
            .query(
                collection,
                arrayOf(MediaStore.Images.Media._ID),
                "${MediaStore.Images.Media.DISPLAY_NAME}=? AND ${MediaStore.Images.Media.RELATIVE_PATH}=?",
                arrayOf(name, "DCIM/SmartCapture/"),
                null,
            )
            ?.use { c ->
                if (c.moveToFirst())
                    android.content.ContentUris.withAppendedId(collection, c.getLong(0))
                else null
            }

    private fun isPublished(uri: Uri): Boolean =
        resolver.query(uri, arrayOf(MediaStore.Images.Media.IS_PENDING), null, null, null)?.use {
            it.moveToFirst() && it.getInt(0) == 0
        } ?: false

    private suspend fun advance(photo: Photo) {
        photo.sessionId?.let { id ->
            dao.session(id)?.let { session ->
                val count = JSONArray(session.sequence).length()
                if (session.cursor == photo.shotIndex)
                    dao.putSession(session.copy(cursor = (session.cursor + 1).coerceAtMost(count)))
            }
        }
    }

    suspend fun saveDemo(session: Session, shot: Shot, catalog: Catalog): Photo =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                val id = UUID.randomUUID().toString()
                val now = System.currentTimeMillis()
                val file = File(context.filesDir, "demo/$id.jpg").apply { parentFile?.mkdirs() }
                val image = catalog.bitmap(shot, session.body)
                file.outputStream().use {
                    image.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, it)
                }
                val photo =
                    Photo(
                        id,
                        session.id,
                        shot.code,
                        session.cursor,
                        file.path,
                        "DEMO_$id.jpg",
                        JSONObject()
                            .put("source", "demo")
                            .put("shotCode", shot.code)
                            .put("referenceRevision", catalog.revision)
                            .toString(),
                        now,
                        "saved",
                        file.path,
                        image.width,
                        image.height,
                        file.length(),
                        0,
                        "demo",
                    )
                db.withTransaction {
                    dao.putPhoto(photo)
                    advance(photo)
                }
                photo
            }
        }

    suspend fun recover(): List<String> =
        withContext(Dispatchers.IO) {
            dao.unfinished().mapNotNull { job ->
                runCatching {
                    if (File(job.tempPath).length() > 0) publish(job.id)
                    else failure(job, "Capture interrupted. Retake this shot.")
                }
                    .exceptionOrNull()
                    ?.let { e ->
                        failure(job, e.message ?: "Save interrupted")
                        e.message
                    }
            }
        }
}
