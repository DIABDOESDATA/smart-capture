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
import java.io.File
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.*
import org.junit.Assert.*
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NativeCameraTest {
    @get:Rule(order = 0)
    val permission: GrantPermissionRule = GrantPermissionRule.grant(Manifest.permission.CAMERA)
    @get:Rule(order = 1) val ui = createAndroidComposeRule<MainActivity>()
    @get:Rule(order = 2) val testName = org.junit.rules.TestName()

    @After
    fun saveDiagnostics() {
        val dir = File(context.getExternalFilesDir(null), "test-evidence").apply { mkdirs() }
        dir.resolve("${testName.methodName}-semantics.txt")
            .writeText(ui.onAllNodes(isRoot(), useUnmergedTree = true).onLast().printToString())
        evidence("${testName.methodName}-final")
    }

    private val context
        get() = ui.activity.applicationContext

    private val device
        get() = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

    private fun shotsInGallery(): List<String> {
        val result = mutableListOf<String>()
        context.contentResolver
            .query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                arrayOf(MediaStore.Images.Media._ID),
                "${MediaStore.Images.Media.RELATIVE_PATH}=? AND ${MediaStore.Images.Media.IS_PENDING}=0",
                arrayOf("DCIM/SmartCapture/"),
                null,
            )
            ?.use {
                while (it.moveToNext()) result.add(
                    android.content.ContentUris.withAppendedId(
                            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                            it.getLong(0),
                        )
                        .toString()
                )
            }
        return result
    }

    private fun click(description: String) =
        ui.onNodeWithContentDescription(description).performClick()

    private fun waitShutter() {
        ui.waitUntil(20_000) {
            ui.onAllNodesWithContentDescription("Take photo").fetchSemanticsNodes().any {
                !it.config.contains(androidx.compose.ui.semantics.SemanticsProperties.Disabled)
            }
        }
    }

    private fun evidence(name: String) {
        val dir = File(context.getExternalFilesDir(null), "test-evidence").apply { mkdirs() }
        assertTrue(device.takeScreenshot(File(dir, "$name.png")))
    }

    @Test
    fun liveCameraCapturesAcrossRepeatedFoldSizes() {
        Assume.assumeTrue(device.executeShellCommand("getprop ro.kernel.qemu").trim() == "1")
        click("Camera modes")
        ui.onAllNodesWithText("Quick Camera", useUnmergedTree = true).onLast().performClick()
        val original = device.executeShellCommand("wm size")
        val restore =
            Regex("Override size: (\\d+x\\d+)").find(original)?.groupValues?.get(1) ?: "reset"
        var saved = shotsInGallery().size
        try {
            repeat(3) {
                for (size in listOf("1080x2092", "2208x1840")) {
                    device.executeShellCommand("wm size $size")
                    waitShutter()
                    click("Take photo")
                    saved++
                    ui.waitUntil(20_000) { shotsInGallery().size == saved }
                }
            }
        } finally {
            device.executeShellCommand("wm size $restore")
        }
    }

    @Test
    fun nativeCameraCapturesGalleryJpegAndSurvivesRotation() {
        click("Camera modes")
        ui.onAllNodesWithText("Quick Camera", useUnmergedTree = true).onLast().performClick()
        waitShutter()
        evidence("native-portrait")
        val before = shotsInGallery().toSet()
        click("Take photo")
        ui.waitUntil(20_000) { shotsInGallery().size == before.size + 1 }
        val uri = android.net.Uri.parse(shotsInGallery().first { it !in before })
        context.contentResolver.openInputStream(uri)!!.use { input ->
            val exif = ExifInterface(input)
            assertTrue(exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, 0) >= 640)
            assertTrue(exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, 0) >= 480)
            assertTrue(exif.getAttribute(ExifInterface.TAG_SOFTWARE)!!.startsWith("Smart Capture"))
            val metadata = JSONObject(exif.getAttribute(ExifInterface.TAG_USER_COMMENT)!!)
            assertEquals("QUICK_CAMERA", metadata.getString("shotCode"))
            assertEquals("", metadata.getJSONObject("vehicle").getString("bodyStyle"))
            assertEquals("", metadata.getJSONObject("vehicle").getString("vin"))
            assertFalse(metadata.has("location"))
        }
        ui.runOnUiThread {
            ui.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        ui.waitUntil(10_000) {
            ui.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_LANDSCAPE
        }
        waitShutter()
        evidence("native-landscape")
        click("Take photo")
        ui.waitUntil(20_000) { shotsInGallery().size == before.size + 2 }
        waitShutter()
        // A sustained run uses the real emulator camera and native publication path.
        repeat(18) { index ->
            click("Take photo")
            ui.waitUntil(20_000) { shotsInGallery().size == before.size + 3 + index }
            waitShutter()
        }
        // Rotate immediately after the shutter, while journal/capture work is in flight.
        for ((offset, orientation) in
            listOf(
                    ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                    ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,
                )
                .withIndex()) {
            click("Take photo")
            ui.runOnUiThread { ui.activity.requestedOrientation = orientation }
            ui.waitUntil(20_000) { shotsInGallery().size == before.size + 21 + offset }
            waitShutter()
        }
        val db = CaptureDatabase.get(context)
        runBlocking { assertTrue(db.dao().unfinished().none { it.error == null }) }
        val beforeIds =
            before.map { android.content.ContentUris.parseId(android.net.Uri.parse(it)) }.toSet()
        val records = runBlocking {
            db.dao().photos().first().filter {
                it.source == "camera" &&
                    it.state == "saved" &&
                    it.uri != null &&
                    android.content.ContentUris.parseId(android.net.Uri.parse(it.uri)) !in beforeIds
            }
        }
        val details = org.json.JSONArray()
        assertEquals(22, records.size)
        records.forEach { p ->
            details.put(
                JSONObject()
                    .put("uri", p.uri)
                    .put("width", p.width)
                    .put("height", p.height)
                    .put("bytes", p.bytes)
                    .put("saveMs", p.elapsedMs)
                    .put("metadata", JSONObject(p.metadata))
            )
        }
        val report = File(context.getExternalFilesDir(null), "test-evidence/native-capture.json")
        report.writeText(
            JSONObject()
                .put("device", "Android API 35 emulator; NOT physical hardware")
                .put("galleryUris", org.json.JSONArray(shotsInGallery()))
                .put("portraitAndLandscape", true)
                .put("newNativeCaptures", 22)
                .put("rotationDuringCapture", true)
                .put("captureDetails", details)
                .toString(2)
        )
    }

    @Test
    fun knownMetadataRetakeAndPublicationRecovery() {
        lateinit var vm: CameraViewModel
        ui.runOnIdle {
            vm = androidx.lifecycle.ViewModelProvider(ui.activity)[CameraViewModel::class.java]
        }
        ui.waitUntil(10_000) { !vm.loading && !vm.busy }
        ui.runOnIdle {
            vm.start(
                Vehicle(
                    vin = "1HGCM82633A004352",
                    year = "2003",
                    make = "Honda",
                    model = "Accord",
                    stock = "V3-TEST",
                )
            )
        }
        ui.waitUntil(10_000) {
            vm.active?.demo == false && vm.active?.vehicle?.contains("V3-TEST") == true && !vm.busy
        }
        waitShutter()
        val session = vm.active!!
        val before = shotsInGallery().size
        click("Take photo")
        ui.waitUntil(20_000) { shotsInGallery().size == before + 1 }
        waitShutter()
        val db = CaptureDatabase.get(context)
        val first = runBlocking {
            db.dao().photos().first().first { it.sessionId == session.id && it.state == "saved" }
        }
        context.contentResolver.openInputStream(android.net.Uri.parse(first.uri))!!.use { stream ->
            val e = ExifInterface(stream)
            val j = JSONObject(e.getAttribute(ExifInterface.TAG_USER_COMMENT)!!)
            assertEquals("1HGCM82633A004352", j.getJSONObject("vehicle").getString("vin"))
            assertTrue(
                e.getAttribute(ExifInterface.TAG_IMAGE_DESCRIPTION)!!.contains("Stock: V3-TEST")
            )
            assertEquals(first.width, j.getInt("nativeWidth"))
            assertFalse(j.has("location"))
        }
        // Recreate a crash after gallery publication, before Room association, using this test's
        // JPEG.
        runBlocking {
            val temp = File(first.tempPath)
            context.contentResolver.openInputStream(android.net.Uri.parse(first.uri))!!.use { input
                ->
                temp.outputStream().use { input.copyTo(it) }
            }
            db.dao().putSession(db.dao().session(session.id)!!.copy(cursor = 0))
            db.dao().putPhoto(first.copy(state = "publishing"))
            vm.repository.recover()
            assertEquals("saved", db.dao().photo(first.id)!!.state)
            assertEquals(1, db.dao().session(session.id)!!.cursor)
        }
        assertEquals(before + 1, shotsInGallery().size)
        ui.runOnIdle { vm.navigate(0) }
        ui.waitUntil(10_000) { vm.active?.cursor == 0 }
        waitShutter()
        click("Take photo")
        ui.waitUntil(20_000) { shotsInGallery().size == before + 2 }
        waitShutter()
        val originalId = android.content.ContentUris.parseId(android.net.Uri.parse(first.uri))
        assertTrue(
            shotsInGallery().any {
                android.content.ContentUris.parseId(android.net.Uri.parse(it)) == originalId
            }
        )
        context.contentResolver.openFileDescriptor(android.net.Uri.parse(first.uri), "r")!!.use {
            assertTrue(it.statSize > 0)
        }
        File(context.getExternalFilesDir(null), "test-evidence/metadata-recovery.json")
            .writeText(
                JSONObject()
                    .put(
                        "input",
                        "Explicit synthetic vehicle metadata fixture entered by test; emulator scene is not a real vehicle",
                    )
                    .put("vinAndStockRoundTrip", true)
                    .put("publicationRecoveryNoDuplicate", true)
                    .put("retakeKeepsBothGalleryOriginals", true)
                    .toString(2)
            )
        ui.runOnIdle { vm.quick() }
    }

    @Test
    fun guidedDemoAdvancesWithPhotographicInteriorAndNoMediaStoreWrites() {
        click("Camera modes")
        ui.onNodeWithText("TRY A DEMO").performScrollTo()
        ui.onNodeWithTag("demo-sedan").performScrollTo().performClick()
        ui.waitUntil(10_000) {
            ui.onAllNodesWithText("DEMO · SEDAN").fetchSemanticsNodes().isNotEmpty()
        }
        val before = shotsInGallery().size
        waitShutter()
        evidence("demo-exterior-portrait")
        click("Take photo")
        ui.waitUntil(10_000) {
            ui.onAllNodesWithText("2 /", substring = true).fetchSemanticsNodes().isNotEmpty()
        }
        click("Shot list")
        ui.onNodeWithTag("shot-list").performScrollToIndex(12)
        ui.onNodeWithText("13. Driver Cockpit & Door Open").performClick()
        waitShutter()
        ui.waitUntil(5_000) {
            ui.onAllNodesWithContentDescription("Demo scene: Driver Cockpit & Door Open")
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
        evidence("demo-cockpit-portrait")
        ui.runOnUiThread {
            ui.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        ui.waitUntil(10_000) {
            ui.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_LANDSCAPE
        }
        waitShutter()
        evidence("demo-cockpit-landscape")
        click("Take photo")
        ui.waitUntil(10_000) {
            ui.onAllNodesWithText("Dashboard", substring = true).fetchSemanticsNodes().isNotEmpty()
        }
        assertEquals(before, shotsInGallery().size)
        click("Shot list")
        val catalog = Catalog(context)
        val trunk = catalog.sequence("sedan", true, sunroof = true).indexOf("TRUNK_CARGO")
        ui.onNodeWithTag("shot-list").performScrollToIndex(trunk)
        ui.onNodeWithText("${trunk+1}. ${catalog.shot("TRUNK_CARGO").name}").performClick()
        ui.waitUntil(5_000) {
            ui.onAllNodesWithContentDescription("Demo scene: ${catalog.shot("TRUNK_CARGO").name}")
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
        evidence("demo-trunk-landscape")
        for ((code, label) in
            listOf(
                "ENGINE_BAY" to "engine",
                "WHEEL_FRONT_DRIVER" to "wheel",
                "REAR_SEATS" to "rear-seats",
                "INSTRUMENT_CLUSTER" to "cluster",
                "VIN_DOOR_JAMB" to "vin-label",
            )) {
            click("Shot list")
            val index = catalog.sequence("sedan", true, sunroof = true).indexOf(code)
            ui.onNodeWithTag("shot-list").performScrollToIndex(index)
            ui.onNodeWithText("${index+1}. ${catalog.shot(code).name}").performClick()
            ui.waitUntil(5_000) {
                ui.onAllNodesWithContentDescription("Demo scene: ${catalog.shot(code).name}")
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }
            evidence("demo-$label-landscape")
        }
    }

    @Test
    fun fullReferenceCatalogDecodesAndDetectorRunsOffline() {
        val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
        automation.adoptShellPermissionIdentity(Manifest.permission.ACCESS_NETWORK_STATE)
        try {
            val connectivity = context.getSystemService(android.net.ConnectivityManager::class.java)
            assertNull(
                "Offline instrumentation must have no active network",
                connectivity.activeNetwork,
            )
        } finally {
            automation.dropShellPermissionIdentity()
        }
        val catalog = Catalog(context)
        assertEquals(34, catalog.shots.size)
        for (body in listOf("sedan", "suv", "truck")) for (shot in catalog.shots) {
            val image = catalog.bitmap(shot, body)
            assertTrue(image.width >= 150 && image.height >= 150)
        }
        val before = shotsInGallery().size
        val counts = JSONObject()
        runBlocking {
            val db = CaptureDatabase.get(context)
            val repository = PhotoRepository(context, db)
            for (body in listOf("sedan", "suv", "truck")) {
                val codes = catalog.sequence(body, true, thirdRow = true, sunroof = true)
                var session =
                    Session(
                        java.util.UUID.randomUUID().toString(),
                        body,
                        Vehicle(model = "Demo", body = body).json().toString(),
                        org.json.JSONArray(codes).toString(),
                        demo = true,
                    )
                db.dao().putSession(session)
                for (code in codes) {
                    repository.saveDemo(session, catalog.shot(code), catalog)
                    session = db.dao().session(session.id)!!
                }
                assertEquals(codes.size, session.cursor)
                counts.put(body, codes.size)
            }
        }
        assertEquals(before, shotsInGallery().size)
        File(context.getExternalFilesDir(null), "test-evidence/demo-sequences.json")
            .writeText(
                JSONObject()
                    .put("privateDemoCaptures", counts)
                    .put("mediaStoreWrites", 0)
                    .toString(2)
            )
        VehicleDetector(context) {}
            .use { detector ->
                val start = android.os.SystemClock.elapsedRealtime()
                val result =
                    detector.detect(catalog.bitmap(catalog.shot("FRONT_3Q_DRIVER"), "sedan"))
                if (result != null) assertTrue(result.usable())
                val blank = Bitmap.createBitmap(320, 320, Bitmap.Config.ARGB_8888)
                assertNull(detector.detect(blank))
                blank.recycle()
                File(context.getExternalFilesDir(null), "test-evidence")
                    .apply { mkdirs() }
                    .resolve("detector-runtime.json")
                    .writeText(
                        JSONObject()
                            .put("runtime", "Bundled LiteRT CPU on API 35 emulator")
                            .put(
                                "photographicFixtureBox",
                                result?.toString() ?: "no confident detection",
                            )
                            .put("blankFrameUnknown", true)
                            .put("elapsedMs", android.os.SystemClock.elapsedRealtime() - start)
                            .toString(2)
                    )
            }
    }

    @Test
    fun unfoldedSizeAndBackgroundRetainTheSelectedGuide() {
        lateinit var vm: CameraViewModel
        ui.runOnIdle {
            vm = androidx.lifecycle.ViewModelProvider(ui.activity)[CameraViewModel::class.java]
        }
        ui.waitUntil(10_000) { !vm.loading && !vm.busy }
        ui.runOnIdle {
            vm.start(Vehicle(model = "Demo SUV", body = "suv"), demo = true, extended = true)
        }
        ui.waitUntil(10_000) { vm.active?.demo == true && vm.body == "suv" && !vm.busy }
        ui.runOnIdle { vm.navigate(12) }
        ui.waitUntil(10_000) { vm.active?.cursor == 12 }
        val id = vm.active!!.id
        try {
            ui.runOnUiThread {
                ui.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            }
            device.executeShellCommand("wm size 1840x2208")
            ui.waitUntil(10_000) {
                ui.activity.resources.configuration.screenHeightDp > 500 &&
                    vm.shot?.code == "DRIVER_COCKPIT"
            }
            ui.waitUntil(5_000) {
                ui.onAllNodesWithContentDescription("Demo scene: Driver Cockpit & Door Open")
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }
            evidence("fold-size-landscape-demo")
            device.pressHome()
            val intent =
                context.packageManager
                    .getLaunchIntentForPackage(context.packageName)!!
                    .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            ui.runOnUiThread { context.startActivity(intent) }
            ui.waitUntil(10_000) {
                ui.onAllNodesWithText("DEMO · SUV").fetchSemanticsNodes().isNotEmpty()
            }
            assertEquals(id, vm.active!!.id)
            assertEquals(12, vm.active!!.cursor)
            File(context.getExternalFilesDir(null), "test-evidence/window-state.json")
                .writeText(
                    JSONObject()
                        .put("emulatedDisplayPixels", "1840x2208")
                        .put("landscapeAndBackgroundRetainSessionAndShot", true)
                        .put("physicalFoldHingeTest", false)
                        .toString(2)
                )
        } finally {
            device.executeShellCommand("wm size reset")
        }
        ui.runOnIdle { vm.quick() }
    }
}
