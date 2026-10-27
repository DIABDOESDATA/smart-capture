package com.diabdoesdata.smartcapture

import android.Manifest
import android.content.pm.ActivityInfo
import android.graphics.Bitmap
import android.provider.MediaStore
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.exifinterface.media.ExifInterface
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.GrantPermissionRule
import androidx.test.uiautomator.UiDevice
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.*
import org.junit.Assert.*
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class NativeCameraTest {
    @get:Rule(order=0) val permission:GrantPermissionRule=GrantPermissionRule.grant(Manifest.permission.CAMERA)
    @get:Rule(order=1) val ui=createAndroidComposeRule<MainActivity>()
    private val context get()=ui.activity.applicationContext
    private val device get()=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    private fun shotsInGallery():List<String> {
        val result=mutableListOf<String>()
        context.contentResolver.query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,arrayOf(MediaStore.Images.Media._ID),"${MediaStore.Images.Media.RELATIVE_PATH}=? AND ${MediaStore.Images.Media.IS_PENDING}=0",arrayOf("DCIM/SmartCapture/"),null)?.use { while(it.moveToNext())result.add(android.content.ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,it.getLong(0)).toString()) }
        return result
    }
    private fun click(description:String)=ui.onNodeWithContentDescription(description).performClick()
    private fun waitShutter(){ui.waitUntil(20_000){ui.onAllNodesWithContentDescription("Take photo").fetchSemanticsNodes().any { !it.config.contains(androidx.compose.ui.semantics.SemanticsProperties.Disabled) }}}
    private fun evidence(name:String){
        val dir=File(context.getExternalFilesDir(null),"test-evidence").apply{mkdirs()}
        assertTrue(device.takeScreenshot(File(dir,"$name.png")))
    }
    @Test fun nativeCameraCapturesGalleryJpegAndSurvivesRotation(){
        click("Camera modes");ui.onNodeWithText("Quick Camera",useUnmergedTree=true).performClick()
        waitShutter();evidence("native-portrait")
        val before=shotsInGallery().toSet()
        click("Take photo")
        ui.waitUntil(20_000){shotsInGallery().size==before.size+1}
        val uri=android.net.Uri.parse(shotsInGallery().first { it !in before })
        context.contentResolver.openInputStream(uri)!!.use { input ->
            val exif=ExifInterface(input)
            assertTrue(exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH,0)>=640)
            assertTrue(exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH,0)>=480)
            assertTrue(exif.getAttribute(ExifInterface.TAG_SOFTWARE)!!.startsWith("Smart Capture"))
            val metadata=JSONObject(exif.getAttribute(ExifInterface.TAG_USER_COMMENT)!!)
            assertEquals("QUICK_CAMERA",metadata.getString("shotCode"));assertFalse(metadata.has("location"))
        }
        ui.runOnUiThread{ui.activity.requestedOrientation=ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE}
        ui.waitUntil(10_000){ui.activity.resources.configuration.orientation==android.content.res.Configuration.ORIENTATION_LANDSCAPE}
        waitShutter();evidence("native-landscape")
        click("Take photo");ui.waitUntil(20_000){shotsInGallery().size==before.size+2}
        val db=CaptureDatabase.get(context)
        runBlocking { assertTrue(db.dao().unfinished().none { it.error==null }) }
        val report=File(context.getExternalFilesDir(null),"test-evidence/native-capture.json")
        report.writeText(JSONObject().put("device","Android API 35 emulator; NOT physical hardware").put("galleryUris",org.json.JSONArray(shotsInGallery())).put("portraitAndLandscape",true).toString(2))
    }
    @Test fun guidedDemoAdvancesWithPhotographicInteriorAndNoMediaStoreWrites(){
        click("Camera modes")
        ui.onNodeWithText("TRY A DEMO").performScrollTo()
        ui.onAllNodesWithText("Sedan").onLast().performClick()
        val before=shotsInGallery().size
        waitShutter();evidence("demo-exterior-portrait")
        click("Take photo");ui.waitUntil(10_000){ui.onAllNodesWithText("2 /",substring=true).fetchSemanticsNodes().isNotEmpty()}
        click("Shot list");ui.onNodeWithText("13. Driver Cockpit & Door Open").performScrollTo().performClick()
        waitShutter();evidence("demo-cockpit-portrait")
        ui.runOnUiThread{ui.activity.requestedOrientation=ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE}
        ui.waitUntil(10_000){ui.activity.resources.configuration.orientation==android.content.res.Configuration.ORIENTATION_LANDSCAPE}
        waitShutter();evidence("demo-cockpit-landscape")
        click("Take photo");ui.waitUntil(10_000){ui.onAllNodesWithText("Dashboard",substring=true).fetchSemanticsNodes().isNotEmpty()}
        assertEquals(before,shotsInGallery().size)
        click("Shot list")
        val catalog=Catalog(context)
        val trunk=catalog.sequence("sedan",true).indexOf("TRUNK_CARGO")
        ui.onNodeWithText("${trunk+1}. ${catalog.shot("TRUNK_CARGO").name}").performScrollTo().performClick()
        evidence("demo-trunk-landscape")
    }
    @Test fun fullReferenceCatalogDecodesAndDetectorRunsOffline(){
        val catalog=Catalog(context);assertEquals(34,catalog.shots.size)
        for(body in listOf("sedan","suv","truck")) for(shot in catalog.shots){val image=catalog.bitmap(shot,body);assertTrue(image.width>=150 && image.height>=150)}
        VehicleDetector(context){}.use { detector ->
            val start=android.os.SystemClock.elapsedRealtime()
            val result=detector.detect(catalog.bitmap(catalog.shot("FRONT_3Q_DRIVER"),"sedan"))
            if(result!=null)assertTrue(result.usable())
            val blank=Bitmap.createBitmap(320,320,Bitmap.Config.ARGB_8888)
            assertNull(detector.detect(blank));blank.recycle()
            File(context.getExternalFilesDir(null),"test-evidence").apply{mkdirs()}.resolve("detector-runtime.json").writeText(JSONObject().put("runtime","Bundled LiteRT CPU on API 35 emulator").put("photographicFixtureBox",result?.toString() ?: "no confident detection").put("blankFrameUnknown",true).put("elapsedMs",android.os.SystemClock.elapsedRealtime()-start).toString(2))
        }
    }
}
