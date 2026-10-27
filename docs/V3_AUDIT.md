# V3 native camera audit

Audited 2026-10-27, from `codex/smart-capture-v2` at `a26a7b76d187365bf92567ce0d107ead08c9d96b`, PR #12 (open, base main). V3 starts at that commit on `codex/smart-capture-v3-native`. Main is `301c4df768e23f3e4413997fd995bf2030dbc53c`. The complete branch diff and 147-file inventory were inspected; generated model weights dominate its 32,352 added lines.

## Confirmed source findings

* `SmartCameraView.tsx`, `camera/controller.ts` and `camera/geometry.ts`: real capture draws the current browser video frame to a JPEG canvas. Resolution is bounded by the negotiated video stream; this is not CameraX/native still capture. Cropping avoids upscaling and records source/output dimensions. Every capture waits for a Keep action before persistence and progression.
* `ReferenceOverlay.tsx` and `references/assets.ts`: eight original photographic atlases cover eight exterior directions and one dashboard shot. Most of the 31 supported shot codes use primitive composition fallbacks. Those are useful instructions, but are not completed photographic references.
* `index.css` initially sets a 110px landscape rail and 75% preview maximum. Later `studio.css` overrides that maximum, so the 75% claim alone is stale. The final cascade still reserves a rail and up to 24% for alignment guidance; it does not deliver an immersive native camera.
* `SessionGallery.tsx` and `ExportModal.tsx`: photographs live in browser storage, with individual downloads, sharing and ZIP/JSON/CSV export. There is no Android MediaStore publication. Metadata sidecars do not embed vehicle information or GPS into native EXIF.
* `StudioSettings.tsx`: installation, model download, storage and calibration are visible browser concerns. The native primary flow should expose camera controls, with management in secondary sheets.
* `camera/detector.ts`: locally hosted COCO detection, confidence and context invalidation are useful foundations. Whole-vehicle boxes do not establish exact camera pose, distance, or reliable interior alignment.
* `defaultTemplates.ts`, `additionalShots.ts`: preserve the 31 existing shot identifiers, reference calibration and nominal angle/panel state for future viewers. Add explicit driver-seat, infotainment-screen and truck-bed guides. Legacy template/dealership identifiers must remain readable, while public labels lose dealership branding.
* IndexedDB: transactional session/media writes, lazy migration, error recovery and original/derivative separation are worth retaining. Native Room is separate; Android cannot automatically read browser IndexedDB. Do not erase or silently migrate web data.
* VIN decoding is optional and uses NHTSA; request cancellation/validation and unknown-value handling are worth preserving. No VIN is needed for Quick Camera.
* PWA/service worker, Pages and manual Netlify deployment exist. There is no native Gradle project or APK pipeline in V2.

## Deployment evidence

`smartcapture.diabdoesdata.com` failed DNS resolution from this machine on the audit date; no running commit can be attributed to it. `dealercam.diabdoesdata.com` returned HTTPS 200 with title “Smart Capture — Guided Automotive Photography Platform”. Its HTML SHA-256 is `A21589ACDB9B33977319015BC0AB84E012B0871B4E6A9D28F6904C85945D8144`; assets are `index-Bqi2iq40.js` and `index-BcbhZPXr.css`. These match the retained deployment/build evidence for runtime commit `c654232ea18bdd2738a867ed467acd26a9553855`. Later V2 commits only changed hosting configuration/documentation. The two names are not assumed equivalent. V3 does not redeploy either domain.

## Native implementation boundary

Build a separate Kotlin/Compose/CameraX Android application in `android/`, sharing shot identities and photographic assets through `shared/`. Use native JPEG capture, a durable save journal, EXIF supplementation, MediaStore scoped storage and Room association before confirming success. Gallery originals survive retakes. Bundle detection; never make interior or demo inference claims. Preserve V2 web storage and exports. No WebView, production dealership integration, merge, store upload, or live-site deployment is authorized by this milestone.

No Android SDK/JDK, emulator or attached physical phone was present on the workstation at audit time. CI compilation and emulator evidence will be reported separately from physical Pixel Fold validation. Physical camera quality, Google Photos visibility/caption presentation, fold transitions, vendor HDR and sustained real-device latency remain NOT VERIFIED until measured on hardware. Native CameraX cannot promise proprietary Pixel Camera processing.
