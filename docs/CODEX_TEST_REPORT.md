# V2 test report — 2026-10-25

Local verification on this Windows execution host. Browser results are emulation, not real phone camera acceptance. Baseline main: `301c4df`.

| Check | Result |
|---|---|
| npm ci / dependency audit | PASS, 0 reported vulnerabilities |
| npx tsc --noEmit | PASS |
| npm run lint | PASS, 0 errors/warnings |
| npm run format:check | PASS (baseline failed all 29 source files) |
| npm test | PASS, 66 tests / 10 files (baseline 21 / 6) |
| npm run build | PASS; optional TF runtime chunk-size warning retained |
| npm run test:e2e | PASS, 34 passed, 2 skipped, 0 failed across desktop Chrome, Pixel 7, iPhone 14 WebKit, iPad Mini WebKit |
| Visual regression | Four checked-in camera reference baselines; comparison run passed after baseline generation |
| npm run test:offline | PASS Chromium + WebKit production shell reload, recovered session, decoded thumbnail, export event, no page errors |
| Detector benchmark | Completed desktop smoke test; raw evidence and limitations in CV_EVALUATION_V2.md |
| GitHub CI | Requested by the PR; final remote check state recorded in PR/handoff |
| Physical Android/iOS / dealership pilot | NOT RUN; requires human and actual vehicles |
| Cloud RLS/auth/storage | NOT RUN; cloud remains disabled, original policy risks documented |

## What the browser tests establish

A full 20-shot premium sample sequence completes, persists after reload and resumes at the next missing shot. Photo media IDs and lightweight metadata persist; exports contain 20 decodable JPEG payloads in the reordered gallery order, source labels, required completion, hero and schema v2. Real fake-device streams use real capture code with square crop; WebKit does not support Chromium's fake-camera flags, so these two cases are explicitly skipped. Barcode recognition/confirmation is exercised through a controlled decoder callback, not a claim of physical label-reading accuracy.

Quota injection retains review without advance and rolls media/session writes back together. Retakes preserve identity/history; hero and order persist. Approved references survive reopen. Adjustments retain original bytes and export original plus derivative. Saved template changes affect new sessions while existing snapshots remain stable. Four visual baselines cover the reference viewport; screenshots are labeled sample mode.

## Environment limits and resolved failures

- Initial browser run failed because this host's sandbox looked for browser binaries in its virtual profile. Runs use PLAYWRIGHT_BROWSERS_PATH pointing to the installed runtime. This is a local executor setup detail, not an application setting.
- Chromium downloads are canceled by this Windows sandbox even for a standalone five-byte Blob, including a writable download directory. E2E annotations disclose the limitation: the download event is checked and archive bytes are independently validated in-browser. WebKit actually writes and unpacks the download. Linux CI requires a real successful download. Physical Android/desktop download acceptance remains required.
- Windows WebKit initially rejected Blob-backed IDB records; atomic byte fallback now passes complete-session and media round-trip tests.
- Production Chromium offline reload initially failed due to Vary: Origin matching on static cached assets. Same-origin public static-cache matching now ignores Vary; both production offline checks pass. API/auth responses are not cached.
- Atlas neighbor leakage and template ratio override were caught and fixed during browser review.
- JSDOM uses a URL shim for fake-indexeddb metadata/transaction tests; actual Blob encode/store/decode round trips are browser-tested.

No test results establish actual lens quality, optical zoom, sensor orientation accuracy, outdoor visibility, CV precision/recall, employee cycle time, or multi-tenant backend isolation. Those remain pending in PILOT_ACCEPTANCE_V2.md.

Final migration guard: legacy convertibles without fitted-feature flags retain their original checklist length; only new feature-aware sessions add roof-state scenes. Regression test passed.

VIN correction regression: repeated scanner frames cannot overwrite an already recognized candidate while the operator edits it. Accessible vehicle field labels remain available at phone sizes.

Remote CI corrections: reference uploads are signature-checked and decoded/re-encoded to PNG before DOM preview (SVG/HTML rejected). Pixel screenshots use explicit integer CSS clipping bounds before visual comparison; the image content and 4% pixel tolerance remain tested.
