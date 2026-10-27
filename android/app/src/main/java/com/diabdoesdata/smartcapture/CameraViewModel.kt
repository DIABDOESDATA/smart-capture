package com.diabdoesdata.smartcapture

import android.app.Application
import android.location.Location
import android.net.Uri
import androidx.compose.runtime.*
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import java.io.File
import java.util.UUID
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray

class CameraViewModel(app: Application) : AndroidViewModel(app) {
    val catalog = Catalog(app)
    private val db = CaptureDatabase.get(app)
    val repository = PhotoRepository(app, db)
    private val prefs = app.getSharedPreferences("camera-preferences-v3", 0)
    var sessions by mutableStateOf(emptyList<Session>())
        private set

    var photos by mutableStateOf(emptyList<Photo>())
        private set

    var active by mutableStateOf<Session?>(null)
        private set

    var loading by mutableStateOf(true)
        private set

    var busy by mutableStateOf(false)
        private set

    var message by mutableStateOf<String?>(null)
    var failedId by mutableStateOf<String?>(null)
        private set

    var referenceVisible by mutableStateOf(prefs.getBoolean("reference", true))
    var geotag by mutableStateOf(prefs.getBoolean("geotag", false))
        private set

    var ratioWide by mutableStateOf(prefs.getBoolean("wide", false))
        private set

    var calibration by mutableStateOf(Calibration())
        private set

    var customReference by mutableStateOf<String?>(null)
        private set

    var referenceVersion by mutableIntStateOf(0)
        private set

    val sequence
        get() =
            active?.let { s ->
                JSONArray(s.sequence).let { a -> (0 until a.length()).map { a.getString(it) } }
            } ?: emptyList()

    val shot: Shot?
        get() = active?.let { s -> sequence.getOrNull(s.cursor)?.let(catalog::shot) }

    val completed
        get() = active != null && shot == null

    val body
        get() = active?.body ?: "sedan"

    private var restore = true
    var startupFailure by mutableStateOf<Throwable?>(null)
        private set

    private val startupJobs = mutableListOf<Job>()

    init {
        retryStartup()
    }

    fun retryStartup() {
        startupJobs.forEach { it.cancel() }
        startupJobs.clear()
        startupFailure = null
        loading = true
        val handler = CoroutineExceptionHandler { _, failure ->
            if (failure is VirtualMachineError || failure is ThreadDeath) throw failure
            android.util.Log.e("SmartCaptureStartup", "Cannot load saved sessions", failure)
            startupFailure = failure
            loading = false
        }
        startupJobs +=
            viewModelScope.launch(handler) {
                repository.recover()
                db.dao().sessions().collectLatest { list ->
                    sessions = list
                    if (restore) {
                        active = list.find { it.id == prefs.getString("session", null) }
                        restore = false
                    } else active = active?.let { current -> list.find { it.id == current.id } }
                    loading = false
                }
            }
        startupJobs +=
            viewModelScope.launch(handler) {
                db.dao().photos().collectLatest {
                    photos = it
                    failedId =
                        it.firstOrNull { p ->
                                p.state in listOf("capturing", "ready", "publishing") &&
                                    p.error != null &&
                                    File(p.tempPath).length() > 0
                            }
                            ?.id
                }
            }
    }

    fun start(
        vehicle: Vehicle,
        demo: Boolean = false,
        extended: Boolean = false,
        rearSeats: Boolean = true,
        thirdRow: Boolean = false,
        sunroof: Boolean = false,
    ) {
        if (busy) return
        busy = true
        viewModelScope.launch {
            val s =
                Session(
                    UUID.randomUUID().toString(),
                    vehicle.body,
                    vehicle.json().toString(),
                    JSONArray(
                            catalog.sequence(
                                vehicle.body,
                                extended,
                                rearSeats,
                                thirdRow || demo,
                                sunroof || demo,
                            )
                        )
                        .toString(),
                    demo = demo,
                )
            runCatching { db.dao().putSession(s) }
                .onSuccess {
                    active = s
                    prefs.edit().putString("session", s.id).apply()
                    loadReference()
                }
                .onFailure { message = "Cannot start session. ${it.message}" }
            busy = false
        }
    }

    fun select(session: Session?) {
        if (busy) return
        active = session
        prefs.edit().putString("session", session?.id).apply()
        loadReference()
    }

    fun navigate(index: Int) {
        val s = active ?: return
        if (busy) return
        viewModelScope.launch {
            db.dao().putSession(s.copy(cursor = index.coerceIn(0, sequence.size)))
            loadReference()
        }
    }

    fun quick() {
        select(null)
    }

    fun toggleReference() {
        referenceVisible = !referenceVisible
        prefs.edit().putBoolean("reference", referenceVisible).apply()
    }

    fun enableGeotag(enabled: Boolean) {
        geotag = enabled
        prefs.edit().putBoolean("geotag", enabled).apply()
    }

    fun setWide(enabled: Boolean) {
        if (busy) return
        ratioWide = enabled
        prefs.edit().putBoolean("wide", enabled).apply()
    }

    private fun refKey(): String {
        val vehicle = active?.let { Vehicle.parse(it.vehicle) }
        val identity =
            vehicle?.vin?.takeIf(CaptureRules::validVin)?.let { "vin:$it" } ?: active?.id ?: "quick"
        return "$identity:$body:${shot?.code ?: "QUICK"}"
    }

    fun loadReference() {
        val key = refKey()
        viewModelScope.launch {
            val r = db.dao().reference(key)
            if (key == refKey()) {
                calibration = Calibration.parse(r?.calibration)
                customReference = r?.path
                referenceVersion++
            }
        }
    }

    fun calibrate(c: Calibration) {
        calibration = c
        val key = refKey()
        val path = customReference
        viewModelScope.launch { db.dao().putReference(ReferenceOverride(key, path, c.json())) }
    }

    fun resetReference() {
        customReference = null
        calibrate(Calibration())
        referenceVersion++
    }

    fun importReference(uri: Uri) {
        val key = refKey()
        viewModelScope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    val file =
                        File(
                                getApplication<Application>().filesDir,
                                "references/${UUID.randomUUID()}.photo",
                            )
                            .apply { parentFile?.mkdirs() }
                    getApplication<Application>().contentResolver.openInputStream(uri)?.use { input
                        ->
                        file.outputStream().use { out ->
                            val buffer = ByteArray(64 * 1024)
                            var total = 0L
                            while (true) {
                                val n = input.read(buffer)
                                if (n < 0) break
                                total += n
                                require(total <= 40L * 1024 * 1024) {
                                    "Reference exceeds 40 MB"
                                }
                                out.write(buffer, 0, n)
                            }
                        }
                    } ?: error("Cannot read selected photo")
                    boundedReference(file).recycle()
                    db.dao().putReference(ReferenceOverride(key, file.path, Calibration().json()))
                    file.path
                }
            }
                .onSuccess {
                    if (key == refKey()) {
                        customReference = it
                        calibration = Calibration()
                        referenceVersion++
                    }
                }
                .onFailure { message = it.message ?: "Reference import failed" }
        }
    }

    fun capture(
        location: Location?,
        cameraId: String?,
        nativeCapture: (File, (Result<Unit>) -> Unit) -> Unit,
    ) {
        if (busy || loading || completed || failedId != null) return
        busy = true
        message = null
        val session = active
        val currentShot = shot
        val c = calibration
        viewModelScope.launch {
            if (session?.demo == true) {
                runCatching { repository.saveDemo(session, requireNotNull(currentShot), catalog) }
                    .onSuccess {
                        active = db.dao().session(session.id)
                        message = "Demo photo saved in this app"
                    }
                    .onFailure { message = it.message }
                busy = false
                return@launch
            }
            val vehicle = session?.let { Vehicle.parse(it.vehicle) } ?: Vehicle(body = "")
            val metadata =
                captureMetadata(
                        vehicle,
                        session,
                        currentShot,
                        System.currentTimeMillis(),
                        if (geotag) location else null,
                        cameraId,
                        c,
                        catalog.revision,
                    )
                    .put("photoRatio", if (ratioWide) "16:9" else "4:3")
            val job = runCatching {
                repository.begin(session, currentShot, metadata)
            }
                .getOrElse {
                    message = it.message
                    busy = false
                    return@launch
                }
            nativeCapture(File(job.tempPath)) { result ->
                viewModelScope.launch {
                    result.fold(
                        onSuccess = {
                            runCatching {
                                repository.captured(job)
                                repository.publish(job.id)
                            }
                                .onSuccess {
                                    if (session != null && active?.id == session.id)
                                        active = db.dao().session(session.id)
                                    message = "Saved to device gallery"
                                    failedId = null
                                }
                                .onFailure {
                                    repository.failure(job, it.message ?: "Save failed")
                                    failedId = job.id
                                    message = "Photo retained. ${it.message}"
                                }
                        },
                        onFailure = {
                            repository.failure(job, it.message ?: "Capture failed")
                            message = "Capture failed. ${it.message}"
                        },
                    )
                    busy = false
                }
            }
        }
    }

    fun retry() {
        val id = failedId ?: return
        if (busy) return
        busy = true
        viewModelScope.launch {
            runCatching { repository.publish(id) }
                .onSuccess {
                    failedId = null
                    message = "Saved to device gallery"
                }
                .onFailure { message = it.message }
            busy = false
        }
    }

    fun retakeFailed() {
        val id = failedId ?: return
        if (busy) return
        viewModelScope.launch {
            db.dao().photo(id)?.let { db.dao().putPhoto(it.copy(state = "retained")) }
            failedId = null
            message = "Original retained privately. You can retake this shot."
        }
    }
}
