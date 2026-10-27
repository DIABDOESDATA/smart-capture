package com.diabdoesdata.smartcapture

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

@Composable internal fun SheetTitle(title:String,subtitle:String){Column(Modifier.fillMaxWidth().padding(horizontal=24.dp,vertical=12.dp)){Text(title,fontSize=24.sp,fontWeight=FontWeight.SemiBold);Text(subtitle,color=Muted,fontSize=13.sp,modifier=Modifier.padding(top=6.dp))}}

@Composable fun SessionSheet(vm:CameraViewModel,draft:Vehicle,onDraft:(Vehicle)->Unit,onScan:()->Unit,onClose:()->Unit,onGallery:()->Unit) {
    val scope=rememberCoroutineScope()
    var decoding by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var extended by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().heightIn(max=700.dp).verticalScroll(rememberScrollState()).padding(bottom=28.dp)) {
        SheetTitle("Make every angle count","Quick Camera works without vehicle details.")
        Row(Modifier.fillMaxWidth().padding(horizontal=24.dp),horizontalArrangement=Arrangement.spacedBy(12.dp)) {
            Button(onClick={vm.quick();onClose()},modifier=Modifier.weight(1f)){Text("Quick Camera")}
            OutlinedButton(onClick=onGallery,modifier=Modifier.weight(1f)){Text("My photos")}
        }
        Text("GUIDED WALKAROUND",Modifier.padding(24.dp,24.dp,24.dp,12.dp),color=Accent,fontSize=11.sp,letterSpacing=1.5.sp)
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal=20.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            listOf("sedan" to "Sedan","suv" to "SUV","truck" to "Pickup","coupe" to "Coupe","wagon" to "Wagon","convertible" to "Convertible","van" to "Van","classic" to "Classic").forEach { (body,label) -> FilterChip(selected=draft.body==body,onClick={onDraft(draft.copy(body=body))},label={Text(label)}) }
        }
        Column(Modifier.padding(horizontal=24.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
            OutlinedTextField(draft.vin,{onDraft(draft.copy(vin=CaptureRules.normalizeVin(it)));error=null},label={Text("VIN · optional")},singleLine=true,modifier=Modifier.fillMaxWidth(),isError=draft.vin.isNotBlank() && !CaptureRules.validVin(draft.vin))
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick=onScan){Icon(Icons.Outlined.QrCodeScanner,null,Modifier.size(18.dp));Spacer(Modifier.width(8.dp));Text("Scan VIN label")}
                TextButton(enabled=!decoding && CaptureRules.validVin(draft.vin),onClick={
                    decoding=true;error=null;val vin=draft.vin
                    scope.launch {
                        runCatching { decodeVin(vin,draft) }.onSuccess { if(draft.vin==vin)onDraft(it) }.onFailure { error="VIN lookup unavailable. Enter details manually or continue without them." };decoding=false
                    }
                }){Text(if(decoding)"Looking up…" else "Decode VIN")}
            }
            Text("VIN lookup uses NHTSA over the internet. Camera and guides work offline.",fontSize=11.sp,color=Muted)
            error?.let { Text(it,color=MaterialTheme.colorScheme.error,fontSize=12.sp) }
            Row(horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(draft.year,{onDraft(draft.copy(year=it))},label={Text("Year")},modifier=Modifier.weight(.6f),singleLine=true)
                OutlinedTextField(draft.make,{onDraft(draft.copy(make=it))},label={Text("Make")},modifier=Modifier.weight(1f),singleLine=true)
            }
            OutlinedTextField(draft.model,{onDraft(draft.copy(model=it))},label={Text("Model")},modifier=Modifier.fillMaxWidth(),singleLine=true)
            Row(horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(draft.trim,{onDraft(draft.copy(trim=it))},label={Text("Trim")},modifier=Modifier.weight(1f),singleLine=true)
                OutlinedTextField(draft.stock,{onDraft(draft.copy(stock=it))},label={Text("Stock number")},modifier=Modifier.weight(1f),singleLine=true)
            }
            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Text("Include roof and extra views",Modifier.weight(1f),fontSize=13.sp);Switch(extended,{extended=it})}
            Button(onClick={vm.start(draft,extended=extended);onClose()},enabled=draft.vin.isBlank() || CaptureRules.validVin(draft.vin),modifier=Modifier.fillMaxWidth().heightIn(min=52.dp)){Text("Start guided photos")}
        }
        HorizontalDivider(Modifier.padding(24.dp))
        Text("TRY A DEMO",Modifier.padding(horizontal=24.dp),color=Accent,fontSize=11.sp,letterSpacing=1.5.sp)
        Text("Explore a full sequence. Demo photos stay in this app and never enter your device gallery. No live detection is simulated.",Modifier.padding(24.dp,8.dp),fontSize=12.sp,color=Muted)
        Row(Modifier.fillMaxWidth().padding(horizontal=20.dp),horizontalArrangement=Arrangement.spacedBy(6.dp)) {
            listOf("sedan" to "Sedan","suv" to "SUV","truck" to "Pickup").forEach { (body,label) -> OutlinedButton(onClick={vm.start(Vehicle(model="Demo $label",body=body),demo=true,extended=true);onClose()},modifier=Modifier.weight(1f),contentPadding=PaddingValues(8.dp)){Text(label)} }
        }
        if(vm.sessions.isNotEmpty()) {
            Text("RESUME",Modifier.padding(24.dp,24.dp,24.dp,8.dp),color=Accent,fontSize=11.sp,letterSpacing=1.5.sp)
            vm.sessions.take(10).forEach { session -> ListItem(headlineContent={Text((if(session.demo)"Demo · " else "")+Vehicle.parse(session.vehicle).title().ifBlank { session.body.replaceFirstChar(Char::uppercase) })},supportingContent={Text("${session.cursor} completed · ${session.body}")},modifier=Modifier.clickable{vm.select(session);onClose()}) }
        }
    }
}

private suspend fun decodeVin(vin:String,current:Vehicle):Vehicle=withContext(Dispatchers.IO){
    require(CaptureRules.validVin(vin))
    val connection=URL("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/$vin?format=json").openConnection() as HttpURLConnection
    try {
        connection.connectTimeout=10000;connection.readTimeout=12000
        require(connection.responseCode==200)
        val results=JSONObject(connection.inputStream.bufferedReader().use { it.readText() }).getJSONArray("Results").getJSONObject(0)
        fun known(key:String,old:String)=results.optString(key).takeUnless { it.isBlank() || it=="null" || it=="Not Applicable" } ?: old
        current.copy(year=known("ModelYear",current.year),make=known("Make",current.make),model=known("Model",current.model),trim=known("Trim",current.trim))
    } finally { connection.disconnect() }
}

@Composable fun SettingsSheet(vm:CameraViewModel,camera:NativeCamera?,locationText:String,onLocation:(Boolean)->Unit,onReferences:()->Unit,onGallery:()->Unit){
    Column(Modifier.fillMaxWidth().heightIn(max=650.dp).verticalScroll(rememberScrollState()).padding(bottom=28.dp)) {
        SheetTitle("Camera settings","Only capabilities available on this camera are shown.")
        ListItem(headlineContent={Text("Photo framing")},supportingContent={Text("4:3 uses the standard still aspect. 16:9 is a wider crop.")})
        Row(Modifier.padding(horizontal=24.dp),horizontalArrangement=Arrangement.spacedBy(12.dp)){FilterChip(!vm.ratioWide,{vm.setWide(false)},label={Text("4:3")});FilterChip(vm.ratioWide,{vm.setWide(true)},label={Text("16:9")})}
        ListItem(headlineContent={Text("Location tags")},supportingContent={Text(locationText)},trailingContent={Switch(vm.geotag,onLocation)})
        if(camera?.hdrAvailable==true)ListItem(headlineContent={Text("HDR photo")},supportingContent={Text("Supported camera extension. Framing detection pauses while HDR is enabled.")},trailingContent={Switch(camera.hdr,camera::setHdr)})
        if(camera!=null && camera.exposureMax>camera.exposureMin)Column(Modifier.padding(24.dp,8.dp)) {
            Text("Exposure · ${camera.exposure}",fontSize=14.sp)
            Slider(camera.exposure.toFloat(),{camera.setExposure(it.toInt())},valueRange=camera.exposureMin.toFloat()..camera.exposureMax.toFloat(),steps=(camera.exposureMax-camera.exposureMin-1).coerceAtLeast(0))
            TextButton(onClick={camera.setExposure(0)}){Text("Reset exposure")}
        }
        if(camera!=null && camera.cameraIds.size>1) {
            Text("Available rear cameras",Modifier.padding(horizontal=24.dp),fontSize=14.sp)
            Row(Modifier.padding(horizontal=24.dp).horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                camera.cameraIds.forEach { id -> FilterChip(camera.cameraId==id,{camera.switchCamera(id)},label={Text("Camera $id")}) }
            }
        }
        ListItem(headlineContent={Text("Photo guides & adjustment")},supportingContent={Text("Opacity, size, position, crop and your own photo")},trailingContent={Icon(Icons.Outlined.ChevronRight,null)},modifier=Modifier.clickable(onClick=onReferences))
        ListItem(headlineContent={Text("My photos")},supportingContent={Text("Session photographs and private demo examples")},trailingContent={Icon(Icons.Outlined.ChevronRight,null)},modifier=Modifier.clickable(onClick=onGallery))
        Text("Smart Capture ${BuildConfig.VERSION_NAME}\nNative CameraX JPEG · original image pixels retained\nGuides ${vm.catalog.revision} · on-device vehicle framing\nPhotos: DCIM/SmartCapture\nRetakes keep both gallery originals. Geotags require a recent non-mock fix. Camera quality and HDR depend on this device.\n\nEfficientDet-Lite0 model: TensorFlow, Apache 2.0. Bundled photographs are original generated composition examples. No exact interior geometry or camera pose is inferred.",Modifier.padding(24.dp),fontSize=11.sp,color=Muted)
    }
}

@Composable fun ShotSheet(vm:CameraViewModel,onClose:()->Unit){
    Column(Modifier.fillMaxWidth().heightIn(max=650.dp)) {
        SheetTitle("Shot list","Choose a view to retake. Both gallery originals are kept.")
        LazyColumn {
            items(vm.sequence.withIndex().toList(),key={it.index}){entry ->
                val shot=vm.catalog.shot(entry.value)
                val bitmap by produceState<android.graphics.Bitmap?>(null,shot.code,vm.body){value=withContext(Dispatchers.IO){vm.catalog.bitmap(shot,vm.body)}}
                ListItem(headlineContent={Text("${entry.index+1}. ${shot.name}",fontSize=14.sp)},supportingContent={Text(if(entry.index==(vm.active?.cursor ?: -1))"Current shot" else shot.category.replace('_',' '),fontSize=11.sp)},leadingContent={bitmap?.let { Image(it.asImageBitmap(),null,Modifier.size(76.dp,54.dp).background(Ink),contentScale=ContentScale.Fit) }},trailingContent={if(vm.photos.any { it.sessionId==vm.active?.id && it.shot==shot.code && it.state=="saved" })Icon(Icons.Outlined.CheckCircle,null,tint=Accent)},modifier=Modifier.clickable(enabled=!vm.busy){vm.navigate(entry.index);onClose()})
            }
        }
    }
}

@Composable fun ReferenceSheet(vm:CameraViewModel,onImport:()->Unit){
    val c=vm.calibration
    Column(Modifier.fillMaxWidth().heightIn(max=700.dp).verticalScroll(rememberScrollState()).padding(bottom=24.dp)) {
        SheetTitle("Photo guide","${vm.shot?.name ?: "Quick Camera"} · adjustments belong to this session and shot")
        Text("These are composition examples. Interiors and vehicle shapes vary. Guides never appear in the saved camera photograph.",Modifier.padding(horizontal=24.dp),fontSize=12.sp,color=Muted)
        Row(Modifier.padding(24.dp,12.dp),horizontalArrangement=Arrangement.spacedBy(12.dp)){OutlinedButton(onClick=onImport){Text("Use my photo")};TextButton(onClick=vm::resetReference){Text("Reset guide")}}
        Column(Modifier.padding(horizontal=24.dp),verticalArrangement=Arrangement.spacedBy(6.dp)) {
            Text("Opacity · ${(c.opacity*100).toInt()}%",fontSize=12.sp);Slider(c.opacity,{vm.calibrate(c.copy(opacity=it))},valueRange=.05f.. .85f)
            Text("Size",fontSize=12.sp);Slider(c.scale,{vm.calibrate(c.copy(scale=it))},valueRange=.5f..1.8f)
            Text("Left / right",fontSize=12.sp);Slider(c.x,{vm.calibrate(c.copy(x=it))},valueRange=-.35f.. .35f)
            Text("Up / down",fontSize=12.sp);Slider(c.y,{vm.calibrate(c.copy(y=it))},valueRange=-.35f.. .35f)
            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Text("Mirror",Modifier.weight(1f));Switch(c.mirror,{vm.calibrate(c.copy(mirror=it))})}
            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Text("Oval mask",Modifier.weight(1f));Switch(c.ovalMask,{vm.calibrate(c.copy(ovalMask=it))})}
            Text("Crop left / top",fontSize=12.sp)
            Slider(c.cropLeft,{vm.calibrate(c.copy(cropLeft=it))},valueRange=0f..minOf(.45f,c.cropRight-.1f))
            Slider(c.cropTop,{vm.calibrate(c.copy(cropTop=it))},valueRange=0f..minOf(.45f,c.cropBottom-.1f))
            Text("Crop right / bottom",fontSize=12.sp)
            Slider(c.cropRight,{vm.calibrate(c.copy(cropRight=it))},valueRange=maxOf(.55f,c.cropLeft+.1f)..1f)
            Slider(c.cropBottom,{vm.calibrate(c.copy(cropBottom=it))},valueRange=maxOf(.55f,c.cropTop+.1f)..1f)
        }
    }
}

@Composable fun GallerySheet(vm:CameraViewModel,onPhoto:(Photo)->Unit){
    val photos=vm.photos.filter { it.state=="saved" }
    Column(Modifier.fillMaxWidth().heightIn(max=700.dp)) {
        SheetTitle("My photos","Camera originals are also in the device gallery. Demo images are private.")
        if(photos.isEmpty())Text("Your photographs will appear here.",Modifier.padding(24.dp),color=Muted)
        LazyVerticalGrid(GridCells.Adaptive(120.dp),contentPadding=PaddingValues(12.dp),horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            items(photos,key={it.id}){photo -> Column(Modifier.clickable{onPhoto(photo)}) {
                AsyncImage(photo.uri,photo.shot,Modifier.fillMaxWidth().aspectRatio(1f).background(Ink),contentScale=ContentScale.Crop)
                Text(if(photo.source=="demo")"DEMO · ${vm.catalog.shot(photo.shot).name}" else if(photo.shot=="QUICK_CAMERA")"Quick Camera" else vm.catalog.shot(photo.shot).name,maxLines=2,fontSize=11.sp,modifier=Modifier.padding(4.dp))
            } }
        }
    }
}
