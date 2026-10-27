package com.diabdoesdata.smartcapture

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.view.Surface
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.*
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.extensions.ExtensionMode
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.CameraController
import androidx.camera.view.LifecycleCameraController
import androidx.camera.view.PreviewView
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.io.File
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.sqrt

@androidx.annotation.OptIn(markerClass=[androidx.camera.camera2.interop.ExperimentalCamera2Interop::class])
class NativeCamera(private val context:Context,private val owner:LifecycleOwner) {
    val controller=LifecycleCameraController(context)
    private val main=ContextCompat.getMainExecutor(context)
    private val analysis=Executors.newSingleThreadExecutor()
    private var detector:VehicleDetector?=null
    private var extensions:ExtensionsManager?=null
    private var selector=CameraSelector.DEFAULT_BACK_CAMERA
    private var analysisEnabled=false
    private var vinCallback:((String)->Unit)?=null
    private val scanning=java.util.concurrent.atomic.AtomicBoolean(false)
    private val barcodeScanner=com.google.mlkit.vision.barcode.BarcodeScanning.getClient(
        com.google.mlkit.vision.barcode.BarcodeScannerOptions.Builder().setBarcodeFormats(
            com.google.mlkit.vision.barcode.common.Barcode.FORMAT_CODE_39,
            com.google.mlkit.vision.barcode.common.Barcode.FORMAT_CODE_128,
            com.google.mlkit.vision.barcode.common.Barcode.FORMAT_PDF417).build())
    var ready by mutableStateOf(false);private set
    var error by mutableStateOf<String?>(null);private set
    var flash by mutableIntStateOf(ImageCapture.FLASH_MODE_OFF);private set
    var hasFlash by mutableStateOf(false);private set
    var minZoom by mutableFloatStateOf(1f);private set
    var maxZoom by mutableFloatStateOf(1f);private set
    var zoom by mutableFloatStateOf(1f);private set
    var exposureMin by mutableIntStateOf(0);private set
    var exposureMax by mutableIntStateOf(0);private set
    var exposure by mutableIntStateOf(0);private set
    var cameraId by mutableStateOf<String?>(null);private set
    var cameraIds by mutableStateOf(emptyList<String>());private set
    var hdrAvailable by mutableStateOf(false);private set
    var hdr by mutableStateOf(false);private set
    var focusState by mutableIntStateOf(CameraController.TAP_TO_FOCUS_NOT_STARTED);private set
    var detectionAvailable by mutableStateOf(true);private set
    var frameKey=""
    var onDetection:((String,VehicleBox?)->Unit)?=null
    init {
        controller.imageCaptureMode=ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY
        controller.imageCaptureFlashMode=flash
        controller.imageAnalysisBackpressureStrategy=ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST
        controller.setEnabledUseCases(CameraController.IMAGE_CAPTURE)
        ratio(false)
        controller.initializationFuture.addListener({
            runCatching {
                controller.initializationFuture.get()
                val providerFuture=ProcessCameraProvider.getInstance(context)
                providerFuture.addListener({
                    runCatching {
                        val provider=providerFuture.get()
                        cameraIds=provider.availableCameraInfos.filter { it.lensFacing==CameraSelector.LENS_FACING_BACK }.map { Camera2CameraInfo.from(it).cameraId }
                        val ext=ExtensionsManager.getInstanceAsync(context,provider)
                        ext.addListener({runCatching { extensions=ext.get();hdrAvailable=extensions?.isExtensionAvailable(selector,ExtensionMode.HDR)==true }},main)
                    }
                },main)
                observe()
            }.onFailure { error="Camera unavailable. ${it.cause?.message ?: it.message}";ready=false }
        },main)
        controller.tapToFocusState.observe(owner) { focusState=it }
    }
    fun connect(preview:PreviewView) {
        preview.implementationMode=PreviewView.ImplementationMode.COMPATIBLE
        preview.scaleType=PreviewView.ScaleType.FIT_CENTER
        preview.controller=controller
        bind()
    }
    fun bind(){runCatching { error=null;controller.bindToLifecycle(owner);observe() }.onFailure { ready=false;error="Cannot open camera. ${it.message}" }}
    private fun observe() {
        val info=controller.cameraInfo ?: return
        hasFlash=info.hasFlashUnit()
        cameraId=Camera2CameraInfo.from(info).cameraId
        val exp=info.exposureState;exposureMin=exp.exposureCompensationRange.lower;exposureMax=exp.exposureCompensationRange.upper;exposure=exp.exposureCompensationIndex
        info.zoomState.removeObservers(owner)
        info.zoomState.observe(owner) { z -> minZoom=z.minZoomRatio;maxZoom=z.maxZoomRatio;zoom=z.zoomRatio }
        info.cameraState.removeObservers(owner)
        info.cameraState.observe(owner) { s ->
            ready=s.type==CameraState.Type.OPEN && s.error==null
            error=s.error?.let { "Camera unavailable (${it.code}). Close other camera apps and retry." }
        }
    }
    fun ratio(wide:Boolean) {
        controller.imageCaptureResolutionSelector=ResolutionSelector.Builder()
            .setAspectRatioStrategy(if(wide)AspectRatioStrategy.RATIO_16_9_FALLBACK_AUTO_STRATEGY else AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
            .setResolutionStrategy(ResolutionStrategy.HIGHEST_AVAILABLE_STRATEGY).build()
    }
    fun setZoom(value:Float){runCatching { controller.setZoomRatio(value.coerceIn(minZoom,maxZoom)) }.onFailure { error=it.message }}
    fun cycleFlash(){if(!hasFlash)return;flash=when(flash){ImageCapture.FLASH_MODE_OFF->ImageCapture.FLASH_MODE_AUTO;ImageCapture.FLASH_MODE_AUTO->ImageCapture.FLASH_MODE_ON;else->ImageCapture.FLASH_MODE_OFF};controller.imageCaptureFlashMode=flash}
    fun setExposure(value:Int){controller.cameraControl?.setExposureCompensationIndex(value.coerceIn(exposureMin,exposureMax))?.let { f -> f.addListener({runCatching { exposure=f.get() }.onFailure { error="Exposure unavailable" }},main) }}
    fun switchCamera(id:String){
        if(id !in cameraIds)return
        runCatching {
            selector=CameraSelector.Builder().addCameraFilter { infos -> infos.filter { Camera2CameraInfo.from(it).cameraId==id } }.build()
            hdr=false;controller.cameraSelector=selector;hdrAvailable=extensions?.isExtensionAvailable(selector,ExtensionMode.HDR)==true
            configureAnalysis(analysisEnabled);observe()
        }.onFailure { error="Lens unavailable. ${it.message}";selector=CameraSelector.DEFAULT_BACK_CAMERA;controller.cameraSelector=selector;observe() }
    }
    fun setHdr(enabled:Boolean){if(enabled && !hdrAvailable)return
        runCatching {
            hdr=enabled
            controller.setEnabledUseCases(CameraController.IMAGE_CAPTURE)
            controller.cameraSelector=if(enabled)requireNotNull(extensions).getExtensionEnabledCameraSelector(selector,ExtensionMode.HDR) else selector
            configureAnalysis(analysisEnabled);observe()
        }.onFailure { hdr=false;controller.cameraSelector=selector;configureAnalysis(analysisEnabled);error="HDR unavailable; using standard photo" }
    }
    fun configureAnalysis(enabled:Boolean){
        analysisEnabled=enabled
        if((!enabled && vinCallback==null) || hdr){controller.clearImageAnalysisAnalyzer();controller.setEnabledUseCases(CameraController.IMAGE_CAPTURE);return}
        runCatching {
            if(detector==null)detector=VehicleDetector(context) { box -> val key=deliveryKey;main.execute { onDetection?.invoke(key,box) } }
            controller.setImageAnalysisAnalyzer(analysis,object:ImageAnalysis.Analyzer {
                override fun analyze(image:ImageProxy){
                    if(vinCallback!=null){scanFrame(image);return}
                    val key=frameKey
                    // Snapshot before processing; an old result can never be relabeled as a new shot.
                    val d=detector
                    if(d==null)image.close() else {
                        val previous=deliveryKey;deliveryKey=key
                        try { d.analyze(image) } finally { deliveryKey=previous }
                    }
                }
            })
            controller.setEnabledUseCases(CameraController.IMAGE_CAPTURE or CameraController.IMAGE_ANALYSIS)
        }.onFailure { detectionAvailable=false;controller.clearImageAnalysisAnalyzer();controller.setEnabledUseCases(CameraController.IMAGE_CAPTURE) }
    }
    @Volatile private var deliveryKey=""
    fun startVinScan(callback:(String)->Unit){
        if(hdr)setHdr(false)
        vinCallback=callback;configureAnalysis(analysisEnabled)
    }
    fun stopVinScan(){vinCallback=null;configureAnalysis(analysisEnabled)}
    @androidx.annotation.OptIn(markerClass=[androidx.camera.core.ExperimentalGetImage::class])
    private fun scanFrame(image:ImageProxy){
        if(!scanning.compareAndSet(false,true)){image.close();return}
        val media=image.image
        if(media==null){scanning.set(false);image.close();return}
        barcodeScanner.process(com.google.mlkit.vision.common.InputImage.fromMediaImage(media,image.imageInfo.rotationDegrees))
            .addOnSuccessListener(main){codes ->
                val vin=codes.mapNotNull { it.rawValue }.map(CaptureRules::normalizeVin).firstOrNull(CaptureRules::validVin)
                if(vin!=null)vinCallback?.invoke(vin)
            }.addOnCompleteListener { image.close();scanning.set(false) }
    }
    fun capture(file:File,callback:(Result<Unit>)->Unit){
        if(!ready){callback(Result.failure(IllegalStateException("Camera is not ready")));return}
        runCatching { controller.takePicture(ImageCapture.OutputFileOptions.Builder(file).build(),main,object:ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output:ImageCapture.OutputFileResults){callback(Result.success(Unit))}
            override fun onError(exception:ImageCaptureException){callback(Result.failure(exception))}
        }) }.onFailure { callback(Result.failure(it)) }
    }
    fun close(){vinCallback=null;controller.clearImageAnalysisAnalyzer();controller.unbind();analysis.execute { detector?.close();detector=null;barcodeScanner.close() };analysis.shutdown()}
}

class LevelReader(context:Context,private val rotation:()->Int,private val callback:(Float?,Long)->Unit):SensorEventListener {
    private val manager=context.getSystemService(SensorManager::class.java)
    private val sensor=manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    fun start(){sensor?.let { manager.registerListener(this,it,SensorManager.SENSOR_DELAY_UI) }}
    fun stop(){manager.unregisterListener(this)}
    override fun onAccuracyChanged(sensor:Sensor?,accuracy:Int){}
    override fun onSensorChanged(event:SensorEvent){
        val x=event.values[0];val y=event.values[1];val z=event.values[2]
        val upright=sqrt(x*x+y*y)>4f && abs(z)<8f
        val (sx,sy)=when(rotation()){Surface.ROTATION_90->-y to x;Surface.ROTATION_180->-x to -y;Surface.ROTATION_270->y to -x;else->x to y}
        callback(if(upright)Math.toDegrees(atan2(sx.toDouble(),sy.toDouble())).toFloat() else null,android.os.SystemClock.elapsedRealtime())
    }
}
