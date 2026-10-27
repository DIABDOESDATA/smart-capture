package com.diabdoesdata.smartcapture

import org.junit.Assert.*
import org.junit.Test

class CaptureRulesTest {
    @Test
    fun delayedVinLookupCannotOverwriteAnotherVehicleOrConcurrentManualEdits() {
        val request = Vehicle(vin = "1HGCM82633A004352")
        val decoded = request.copy(year = "2003", make = "Honda", model = "Accord", stock = "old")
        val other = request.copy(vin = "1M8GDM9AXKP042788", model = "Manually entered")
        assertEquals(other, CaptureRules.mergeDecoded(request, decoded, other))
        val current = request.copy(year = "2004", stock = "SC-1042", body = "coupe")
        val merged = CaptureRules.mergeDecoded(request, decoded, current)
        assertEquals("2004", merged.year)
        assertEquals("Honda", merged.make)
        assertEquals("SC-1042", merged.stock)
        assertEquals("coupe", merged.body)
    }

    @Test
    fun vinIsOptionalButInvalidCharactersAreNeverAcceptedAsKnownVin() {
        assertEquals("1HGCM82633A004352", CaptureRules.normalizeVin("1hg cm82633a004352 "))
        assertTrue(CaptureRules.validVin("1HGCM82633A004352"))
        listOf("", "123", "1HGCM82633AOO4352", "1HGCM82633A004352\nMORE").forEach {
            assertFalse(CaptureRules.validVin(it))
        }
    }

    @Test
    fun namesAreSafeUniqueAndOmitUnknownVehicleFields() {
        val a =
            CaptureRules.filename(
                listOf("", "", "", ""),
                "QUICK_CAMERA",
                "20261027_120000",
                "abc123456789",
            )
        assertEquals("SC_20261027_120000_abc123456789.jpg", a)
        val b =
            CaptureRules.filename(
                listOf("2020", "A/B", "330 i", "STK1042"),
                "FRONT_3Q_DRIVER",
                "20261027_120000",
                "def123456789",
            )
        assertTrue(b.startsWith("2020_A_B_330_i_STK1042_FRONT_3Q_DRIVER_"))
        assertFalse(a == b)
        assertFalse(b.contains('/'))
        assertTrue(
            CaptureRules.filename(listOf("x".repeat(300)), "QUICK", "stamp", "id").length < 180
        )
    }

    @Test
    fun onlyFreshAccurateNonMockLocationsQualify() {
        assertTrue(CaptureRules.freshLocation(10_000_000_000L, 20f, false))
        assertFalse(CaptureRules.freshLocation(121_000_000_000L, 20f, false))
        assertFalse(CaptureRules.freshLocation(-1, 20f, false))
        assertFalse(CaptureRules.freshLocation(1, 101f, false))
        assertFalse(CaptureRules.freshLocation(1, 20f, true))
        assertFalse(CaptureRules.freshLocation(1, Float.NaN, false))
    }
}
