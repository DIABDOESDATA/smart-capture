package com.diabdoesdata.smartcapture

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.camera.core.ImageCapture
import androidx.camera.view.CameraController
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.os.CancellationSignal
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.math.abs

internal val Ink=Color(0xFF0B0D11)
internal val Panel=Color(0xFF1B1E24)
internal val Accent=Color(0xFFDCE9B5)
internal val Muted=Color(0xFFBDC1C9)

class MainActivity:ComponentActivity() {
    private val model:CameraViewModel by viewModels()
    override fun onCreate(savedInstanceState:Bundle?){
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window,false)
        WindowInsetsControllerCompat(window,window.decorView).apply {
            systemBarsBehavior=WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
        setContent {
            MaterialTheme(colorScheme=darkColorScheme(primary=Accent,onPrimary=Ink,background=Ink,surface=Panel,onSurface=Color.White)) {
                CameraApp(model)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun CameraApp(vm:CameraViewModel) {
    val context=LocalContext.current
    val owner=LocalLifecycleOwner.current
    val view=LocalView.current
    var granted by remember { mutableStateOf(ContextCompat.checkSelfPermission(context,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED) }
    val permission=rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()){granted=it}
    var sheet by rememberSaveableState("none")
    var selectedPhoto by remember { mutableStateOf<Photo?>(null) }
    var draft by remember { mutableStateOf(Vehicle()) }
    var scanningVin by remember { mutableStateOf(false) }
    var location by remember { mutableStateOf<Location?>(null) }
    var locationText by remember { mutableStateOf("Location off") }
    val locationPermission=rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val enabled=result.values.any { it };vm.setGeotag(enabled)
        if(!enabled)vm.message="Location permission denied. Photos will have no added GPS tag."
    }
    val camera=if(granted && vm.active?.demo!=true) remember(context,owner) { NativeCamera(context,owner) } else null
    DisposableEffect(camera){onDispose { camera?.close() }}
    DisposableEffect(owner){val observer=LifecycleEventObserver { _,event ->
        if(event==Lifecycle.Event.ON_RESUME)granted=ContextCompat.checkSelfPermission(context,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED
    };owner.lifecycle.addObserver(observer);onDispose { owner.lifecycle.removeObserver(observer) }}
    LaunchedEffect(vm.geotag,owner.lifecycle.currentState) {
        if(!vm.geotag){location=null;locationText="Location off";return@LaunchedEffect}
        while(true){
            val allowed=ContextCompat.checkSelfPermission(context,Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED
            if(!allowed){vm.setGeotag(false);location=null;break}
            val manager=context.getSystemService(LocationManager::class.java)
            val provider=if(manager.isProviderEnabled(LocationManager.GPS_PROVIDER))LocationManager.GPS_PROVIDER else LocationManager.NETWORK_PROVIDER
            runCatching {
                @Suppress("MissingPermission")
                LocationManagerCompat.getCurrentLocation(manager,provider,null,ContextCompat.getMainExecutor(context)){fix ->
                    location=usableLocation(fix);locationText=if(location==null)"No recent location — GPS omitted" else "Location ready · ${fix?.accuracy?.toInt()} m"
                }
            }.onFailure { location=null;locationText="Location unavailable — GPS omitted" }
            delay(45_000)
        }
    }
    var detected by remember { mutableStateOf<VehicleBox?>(null) }
    val filter=remember { GuidanceFilter() }
    val configuration=LocalConfiguration.current
    val landscape=configuration.screenWidthDp>configuration.screenHeightDp
    val frameKey="${vm.active?.id}:${vm.shot?.code}:${configuration.orientation}:${camera?.cameraId}:${camera?.zoom}:${vm.ratioWide}"
    LaunchedEffect(frameKey){detected=null;filter.reset(frameKey);camera?.frameKey=frameKey;vm.loadReference()}
    SideEffect { camera?.onDetection={key,box -> detected=filter.update(key,box,android.os.SystemClock.elapsedRealtime())} }
    LaunchedEffect(camera,vm.shot?.detectorEligible,vm.active?.demo){camera?.configureAnalysis(vm.shot?.detectorEligible==true)}
    LaunchedEffect(camera,vm.ratioWide){camera?.ratio(vm.ratioWide)}
    var clock by remember { mutableLongStateOf(0L) }
    LaunchedEffect(Unit){while(true){clock=android.os.SystemClock.elapsedRealtime();delay(400)}}
    var roll by remember { mutableStateOf<Float?>(null) };var rollAt by remember { mutableLongStateOf(0L) }
    DisposableEffect(context,view){val level=LevelReader(context,{view.display?.rotation ?: 0}){angle,at -> roll=angle;rollAt=at};level.start();onDispose{level.stop()}}
    val instruction=when {
        vm.active?.demo==true -> "Demo · photographic guide only"
        vm.shot==null -> "Tap to focus · press the shutter"
        vm.shot?.detectorEligible!=true -> vm.shot?.instruction ?: ""
        camera?.hdr==true || camera?.detectionAvailable==false -> "Use the photo guide to frame the vehicle"
        else -> filter.instruction(detected,clock)
    }
    val picker=rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()){uri -> uri?.let(vm::importReference)}
    val recent=vm.photos.firstOrNull { it.state=="saved" && (it.source=="demo")== (vm.active?.demo==true) }
    BackHandler(sheet!="none" || selectedPhoto!=null){if(selectedPhoto!=null)selectedPhoto=null else sheet="none"}
    val shutter={
        view.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK)
        vm.capture(location,camera?.cameraId){file,done -> if(camera!=null)camera.capture(file,done) else done(Result.failure(IllegalStateException("Allow camera access first"))) }
    }
    Surface(Modifier.fillMaxSize(),color=Ink) {
        Box(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
            if(landscape)Row(Modifier.fillMaxSize()) {
                CameraFrame(vm,camera,Modifier.weight(1f).fillMaxHeight(),landscape,instruction,roll.takeIf { clock-rollAt in 0..1500 },{sheet="sessions"},{sheet="settings"},granted,{permission.launch(Manifest.permission.CAMERA)})
                Controls(vm,camera,recent,true,shutter,{photo -> openPhoto(context,photo){selectedPhoto=photo}},{sheet="shots"},{sheet="sessions"})
            } else Column(Modifier.fillMaxSize()) {
                CameraFrame(vm,camera,Modifier.weight(1f).fillMaxWidth(),landscape,instruction,roll.takeIf { clock-rollAt in 0..1500 },{sheet="sessions"},{sheet="settings"},granted,{permission.launch(Manifest.permission.CAMERA)})
                Controls(vm,camera,recent,false,shutter,{photo -> openPhoto(context,photo){selectedPhoto=photo}},{sheet="shots"},{sheet="sessions"})
            }
            vm.message?.let { message ->
                LaunchedEffect(message){delay(4500);if(vm.message==message)vm.message=null}
                Surface(Modifier.align(Alignment.BottomCenter).padding(bottom=if(landscape)16.dp else 160.dp,start=12.dp,end=12.dp),color=Panel,shape=RoundedCornerShape(16.dp),shadowElevation=8.dp) {
                    Row(Modifier.padding(horizontal=16.dp,vertical=8.dp),verticalAlignment=Alignment.CenterVertically){
                        Text(message,Modifier.weight(1f,false),fontSize=13.sp)
                        if(vm.failedId!=null)TextButton(onClick=vm::retry,enabled=!vm.busy){Text("Retry save")}
                        else if(message.startsWith("Saved") && vm.active!=null)TextButton(onClick={vm.navigate((vm.active?.cursor ?: 1)-1);vm.message="Retake this shot. Both gallery originals are kept."}){Text("Retake")}
                    }
                }
            }
            if(scanningVin)Surface(Modifier.align(Alignment.TopCenter).padding(top=70.dp),color=Panel,shape=RoundedCornerShape(20.dp)) {
                Row(Modifier.padding(12.dp),verticalAlignment=Alignment.CenterVertically){Text("Point at the VIN barcode",Modifier.padding(8.dp));TextButton(onClick={scanningVin=false;camera?.stopVinScan();sheet="sessions"}){Text("Cancel scan")}}
            }
        }
    }
    if(sheet!="none")ModalBottomSheet(onDismissRequest={sheet="none"},containerColor=Panel) {
        when(sheet){
            "sessions"->SessionSheet(vm,draft,onDraft={draft=it},onScan={
                if(camera?.ready==true){sheet="none";scanningVin=true;camera.startVinScan { vin -> draft=draft.copy(vin=vin);scanningVin=false;camera.stopVinScan();sheet="sessions" }}
                else vm.message="Allow camera access and open the camera before scanning a VIN."
            },onClose={sheet="none"},onGallery={sheet="gallery"})
            "settings"->SettingsSheet(vm,camera,locationText,onLocation={enabled ->
                if(enabled)locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION)) else vm.setGeotag(false)
            },onReferences={sheet="references"},onGallery={sheet="gallery"})
            "shots"->ShotSheet(vm){sheet="none"}
            "references"->ReferenceSheet(vm,onImport={picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))})
            "gallery"->GallerySheet(vm){selectedPhoto=it}
        }
    }
    selectedPhoto?.let { photo -> androidx.compose.ui.window.Dialog(onDismissRequest={selectedPhoto=null},properties=androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth=false)) {
        Surface(Modifier.fillMaxSize(),color=Ink){Column(Modifier.fillMaxSize().safeDrawingPadding()) {
            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){IconButton(onClick={selectedPhoto=null}){Icon(Icons.Outlined.Close,"Close photo")};Text(if(photo.source=="demo")"Demo photo" else "Saved photograph",fontWeight=FontWeight.SemiBold)}
            AsyncImage(photo.uri,null,Modifier.weight(1f).fillMaxWidth(),contentScale=ContentScale.Fit)
            Text("${photo.width} × ${photo.height} · ${photo.bytes/1024} KB\n${photo.displayName}\n${if(photo.source=="demo")"Private demo storage" else "DCIM/SmartCapture · saved in ${photo.elapsedMs} ms"}",Modifier.padding(20.dp),color=Muted,fontSize=12.sp)
        }}
    } }
}

// Saved across activity recreation; camera/session state belongs to the ViewModel/Room.
@Composable private fun rememberSaveableState(initial:String)=androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(initial) }

@Composable private fun CameraFrame(vm:CameraViewModel,camera:NativeCamera?,modifier:Modifier,landscape:Boolean,instruction:String,roll:Float?,onSessions:()->Unit,onSettings:()->Unit,granted:Boolean,onPermission:()->Unit) {
    BoxWithConstraints(modifier.background(Color.Black)) {
        val photoRatio=if(vm.ratioWide)16f/9f else 4f/3f
        val ratio=if(landscape)photoRatio else 1f/photoRatio
        val width=if(maxWidth/maxHeight>ratio)maxHeight*ratio else maxWidth
        val height=width/ratio
        val shot=vm.shot
        val bitmap by produceState<Bitmap?>(null,shot?.code,vm.body,vm.referenceVersion,vm.customReference) {
            value=withContext(Dispatchers.IO){runCatching { vm.customReference?.let { boundedReference(File(it)) } ?: shot?.let { vm.catalog.bitmap(it,vm.body) } }.getOrNull()}
        }
        Box(Modifier.align(Alignment.Center).size(width,height).semantics { contentDescription="Native photo framing ${if(vm.ratioWide)"16:9" else "4:3"}" }) {
            var touch by remember { mutableStateOf<Offset?>(null) }
            if(vm.active?.demo==true)bitmap?.let { Image(it.asImageBitmap(),"Demo scene: ${shot?.name}",Modifier.fillMaxSize(),contentScale=ContentScale.Fit) }
            else if(camera!=null)AndroidView(factory={ctx -> PreviewView(ctx).apply {
                camera.connect(this)
                setOnTouchListener { _,event -> if(event.action==MotionEvent.ACTION_UP)touch=Offset(event.x,event.y);false }
            }},modifier=Modifier.fillMaxSize())
            if(vm.referenceVisible && vm.active?.demo!=true)bitmap?.let { ReferenceImage(it,vm.calibration) }
            if(touch!=null && camera!=null){
                LaunchedEffect(touch){delay(1700);touch=null}
                Canvas(Modifier.fillMaxSize()){touch?.let { p -> drawCircle(if(camera.focusState==CameraController.TAP_TO_FOCUS_FOCUSED)Accent else Color.White,24.dp.toPx(),p,style=androidx.compose.ui.graphics.drawscope.Stroke(1.5.dp.toPx())) }}
            }
            if(!granted && vm.active?.demo!=true)Column(Modifier.align(Alignment.Center).padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(16.dp)) {
                Icon(Icons.Outlined.CameraAlt,null,Modifier.size(48.dp),tint=Accent)
                Text("Smart Capture",fontSize=25.sp,fontWeight=FontWeight.SemiBold)
                Text("A clear view. A better photograph.",color=Muted,textAlign=TextAlign.Center)
                Button(onClick=onPermission){Text("Allow camera access")}
                TextButton(onClick=onSessions){Text("Explore demo guides")}
            }
            if(camera?.error!=null)Surface(Modifier.align(Alignment.Center).padding(24.dp),color=Panel,shape=RoundedCornerShape(20.dp)) {
                Column(Modifier.padding(20.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(camera.error ?: "",textAlign=TextAlign.Center);TextButton(onClick=camera::bind){Text("Retry camera")}}
            }
            if(vm.completed)Surface(Modifier.align(Alignment.Center).padding(24.dp),color=Panel.copy(alpha=.94f),shape=RoundedCornerShape(24.dp)) {
                Column(Modifier.padding(28.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp)) {
                    Icon(Icons.Outlined.CheckCircle,null,Modifier.size(40.dp),tint=Accent)
                    Text("Walkaround complete",fontSize=23.sp,fontWeight=FontWeight.SemiBold)
                    Text(if(vm.active?.demo==true)"Demo photos stay in this app." else "Your photographs are in the device gallery.",color=Muted,textAlign=TextAlign.Center)
                    Button(onClick=vm::quick){Text("Quick Camera")};TextButton(onClick=onSessions){Text("Another vehicle")}
                }
            }
            if(granted || vm.active?.demo==true)Column(Modifier.align(Alignment.BottomCenter).padding(horizontal=12.dp,vertical=14.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(8.dp)) {
                if(camera!=null && camera.maxZoom>camera.minZoom)Row(Modifier.background(Ink.copy(alpha=.65f),CircleShape).padding(3.dp),horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                    val presets=(listOf(camera.minZoom,1f,2f,5f).filter { it>=camera.minZoom && it<=camera.maxZoom }.distinctBy { (it*10).toInt() }).take(5)
                    presets.forEach { z -> TextButton(onClick={camera.setZoom(z)},enabled=!vm.busy,colors=ButtonDefaults.textButtonColors(contentColor=if(abs(camera.zoom-z)<.15f)Accent else Color.White),contentPadding=PaddingValues(8.dp),modifier=Modifier.sizeIn(minWidth=48.dp,minHeight=48.dp)) {Text(if(z==z.toInt().toFloat())"${z.toInt()}×" else "${"%.1f".format(z)}×",fontWeight=FontWeight.SemiBold)} }
                }
                if(!vm.completed)Surface(color=Ink.copy(alpha=.78f),shape=RoundedCornerShape(14.dp)) {
                    Row(Modifier.padding(horizontal=12.dp,vertical=9.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                        if(roll!=null && vm.active?.demo!=true)Icon(Icons.Outlined.HorizontalRule,if(abs(roll)<2f)"Phone level" else "Level phone",Modifier.size(20.dp).graphicsLayer { rotationZ=-roll.coerceIn(-30f,30f) },tint=if(abs(roll)<2f)Accent else Color.White)
                        Text(instruction,fontSize=12.sp,maxLines=3,textAlign=TextAlign.Center)
                    }
                }
            }
        }
        Row(Modifier.align(Alignment.TopCenter).fillMaxWidth().background(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(Ink.copy(alpha=.85f),Color.Transparent))).padding(6.dp),verticalAlignment=Alignment.CenterVertically) {
            IconButton(onClick=onSessions,enabled=!vm.busy){Icon(Icons.Outlined.DirectionsCar,"Camera modes")}
            Column(Modifier.weight(1f)){Text(if(vm.active?.demo==true)"DEMO · ${vm.body.uppercase()}" else if(vm.active==null)"SMART CAPTURE" else Vehicle.parse(vm.active!!.vehicle).title().ifBlank { "GUIDED CAMERA" },fontSize=12.sp,fontWeight=FontWeight.SemiBold,maxLines=1);Text(if(vm.active==null)"Quick Camera" else "${(vm.active!!.cursor+1).coerceAtMost(vm.sequence.size)} / ${vm.sequence.size} · ${shot?.name ?: "Complete"}",fontSize=11.sp,color=Muted,maxLines=1)}
            if(camera?.hasFlash==true)IconButton(onClick=camera::cycleFlash,enabled=!vm.busy){Icon(when(camera.flash){ImageCapture.FLASH_MODE_AUTO->Icons.Outlined.FlashAuto;ImageCapture.FLASH_MODE_ON->Icons.Outlined.FlashOn;else->Icons.Outlined.FlashOff},"Flash ${when(camera.flash){ImageCapture.FLASH_MODE_AUTO->"auto";ImageCapture.FLASH_MODE_ON->"on";else->"off"}}")}
            if(shot!=null)IconButton(onClick=vm::toggleReference){Icon(if(vm.referenceVisible)Icons.Outlined.Layers else Icons.Outlined.LayersClear,"Toggle photo guide",tint=if(vm.referenceVisible)Accent else Color.White)}
            IconButton(onClick=onSettings,enabled=!vm.busy){Icon(Icons.Outlined.Tune,"Camera settings")}
        }
    }
}

@Composable private fun ReferenceImage(bitmap:Bitmap,c:Calibration) {
    val crop by remember(bitmap,c.cropLeft,c.cropTop,c.cropRight,c.cropBottom){derivedStateOf {
        val l=(c.cropLeft*bitmap.width).toInt().coerceIn(0,bitmap.width-1);val t=(c.cropTop*bitmap.height).toInt().coerceIn(0,bitmap.height-1)
        val r=(c.cropRight*bitmap.width).toInt().coerceIn(l+1,bitmap.width);val b=(c.cropBottom*bitmap.height).toInt().coerceIn(t+1,bitmap.height)
        if(l==0 && t==0 && r==bitmap.width && b==bitmap.height)bitmap else Bitmap.createBitmap(bitmap,l,t,r-l,b-t)
    }}
    Box(Modifier.fillMaxSize().clip(RoundedCornerShape(0.dp))) {
        Image(crop.asImageBitmap(),"Photographic composition example",Modifier.fillMaxSize().graphicsLayer {
            alpha=c.opacity;scaleX=c.scale*(if(c.mirror)-1 else 1);scaleY=c.scale;translationX=size.width*c.x;translationY=size.height*c.y
        }.then(if(c.ovalMask)Modifier.clip(CircleShape) else Modifier),contentScale=ContentScale.Fit)
    }
}

@Composable private fun Controls(vm:CameraViewModel,camera:NativeCamera?,recent:Photo?,landscape:Boolean,onShutter:()->Unit,onPhoto:(Photo)->Unit,onShots:()->Unit,onModes:()->Unit) {
    val shutterEnabled=!vm.busy && !vm.loading && !vm.completed && vm.failedId==null && (camera?.ready==true || vm.active?.demo==true)
    @Composable fun Shutter(){Box(Modifier.size(86.dp).border(2.dp,Color.White.copy(alpha=if(shutterEnabled)1f else .3f),CircleShape).padding(6.dp).clip(CircleShape).background(if(shutterEnabled)Color.White else Color(0xFF565A60)).clickable(enabled=shutterEnabled,onClick=onShutter).semantics { contentDescription="Take photo" },contentAlignment=Alignment.Center){if(vm.busy)CircularProgressIndicator(Modifier.size(32.dp),color=Ink,strokeWidth=3.dp)}}
    @Composable fun Thumbnail(){Box(Modifier.size(52.dp).clip(RoundedCornerShape(15.dp)).background(Panel).border(1.dp,Color.White.copy(alpha=.2f),RoundedCornerShape(15.dp)).clickable(enabled=recent!=null){recent?.let(onPhoto)}.semantics { contentDescription="Open last photo" },contentAlignment=Alignment.Center){if(recent!=null)AsyncImage(recent.uri,null,Modifier.fillMaxSize(),contentScale=ContentScale.Crop) else Icon(Icons.Outlined.PhotoLibrary,null,tint=Muted)}}
    @Composable fun Shots(){IconButton(onClick=if(vm.active==null)onModes else onShots,enabled=!vm.busy){Icon(if(vm.active==null)Icons.Outlined.PhotoCamera else Icons.Outlined.ViewList,if(vm.active==null)"Start guided session" else "Shot list")}}
    if(landscape)Column(Modifier.width(104.dp).fillMaxHeight().background(Ink).padding(vertical=18.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.SpaceBetween){Thumbnail();Shutter();Shots()}
    else Column(Modifier.fillMaxWidth().height(156.dp).background(Ink).padding(horizontal=38.dp,vertical=12.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Thumbnail();Shutter();Shots()}
        Text(if(vm.active==null)"PHOTO" else if(vm.active?.demo==true)"DEMO GUIDE" else "GUIDED PHOTO",color=Accent,fontSize=11.sp,fontWeight=FontWeight.SemiBold,letterSpacing=2.sp)
    }
}

private fun openPhoto(context:android.content.Context,photo:Photo,fallback:()->Unit){
    if(photo.source=="demo"){fallback();return}
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(Uri.parse(photo.uri),"image/jpeg").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)) }.onFailure { fallback() }
}
