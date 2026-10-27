package com.diabdoesdata.smartcapture

import org.junit.Assert.*
import org.junit.Test

class StartupAttemptTest {
    @Test
    fun recoverableFailuresRetainTheirOriginalCause() {
        val platform = IllegalStateException("Camera unavailable")
        val native = UnsatisfiedLinkError("JNI library unavailable")
        assertSame(platform, attemptStartup<Unit> { throw platform }.exceptionOrNull())
        assertSame(native, attemptStartup<Unit> { throw native }.exceptionOrNull())
        assertEquals("ready", attemptStartup { "ready" }.getOrThrow())
    }

    @Test
    fun fatalVmFailuresAreNotConvertedIntoRetryableErrors() {
        val fatal = OutOfMemoryError("Injected VM error")
        try {
            attemptStartup<Unit> { throw fatal }
            fail("A fatal VM error must propagate")
        } catch (actual: OutOfMemoryError) {
            assertSame(fatal, actual)
        }
    }
}
