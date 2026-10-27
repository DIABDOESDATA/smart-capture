package com.diabdoesdata.smartcapture

import android.Manifest
import android.content.ClipboardManager
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.rule.GrantPermissionRule
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CameraStartupTest {
    @get:Rule(order = 0)
    val permission: GrantPermissionRule = GrantPermissionRule.grant(Manifest.permission.CAMERA)
    @get:Rule(order = 1) val ui = createComposeRule()

    private fun verifyRecovery(failure: Throwable) {
        val app = ApplicationProvider.getApplicationContext<android.app.Application>()
        val vm = CameraViewModel(app)
        vm.select(null)
        var attempts = 0
        try {
            ui.setContent {
                MaterialTheme {
                    CameraApp(vm) { context, owner ->
                        attempts++
                        if (attempts == 1) throw failure
                        NativeCamera(context, owner)
                    }
                }
            }
            ui.onNodeWithText("Camera could not start.").assertIsDisplayed()
            ui.onNodeWithText("Copy error details").performClick()
            ui.runOnIdle {
                val copied =
                    app.getSystemService(ClipboardManager::class.java)
                        .primaryClip!!
                        .getItemAt(0)
                        .text
                        .toString()
                assertTrue(copied.contains(failure.javaClass.name))
                assertTrue(copied.contains("Memory page size:"))
                assertTrue(copied.contains(BuildConfig.VERSION_NAME))
            }
            ui.onNodeWithText("Retry camera").performClick()
            ui.waitUntil(30_000) {
                ui.onAllNodesWithContentDescription("Take photo").fetchSemanticsNodes().any {
                    !it.config.contains(androidx.compose.ui.semantics.SemanticsProperties.Disabled)
                }
            }
            ui.onNodeWithText("Camera could not start.").assertDoesNotExist()
            assertEquals(2, attempts)
        } finally {
            androidx.lifecycle.ViewModelStore().apply {
                put("startup-test", vm)
                clear()
            }
        }
    }

    @Test
    fun cameraRecoversWhenItsViewportBindingIsLost() {
        val app = ApplicationProvider.getApplicationContext<android.app.Application>()
        val vm = CameraViewModel(app)
        vm.select(null)
        var camera: NativeCamera? = null
        try {
            ui.setContent {
                MaterialTheme {
                    CameraApp(vm) { context, owner ->
                        NativeCamera(context, owner).also { camera = it }
                    }
                }
            }
            fun waitReady() =
                ui.waitUntil(30_000) {
                    ui.onAllNodesWithContentDescription("Take photo").fetchSemanticsNodes().any {
                        !it.config.contains(
                            androidx.compose.ui.semantics.SemanticsProperties.Disabled
                        )
                    }
                }
            waitReady()
            // Reproduce CameraX losing its binding after a stale PreviewView detaches.
            ui.runOnIdle {
                requireNotNull(camera).controller.unbind()
                assertNull(requireNotNull(camera).controller.cameraInfo)
            }
            ui.waitUntil(30_000) {
                ui.runOnIdle { camera?.ready == true && camera?.controller?.cameraInfo != null }
            }
            ui.onNodeWithContentDescription("Take photo").assertIsEnabled()
            ui.onNodeWithText("Retry camera").assertDoesNotExist()
        } finally {
            androidx.lifecycle.ViewModelStore().apply {
                put("startup-test", vm)
                clear()
            }
        }
    }

    @Test
    fun cameraInitializationFailureShowsDetailsAndRetries() =
        verifyRecovery(IllegalStateException("Injected camera initialization failure"))

    @Test
    fun optionalNativeLoadingFailureDoesNotCrashComposition() =
        verifyRecovery(UnsatisfiedLinkError("Injected JNI loading failure"))
}
