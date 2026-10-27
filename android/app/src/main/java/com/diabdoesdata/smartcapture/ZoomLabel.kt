package com.diabdoesdata.smartcapture

import java.util.Locale

internal fun zoomLabel(zoom: Float): String =
    if (zoom == zoom.toInt().toFloat()) "${zoom.toInt()}×"
    else String.format(Locale.ROOT, "%.1f×", zoom)
