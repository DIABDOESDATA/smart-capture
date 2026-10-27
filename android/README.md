# Smart Capture for Android

Native Kotlin / Jetpack Compose / CameraX. Android 10+ (API 29); ARM64 phones and x86_64 emulators. No WebView. The application opens into Quick Camera; vehicle details are optional. Production websites are not changed by this project.

## Build

Install JDK 17 and the official Android SDK command-line tools. Set `JAVA_HOME` and `ANDROID_HOME`, or put the SDK path in an ignored `android/local.properties` (`sdk.dir=C\:/path/to/sdk` on Windows).

```sh
sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"
sdkmanager --licenses
cd android
./gradlew testDebugUnitTest lintDebug assembleDebug assembleDebugAndroidTest
# Windows: gradlew.bat instead of ./gradlew
```

Output: `app/build/outputs/apk/debug/app-debug.apk`. No API keys or network model download are required. Optional VIN lookup alone uses NHTSA. The model, all photographic references and Room storage work offline. Gradle/Maven need internet on the first development build.

The Native Android Actions workflow builds a versioned APK and then installs that exact artifact on an API 35 emulator for instrumentation. Download the **Smart-Capture-Android-N** artifact, unzip it and install its `.apk`. On the phone, allow installation from that browser/file manager when Android asks. Open **Smart Capture**, allow the camera, rotate the phone and take a photo. It saves in `DCIM/SmartCapture`. On some Google Photos versions, local albums appear under Collections / On this device. Cloud backup is controlled by Google Photos, not this app.

## Signing and updates

Owner-test application ID: `com.diabdoesdata.smartcapture.preview`. The repository's `SC_PREVIEW_KEYSTORE` Actions secret holds a stable **testing** signing identity. No signing material is committed or included in artifacts. Its private owner backup is outside the repository in the task's private-signing directory with owner-only filesystem access. Treat it as a preview key, never a production signing key.

CI version code is `300000 + GITHUB_RUN_NUMBER`; version name is `3.0.0-preview.N`. Install newer successful builds over older previews to retain Room sessions and references. The local default is `300001`; it is intended for development and may be older than a CI build. Keep the workflow's monotonically increasing run counter and signing identity. Do not uninstall to update unless you deliberately want to remove private app data. Gallery originals remain subject to Android's normal storage behavior.

Production application ID: `com.diabdoesdata.smartcapture`. To sign a release, the owner supplies `SC_RELEASE_KEYSTORE` (private file path), `SC_RELEASE_STORE_PASSWORD`, `SC_RELEASE_KEY_ALIAS` and `SC_RELEASE_KEY_PASSWORD`, then runs `./gradlew assembleRelease`. Release signing fails without configured credentials. Use an owner-controlled upload key / Play App Signing for an approved store release; never reuse the preview key. No store upload or public release is performed here.

## Local emulator tests

```sh
sdkmanager "emulator" "system-images;android-35;google_apis;x86_64"
avdmanager create avd -n smartcapture_api35 -k "system-images;android-35;google_apis;x86_64" -d pixel_7
emulator -avd smartcapture_api35 -camera-back emulated -camera-front none
# From repository root, after building both APKs:
python scripts/test_native_emulator.py --apk android/app/build/outputs/apk/debug/app-debug.apk --test-apk android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
```

The harness keeps the test app installed and retrieves screenshots/JSON before emulator teardown. It verifies runner success instead of relying on `adb`'s exit status. Automated fixtures use explicit synthetic vehicle metadata and emulator imagery. Demo images never enter MediaStore. Instrumentation sources compile and execute; AGP 8.13's K2 test-source lint analyzer crashes on the ViewModel fixture, so only test-source lint analysis is excluded. Production lint still fails the build on errors. Dependency-update/style notices are retained in lint reports.

## Architecture and limits

* `NativeCamera`: one retained PreviewView across rotation, native ImageCapture with highest supported practical resolution, quality mode, hardware zoom/focus/exposure/flash, optional supported HDR extension. CameraController ties PreviewView's viewport/crop to capture and updates rotation. There is no Pixel-specific proprietary processing or invented optical zoom label.
* `CameraViewModel`: Quick Camera, optional VIN/barcode/decode, fitted-feature checklists, saved sessions, per-VIN (or per-session without VIN) reference overrides. A session transition gates the shutter. Current shot and save jobs live outside composable layout state.
* `PhotoRepository`: journal before capture → original native JPEG in private durable storage → EXIF supplementation without pixel re-encoding → pending MediaStore row → byte copy → publication → Room association/advance → private duplicate cleanup. Recovery reconciles a unique filename and a recorded URI; it does not delete published photographs. Failed originals remain private for retry/retake. Retakes add a new original and replace the current shot's latest association.
* `Metadata`: known vehicle information in ImageDescription and structured UserComment, native dimensions/orientation in Room and EXIF; native exposure/optical metadata retained. GPS defaults off and requires permission plus a non-mock fix no older than 120 seconds and accuracy ≤100 m. Unknown GPS/vehicle fields are omitted or empty. This does not set Google Photos' editable caption.
* `Catalog`: 34 stable shot types, 13 original photographic atlases, 272 checked body/shot crops. Sedan, SUV and pickup have separate interior packs. Other body classes use explicitly generic interior examples; fitted third rows/roof views are optional. There are no primitive fallback references. Bounded region decoding avoids loading every atlas into memory.
* `VehicleDetector` / `GuidanceFilter`: bundled EfficientDet-Lite0 / LiteRT CPU, real whole-vehicle boxes, three-frame confidence gating, smoothing and stale/context invalidation. Suggestions follow reference position/scale. No distance, viewing-angle or interior inference is claimed. HDR pauses analysis. Detector failure leaves manual guides and capture usable.
* `shared/`: versioned catalog, original reference assets, crops/anchors, hashes, generation prompts and model notices. `python scripts/validate_native_catalog.py` rejects missing or changed required assets. All 31 V2 shot identities remain, with three additional explicit native views.

Default 4:3 is maximally fitted into available space; black margins outside it are not photographed. A 16:9 crop is available in settings. Neither the preview nor the guide is stretched to fill a mismatched screen. A 104dp rail is the only landscape control reservation; guidance overlays the image. Physical framing parity, full sensor resolution, fold transitions, HDR, gallery app display and capture latency must still be measured on supported phones.

The V2 web application remains a separate gallery/admin/PWA implementation. Its IndexedDB keys, stored originals and legacy IDs are preserved. Native Android does not silently import browser data. Shared shot identity and metadata make a future explicit file import possible; no automatic cross-platform sync or web-to-Room migration is claimed.

See `docs/V3_VALIDATION.md` for the evidence boundary and `docs/V3_IOS.md` for iPhone parity.
