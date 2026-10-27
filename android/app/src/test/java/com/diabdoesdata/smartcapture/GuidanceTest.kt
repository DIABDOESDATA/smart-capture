package com.diabdoesdata.smartcapture

import org.junit.Assert.*
import org.junit.Test

class GuidanceTest {
    private val box = VehicleBox(0.2f, 0.2f, 0.8f, 0.8f, 0.9f, 1000)

    @Test
    fun requiresThreeConfidentFrames() {
        val f = GuidanceFilter()
        f.reset("a")
        assertNull(f.update("a", box, 1000))
        assertNull(f.update("a", box, 1000))
        assertNotNull(f.update("a", box, 1000))
        assertTrue(f.instruction(box, 1000).contains("balanced"))
    }

    @Test
    fun staleUnknownOrOtherShotCannotProduceAlignment() {
        val f = GuidanceFilter()
        f.reset("a")
        repeat(3) { f.update("a", box, 1000) }
        f.reset("b")
        assertNull(f.update("a", box, 1000))
        assertNull(f.update("b", box, 2501))
        assertNull(f.update("b", box.copy(confidence = 0.64f), 1000))
        assertNull(f.update("b", null, 1000))
        assertTrue(f.instruction(box, 2501).startsWith("Use the photo"))
        assertTrue(f.instruction(null, 1000).startsWith("Use the photo"))
    }

    @Test
    fun largeSubjectJumpMustReestablishStability() {
        val f = GuidanceFilter()
        f.reset("a")
        repeat(3) { f.update("a", box, 1000) }
        assertNull(
            f.update("a", box.copy(left = 0.01f, top = 0.01f, right = 0.3f, bottom = 0.3f), 1000)
        )
    }

    @Test
    fun handlesInvalidGeometryAndPracticalFramingOnly() {
        assertFalse(box.copy(left = Float.NaN).usable())
        assertFalse(box.copy(right = 0.1f).usable())
        val f = GuidanceFilter()
        assertTrue(f.instruction(box.copy(left = 0.01f), 1000).contains("Step back"))
        assertTrue(
            f.instruction(box.copy(left = 0.4f, top = 0.4f, right = 0.6f, bottom = 0.6f), 1000)
                .contains("Move closer")
        )
        assertFalse(f.instruction(box, 1000).contains("degrees"))
    }
}
