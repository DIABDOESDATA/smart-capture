# Smart Capture V2 engineering handoff

2026-10-25. Branch `codex/smart-capture-v2`, based on main `301c4df`. Review the PR before any merge. No deployment or D Drive production change has occurred.

## What changed

Repaired preview/saved-image crop mismatch; made denied cameras non-capturing until an explicit sample choice; removed simulated sync success and fabricated vehicle fields; implemented barcode recognition and connected confirmation; made saves atomic/awaited and template changes durable. Replaced primary vehicle sketches with original raster references and added calibration, edge rendering, contextual guides and dealer reference isolation. Added optional replaceable CV, review/reorder/retake/history/editing, lightweight session metadata, independent originals/thumbnails, versioned exports, PWA/offline verification and truthful metrics.

## Module ownership

- `services/camera/controller.ts`: generation-safe streams and capability constraints.
- `services/camera/geometry.ts`: center cover crop and sensor screen-roll conversion. Capture draws video only.
- `services/references/{assets,geometry,custom}.ts`: raster source windows, normalized target geometry, approved uploads.
- `components/camera/SmartCameraView.tsx`: camera orchestration/review; manual capture remains available when CV fails.
- `services/camera/detector.ts`: provider interface, optional local SSD, confidence handling and measured heuristic scoring.
- `services/capture/sequence.ts`: missing-required validation, resume and identity-preserving retakes.
- `services/storage/indexedDb.ts`: database v2 upgrade preserving v1 stores, atomic session/media saves, lazy v1 migration, thumbnail reads, independent originals/derivatives.
- `services/templates/repository.ts`: persistent templates and adaptive copies. Session snapshots do not follow later template edits.
- `services/export/zipExporter.ts`: schema v2, gallery order, source provenance, quality, actual-image hotspots and original exports.
- `public/sw.js`: static shell only; ignores Vary on cached public static resources. No API/auth response or external VIN cache, no upload queue runner.

## Operating notes and constraints

- Real users must export regularly. Persistent-storage requests can be refused; IndexedDB is not a cloud backup.
- Managers share this standalone device's local workspace; no authenticated multi-dealer mode is enabled.
- Dealer standards set default ratio unless a template has an explicit ratio override. Camera ratio can be changed per shot. All captured metadata describes actual output; nominal exterior target angles are separate from measured camera positions.
- Generic side mirroring does not establish left/right-specific equipment or exact VIN geometry. Source atlas windows are curated and clipped. Uploaded references can replace any shot. Polygon isolation is manual, not automatic AI segmentation.
- Capture uses video pixels at the highest granted stream resolution, not a claim of full sensor still resolution. ImageCapture still APIs were reviewed; shipping an uncalibrated different field of view would undermine preview parity. Add only after physical-device comparison.
- Retake history retains preceding media and deleting a session removes all its media; exports include current gallery and originals of edited photos, not every historical retake.
- Edited photographs retain capture-time quality diagnostics. Editing instructions describe derivatives; no new quality score is fabricated.
- CV is off by default; 0.65 confidence floor, ambiguity rejection, no segmentation/physical distance/pose. Geometry and source/quality measurements are advisory until field calibration.
- Cloud adapter is intentionally inert. RLS membership writes and security-definer helper require redesign and adversarial tenant tests before any enablement; see `database.md`.

## Verification and remaining work

Local test report and artifacts: `CODEX_TEST_REPORT.md` / `docs/evidence`. Physical pilot outcomes are **not run** and must be entered in `PILOT_ACCEPTANCE_V2.md`. Establish approved phone HTTPS access, compare captured files against preview, and calibrate for a sedan/SUV/pickup before calling this production ready. Do not merge or deploy without owner approval.
