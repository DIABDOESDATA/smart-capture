# V3 validation boundary

This is an owner-testing native Android preview, not a zero-defect/public-release claim. See the final delivery report and Actions artifacts for the exact tested APK version, commit, hash, screenshots and final results.

## Automated evidence

* Gradle assembles native application and instrumentation APKs. Ten JVM tests exercise VIN/filename/GPS eligibility, stale VIN lookup/edit protection, interrupted-JPEG markers and guidance confidence, smoothing, context, staleness and calibrated target behavior.
* Android API 35 x86_64 emulator instrumentation drives actual Compose controls and CameraX ImageCapture. The sustained test captures 20 native JPEGs through MediaStore in portrait/landscape, reads EXIF and records native dimensions, bytes, URIs and save timing. Emulator timing is not physical phone performance.
* Five Android tests run with airplane mode enabled and Wi-Fi disabled; the detector test verifies no active network. An additional UI test resizes the emulator to 1840×2208 pixels, rotates it and backgrounds/resumes the app while retaining the selected session/guide. This is a simulated display-size change, not a physical fold/hinge test.
* A separate fixture enters known synthetic vehicle information, reads VIN/stock and dimensions back from the saved EXIF, recreates interruption after publication/before association, verifies idempotent recovery, and retakes while retaining both gallery originals. No fake coordinates are embedded.
* Dedicated demo sedan/SUV/pickup sequences finish using private app storage: 30 / 31 / 30 shots, with no MediaStore publication. Screenshots cover exterior, cockpit, cluster, rear seats, wheel, trunk, engine and VIN-label guides. They are labeled examples, not live vehicle detection evidence.
* All 34 shot codes decode; CI verifies 272 crops, source dimensions, PNG hashes, provenance and the bundled model hash. The actual LiteRT interpreter detects a vehicle in a photographic fixture and returns unknown on a blank image. Synthetic fixtures do not establish field accuracy.
* Android lint checks production sources. AGP 8.13's K2 analyzer crashes on test-source analysis; instrumentation still compiles and executes. Test-source lint is excluded explicitly. Dependency-update and style notices are not suppressed.
* Web compatibility changes retain stored IDs and snapshots while removing public pilot branding. TypeScript, ESLint, Prettier, unit tests and production build are run; browser regression evidence is generated in CI. No blocked local browser origin is bypassed.

Earlier failures led to fixes: shutter gating while a session is being created; stable PreviewView identity and streaming readiness across rotation; subject-jump confidence reset; Android 10 splash resources; and a gallery URI-alias assertion correction. Failed runs are retained as history, never reported as passing checks.

## Physical device acceptance — NOT VERIFIED

No physical Pixel Fold, Android handset or iPhone is attached. These remain owner acceptance requirements:

| Requirement | Status / evidence needed |
| --- | --- |
| Pixel Fold folded/unfolded/landscape and cutout ergonomics | NOT VERIFIED on physical hardware. Emulator resizing/rotation does not establish hinge behavior. |
| Full native resolution / JPEG quality / Pixel Camera comparison | NOT VERIFIED on physical hardware. Compare actual saved dimensions, crop, detail/noise/dynamic range and EXIF in matched light. No proprietary processing parity claim. |
| Hardware 0.5x / physical lenses / zoom / focus / exposure / flash | NOT VERIFIED on physical hardware. Controls depend on reported CameraX capabilities. |
| HDR extension quality and latency | NOT VERIFIED on physical hardware. UI only offers a supported extension. |
| Google Photos and third-party gallery appearance | MediaStore publication verified in emulator. Google Photos album placement, editable captions and displayed EXIF fields NOT VERIFIED. Embedded ImageDescription is not an editable Photos caption. |
| Real GPS grant/denial/stale fix | Freshness/mock/accuracy rules automated; real fix and gallery map display NOT VERIFIED. GPS off by default. |
| Camera permission permanently denied / another app using camera | Error/permission paths implemented; physical vendor behavior NOT VERIFIED. |
| Real storage exhaustion / low memory / thermal pressure / background kill during exposure | Journal/retry and recovery fixture tested; actual physical stress cases NOT VERIFIED. |
| 20–30-photo latency and stability on Pixel Fold | Emulator 20-photo test only. Physical launch/capture/save p50/p95, heat and sustained reliability NOT VERIFIED. |
| App update/uninstall behavior on an owner phone | Stable CI preview signing and version codes configured. Install-over-update/session retention and gallery survival must be checked on the owner device. |
| iPhone installation/capture | Not implemented. See the native iOS parity path. |

Before public release, retain a hardware acceptance record with model/OS, build hash, sample originals, dimensions/EXIF/GPS, gallery visibility, orientation/crop comparisons, observed errors and measured timings. No live website, store publication or branch merge is performed without approval.
