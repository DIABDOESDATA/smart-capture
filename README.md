# Smart Capture V3

The primary camera is now a **native Android application** in [`android/`](android/README.md): Kotlin, Compose, CameraX ImageCapture, direct MediaStore saving, metadata, bundled photographic guides and on-device framing. See the **Native Android** GitHub Actions workflow for the versioned owner-testing APK and emulator evidence. Physical Pixel Fold acceptance remains required; no iPhone binary or public-release certification is claimed.

The V2 web studio remains available at its existing deployment and retains its stored-data compatibility. It is a separate browser implementation, not the Android camera runtime. No production website is redeployed by V3. Read the [source audit](docs/V3_AUDIT.md), [validation boundary](docs/V3_VALIDATION.md) and [native iPhone parity path](docs/V3_IOS.md).

The 2026-10-26 [release review](docs/RELEASE_REVIEW.md) adds the studio interface, mobile navigation, install guidance, safe app updates, a verified offline AI pack, native file sharing, and capture/data-loss safeguards.

## Retained V2 web studio

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Open http://localhost:5173 on this computer. Start a vehicle session, optionally decode or scan a VIN, select a checklist, and allow camera access. Without a camera, explicitly choose **Use sample-photo mode**. Sample images are visibly marked and retain sample provenance in storage and exports.

For phone testing, open **https://dealercam.diabdoesdata.com/** in Safari or Chrome. Phone cameras require a trusted **HTTPS origin**; an ordinary HTTP LAN URL is not sufficient. Hosting, DNS, updates and verification are recorded in [DEALERCAM_DEPLOYMENT.md](docs/DEALERCAM_DEPLOYMENT.md). Test the production offline shell with `npm run build`, `npm run preview -- --host 0.0.0.0`, and `npm run test:offline`.

## Implemented

- Original photorealistic raster ghost references for sedan, SUV/crossover, pickup, coupe, hatchback/wagon, convertible, van and classic categories, covering the eight exterior angles (opposite sides mirror generic examples). They are body-style examples, **not VIN-specific geometry or real inventory photos**.
- Ghost/edge display, opacity, outline emphasis, X/Y position, scale, mirroring, sunlight mode, grid/landmarks, reset and saved calibrations.
- Dealership-owned reference uploads with manual polygon isolation, original retention and per-body/per-shot approval on this device.
- Shared preview/capture crop for 4:3, 16:9 and 1:1; native video frame resolution, no upscaling, no burned-in guides. The screen shows the actual output resolution.
- Rear preference, exposed camera selection, capability-gated torch/zoom/exposure/touch focus, permission retry, stream cleanup and visibility recovery. Physical behavior remains to be tested on phones.
- Real Code39, Code128 and PDF417 recognition through lazy-loaded ZXing, confirmation/correction, manual entry and NHTSA errors without fabricated vehicle specifications.
- Saved 8/12/20/24-shot presets; Premium Inventory 20 defaults. Session snapshots and legacy IDs preserve checklists. Adaptive pickup cargo, rear-seat exclusion, optional fitted third-row/sunroof and convertible roof scenes. Additional steering/door/hood/console guides can be added in Templates.
- Quality advisories, pause/resume, vehicle search/filter, large/swipe review, ordering, hero selection, retakes and before/after comparison.
- Non-destructive center crop, rotation, straighten, brightness and contrast; originals remain separate and export with derivatives. No condition-hiding cleanup.
- IndexedDB v1 migration to separate media and thumbnails; atomic saves and explicit failures, Blob/byte fallback for WebKit, storage usage/persistence requests, offline ZIP export and versioned manifests/hotspots.
- Production service-worker shell and original PWA icons. No background upload claim.

## Experimental / future / blocked

| Status | Feature |
|---|---|
| Experimental, off by default | Local COCO SSD Lite vehicle bounding-box detection. 18.56 MB model plus lazy runtime; confidence-gated guidance, manual fallback. Desktop benchmark is not a phone benchmark. |
| Experimental pending field calibration | Quality thresholds and reference landmarks; they are advisory, not a guarantee of listing quality or exact perspective. |
| Planned | Vehicle segmentation/mask overlap, Y/M/M-specific licensed imagery, true optical lens identification, higher-resolution still-photo path with proven preview correspondence. |
| Planned | Dedicated dense 360 orbit sequence, interactive viewer and 3D reconstruction. A 20-shot checklist is not a smooth spin. |
| Disabled / blocked pending backend security work | Cloud auth/sync and external inventory integrations. Credentials alone cannot activate cloud access. Existing RLS needs hardening and multi-tenant tests. |
| Human acceptance required | iOS/Android real cameras, sunlight, dark/light vehicles, dealership employee usability and time per vehicle. |

## Verification

```sh
npm run lint
npm run format:check
npx tsc --noEmit
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm run test:offline
# With dev server running, optional desktop detector benchmark:
npm run benchmark:detector
```

See [test report](docs/CODEX_TEST_REPORT.md), [audit](docs/CODEX_AUDIT_V2.md), [handoff](docs/CODEX_HANDOFF.md), [field acceptance](docs/PILOT_ACCEPTANCE_V2.md), [camera design](docs/camera-implementation.md), [reference provenance/prompts](public/references/provenance.json), [CV evaluation](docs/CV_EVALUATION_V2.md), and [future viewer contract](docs/PHOTO_STUDIO_CONTRACT_V2.md).

New upstream component/model notices are in [public/notices](public/notices) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The original repository's commercial licensing remains pending in LICENSE.md; no open-source license is added to this application.

### Build runtime

Use Node.js 24 or newer (`.nvmrc` selects 24). The locked ZXing barcode dependency requires Node 24; all build/validation workflows use it. This is a development/build requirement; the distributed app runs in the browser.
