package com.diabdoesdata.smartcapture

import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Test

class ZoomLabelTest {
    @Test
    fun ultraWideAndFractionalZoomLabelsNeverUseAnInvalidFormatFlag() {
        mapOf(0.5f to "0.5×", 0.6f to "0.6×", 1f to "1×", 1.5f to "1.5×", 2f to "2×", 5f to "5×")
            .forEach { (zoom, expected) -> assertEquals(expected, zoomLabel(zoom)) }
    }

    @Test
    fun lensIndicatorsRemainConsistentWhenTheDeviceUsesDecimalCommas() {
        val original = Locale.getDefault()
        try {
            Locale.setDefault(Locale.GERMANY)
            assertEquals("0.5×", zoomLabel(0.5f))
            assertEquals("1.5×", zoomLabel(1.5f))
        } finally {
            Locale.setDefault(original)
        }
    }
}
