package com.diabdoesdata.smartcapture

import android.location.Location
import android.os.Build
import android.os.SystemClock
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import org.json.JSONObject

data class Vehicle(
    val vin: String = "",
    val year: String = "",
    val make: String = "",
    val model: String = "",
    val trim: String = "",
    val stock: String = "",
    val body: String = "sedan",
) {
    fun json() =
        JSONObject()
            .put("vin", vin.trim())
            .put("year", year.trim())
            .put("make", make.trim())
            .put("model", model.trim())
            .put("trim", trim.trim())
            .put("stock", stock.trim())
            .put("bodyStyle", body)

    fun title() = listOf(year, make, model, trim).filter { it.isNotBlank() }.joinToString(" ")

    companion object {
        fun parse(value: String): Vehicle {
            val j = JSONObject(value)
            return Vehicle(
                j.optString("vin"),
                j.optString("year"),
                j.optString("make"),
                j.optString("model"),
                j.optString("trim"),
                j.optString("stock"),
                j.optString("bodyStyle", "sedan"),
            )
        }
    }
}

object CaptureRules {
    fun mergeDecoded(request: Vehicle, decoded: Vehicle, current: Vehicle): Vehicle {
        if (current.vin != request.vin) return current
        return current.copy(
            year = if (current.year == request.year) decoded.year else current.year,
            make = if (current.make == request.make) decoded.make else current.make,
            model = if (current.model == request.model) decoded.model else current.model,
            trim = if (current.trim == request.trim) decoded.trim else current.trim,
        )
    }

    fun normalizeVin(vin: String) = vin.uppercase(Locale.ROOT).replace(" ", "").trim()

    fun validVin(vin: String) = vin.matches(Regex("[A-HJ-NPR-Z0-9]{17}"))

    fun filename(vehicleParts: List<String>, shot: String, stamp: String, id: String): String {
        val known = vehicleParts.filter { it.isNotBlank() }.joinToString("_")
        val stem = if (known.isBlank()) "SC_${stamp}" else "${known}_${shot}_${stamp}"
        return stem.replace(Regex("[^A-Za-z0-9_-]"), "_").take(150) + "_${id.take(12)}.jpg"
    }

    fun freshLocation(ageNanos: Long, accuracy: Float, mock: Boolean) =
        ageNanos in 0..120_000_000_000L && accuracy in 0f..100f && !mock
}

fun usableLocation(location: Location?): Location? = location?.takeIf {
    @Suppress("DEPRECATION") val mock = it.isFromMockProvider
    CaptureRules.freshLocation(
        SystemClock.elapsedRealtimeNanos() - it.elapsedRealtimeNanos,
        it.accuracy,
        mock,
    ) && it.hasAccuracy()
}

fun captureMetadata(
    vehicle: Vehicle,
    session: Session?,
    shot: Shot?,
    now: Long,
    location: Location?,
    cameraId: String?,
    calibration: Calibration,
    revision: String,
): JSONObject {
    val j =
        JSONObject()
            .put("schemaVersion", 3)
            .put("source", "camera")
            .put("vehicle", vehicle.json())
            .put("sessionId", session?.id ?: JSONObject.NULL)
            .put("shotCode", shot?.code ?: "QUICK_CAMERA")
            .put("shotName", shot?.name ?: "Quick Camera")
            .put("category", shot?.category ?: "quick")
            .put("capturedAt", java.time.Instant.ofEpochMilli(now).toString())
            .put("deviceManufacturer", Build.MANUFACTURER)
            .put("deviceModel", Build.MODEL)
            .put("cameraId", cameraId ?: JSONObject.NULL)
            .put("format", "image/jpeg")
            .put("nominalAzimuthDegrees", shot?.azimuth ?: JSONObject.NULL)
            .put("panelState", shot?.panelState ?: "unknown")
            .put("referenceRevision", revision)
            .put("referenceCalibration", JSONObject(calibration.json()))
    usableLocation(location)?.let { l ->
        j.put(
            "location",
            JSONObject()
                .put("latitude", l.latitude)
                .put("longitude", l.longitude)
                .put("accuracyMeters", l.accuracy)
                .put("fixTime", l.time),
        )
    }
    return j
}

/** Supplements the native JPEG without decoding/re-encoding image pixels. */
fun writeMetadata(file: File, metadata: String, capturedAt: Long): Pair<Int, Int> {
    val j = JSONObject(metadata)
    val v = j.getJSONObject("vehicle")
    val description = buildList {
        listOf("year", "make", "model", "trim")
            .map { v.optString(it) }
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .takeIf { it.isNotBlank() }
            ?.let { add(it) }
        add(j.getString("shotName"))
        v.optString("vin").takeIf { it.isNotBlank() }?.let { add("VIN: $it") }
        v.optString("stock").takeIf { it.isNotBlank() }?.let { add("Stock: $it") }
    }
        .joinToString(" — ")
    val exif = ExifInterface(file)
    exif.setAttribute(ExifInterface.TAG_IMAGE_DESCRIPTION, description)
    // Capture time and hardware facts only fill fields absent from the actual camera output.
    if (exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL) == null) {
        exif.setAttribute(
            ExifInterface.TAG_DATETIME_ORIGINAL,
            SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.US).format(Date(capturedAt)),
        )
        exif.setAttribute(
            ExifInterface.TAG_OFFSET_TIME_ORIGINAL,
            java.time.ZonedDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(capturedAt),
                    java.time.ZoneId.systemDefault(),
                )
                .offset
                .id
                .replace("Z", "+00:00"),
        )
    }
    if (exif.getAttribute(ExifInterface.TAG_MAKE) == null)
        exif.setAttribute(ExifInterface.TAG_MAKE, Build.MANUFACTURER)
    if (exif.getAttribute(ExifInterface.TAG_MODEL) == null)
        exif.setAttribute(ExifInterface.TAG_MODEL, Build.MODEL)
    exif.setAttribute(ExifInterface.TAG_SOFTWARE, "Smart Capture ${BuildConfig.VERSION_NAME}")
    val w = exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, 0)
    val h = exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, 0)
    j.put("nativeWidth", w)
        .put("nativeHeight", h)
        .put("orientation", exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, 1))
    j.optJSONObject("location")?.let { l ->
        exif.setLatLong(l.getDouble("latitude"), l.getDouble("longitude"))
    }
    exif.setAttribute(ExifInterface.TAG_USER_COMMENT, j.toString())
    exif.saveAttributes()
    require(w > 0 && h > 0) { "Camera returned invalid image dimensions" }
    return w to h
}
