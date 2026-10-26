# V2 feature status

| Feature | Status | Evidence / limit |
|---|---|---|
| Real session/manual metadata/VIN decoding | Implemented | Unknown fields stay unknown; NHTSA failures supported |
| VIN barcode scanning | Implemented | ZXing Code39/128/PDF417, callback test; physical labels pending |
| Realistic exterior reference packs | Implemented | Original generated alpha rasters, eight body categories / eight angles via mirrored examples; body/style calibration needed |
| Manager gold-standard references | Implemented | Owned/licensed upload, manual polygon isolation, per-body/per-shot local approval; automatic isolation planned |
| Camera preview/output crop | Implemented | Shared transform, 4:3/16:9/1:1, tests; video frame not full still-sensor claim |
| Overlay controls/presets | Implemented | Calibrated positioning/scale/display and visual baselines |
| Interior/mechanical/detail guides | Implemented | Contextual landmarks and composition regions; dashboard raster where useful; no fake exact interior geometry |
| Adaptive checklists | Implemented | Pickup bed, rear seats optional, fitted third row/roof, convertible roof; 8/12/20/24 presets preserved |
| Physical lens/focus/torch/exposure | Implemented capability controls, unverified on hardware | Browser-exposed capabilities only; physical acceptance required |
| Horizon | Implemented sensor estimate | Null/stale/flat/rotation handling; physical calibration required |
| Image quality | Experimental heuristics | Actual luminance/Laplacian sample, unavailable values null; field thresholds uncalibrated |
| Alignment detector | Experimental, opt-in | Actual local SSD boxes and confidence; measured desktop benchmark, no masks/pose/distance |
| Gallery/reorder/hero/retake/swipe | Implemented | Browser tests, previous capture comparison |
| Non-destructive edits | Implemented | Center crop/straighten/rotate/light; original retention and export tested |
| Sessions/storage/offline/export | Implemented | V1 migration, atomic failures, full sample workflow, production offline tests; browser storage can still be evicted |
| Batch consistency | Implemented | Side-by-side same shot and available measured diagnostics; no invented percentages |
| PWA shell/icons | Implemented | Manifest linked, icons present, service worker offline tests; manual device installation pending |
| Cloud authentication/sync | Disabled / blocked | No configured isolated backend; original RLS must be hardened and tested |
| D Drive synchronization | Disabled | No network side effects, no simulated success; local export only |
| Interactive viewer metadata/hotspots | Implemented contract | Schema v2 links actual captured shot IDs, nominal target angles separate from measured pose |
| Smooth 360 / 3D reconstruction | Planned | Requires dedicated capture and processing; not claimed from 20 shots |
| Real-vehicle pilot / production readiness | Pending human acceptance | NOT RUN; owner approval required before merge/deploy/integration |
