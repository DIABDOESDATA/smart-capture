# Smart Capture V2 baseline audit

2026-10-25. Main at checkout; issues #1 (physical pilot), #2 (DMS adapters), #3 (CV research) reviewed through GitHub connector. No D Drive production access or deployment is authorized.

## Confirmed defects

| Priority | Evidence | Impact |
|---|---|---|
| P0 | SmartCameraView object-cover viewport differs from full video drawImage | Saved composition differs from preview |
| P0 | Capture substitutes synthetic canvas after camera denial; records lack source | Test media mixed with inventory |
| P0 | DDriveAdapter returns simulated success without credentials | False synchronization |
| P0 | Camera commit does not await save; App updates state before DB success | Advances after failed save |
| P1 | Scanner never detects barcode; App discards callback | Scanner not functional |
| P1 | Form substitutes 2024/Vehicle/Inventory; unknown body defaults sedan | Fabricated metadata |
| P1 | Template editor changes state only; reopen loses body/sequence | Changes do not persist |
| P1 | Full data URLs embedded in session | Repeated large writes and memory pressure |
| P1 | Horizon defaults zero and ignores screen rotation | False LEVEL |
| P1 | Schematic SVGs and missing-shot rectangle | Inadequate primary guidance |
| P1 | Gallery lacks reorder/resume/derivatives/download | Incomplete workflow |
| P1 | Export catches image failures and continues | Silently incomplete archive |
| P1 | Any member can write membership/roles; definer helper lacks fixed search_path | Cloud isolation is not ready |
| P2 | Dashboard hard-codes +100%,98.4%,4.2min; navbar claims sync based on online | Misleading metrics |
| P2 | Missing PNG icons, no service worker | Offline/install claims unsupported |

## Baseline checks

npm ci passed (0 reported vulnerabilities). Unit/component 21 passed across 6 files. ESLint, noEmit, build passed. Format FAILED on 29 source files. Original E2E attempted; initial launch failed due to missing browser runtime. Retry and final report follow. Existing E2E only takes two photos and opens export; it never validates downloads, phone cameras or storage errors.

## Decisions

Preserve React/Vite, template presets, VIN validator, quality algorithm and database name. Versioned Blob media and immutable template snapshots. Explicit sample provenance. Optional CV fails to manual guidance. Original generated raster references are body-style examples, never VIN-specific geometry. Cloud and D Drive remain disabled. Continue implementation after this audit.
