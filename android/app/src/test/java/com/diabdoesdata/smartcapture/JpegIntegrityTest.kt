package com.diabdoesdata.smartcapture

import java.io.File
import org.junit.Assert.*
import org.junit.Test

class JpegIntegrityTest {
    @Test
    fun interruptedNativeJpegCannotReachPublication() {
        val file = File.createTempFile("smartcapture-journal-", ".jpg")
        try {
            file.writeBytes(byteArrayOf(0xff.toByte(), 0xd8.toByte(), 1, 2, 3))
            assertTrue(runCatching { requireJpegEndMarker(file) }.isFailure)
            assertEquals(5L, file.length())
            file.appendBytes(byteArrayOf(0xff.toByte(), 0xd9.toByte()))
            assertTrue(runCatching { requireJpegEndMarker(file) }.isSuccess)
            file.writeBytes(byteArrayOf(0, 0, 0xff.toByte(), 0xd9.toByte()))
            assertTrue(runCatching { requireJpegEndMarker(file) }.isFailure)
        } finally {
            file.delete()
        }
    }
}
