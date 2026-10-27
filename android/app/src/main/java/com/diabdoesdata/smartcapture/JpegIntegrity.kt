package com.diabdoesdata.smartcapture

import java.io.File
import java.io.RandomAccessFile

/** Reject an interrupted native JPEG before metadata rewriting or MediaStore insertion. */
fun requireJpegEndMarker(file: File) {
    RandomAccessFile(file, "r").use { input ->
        require(input.length() >= 4 && input.readUnsignedShort() == 0xffd8) {
            "Incomplete camera image. Retake this shot; the private file is retained."
        }
        input.seek(input.length() - 2)
        require(input.readUnsignedShort() == 0xffd9) {
            "Capture was interrupted before the JPEG finished. Retake this shot; the private file is retained."
        }
    }
}
