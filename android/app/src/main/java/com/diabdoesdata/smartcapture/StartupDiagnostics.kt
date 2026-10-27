package com.diabdoesdata.smartcapture

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.system.Os
import android.system.OsConstants

/**
 * Device/exception details only: no session contents, photos, VIN, location or device identifiers.
 */
internal fun startupReport(failure: Throwable?): String = buildString {
    appendLine("Smart Capture ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})")
    appendLine("Package: ${BuildConfig.APPLICATION_ID}")
    appendLine("Device: ${Build.MANUFACTURER} ${Build.MODEL}")
    appendLine("Android: ${Build.VERSION.RELEASE}; API ${Build.VERSION.SDK_INT}")
    appendLine("ABIs: ${Build.SUPPORTED_ABIS.joinToString()}")
    appendLine("Memory page size: ${Os.sysconf(OsConstants._SC_PAGESIZE)}")
    appendLine()
    append(failure?.stackTraceToString() ?: "No exception recorded.")
}

internal fun copyStartupReport(context: Context, failure: Throwable?) {
    context
        .getSystemService(ClipboardManager::class.java)
        .setPrimaryClip(
            ClipData.newPlainText("Smart Capture startup details", startupReport(failure))
        )
}

/** Keep recoverable platform/JNI loading failures out of composition; never swallow VM failures. */
internal fun <T> attemptStartup(create: () -> T): Result<T> =
    try {
        Result.success(create())
    } catch (failure: Exception) {
        Result.failure(failure)
    } catch (failure: LinkageError) {
        Result.failure(failure)
    }
