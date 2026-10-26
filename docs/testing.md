# V2 quality assurance

Run lint, format:check, tsc --noEmit, npm test, build, test:e2e and test:offline. The offline script requires a production build and starts/stops its own preview server. Existing E2E and responsive workflows cover Chromium and WebKit viewports; the E2E workflow also verifies production offline reload.

Unit tests cover cover-crop/orientation, reference geometry/body variants, quality unknown states, lifecycle cancellation/denial, sequence/retakes, required shots, barcode confirmation, immutable templates, actual v1 IndexedDB migration, atomic rollback, idempotency, no fake sync and ordered manifests. Playwright covers complete 20-shot sample export/reload/resume, geometry controls/landscape, save failures, retakes/hero, real fake-device capture ratio, approved references, derivative originals and template snapshots. Camera reference screenshots have checked-in visual baselines with 4% pixel tolerance to accommodate browser/OS rasterization.

Windows sandbox Chromium downloads cancel even a standalone five-byte Blob. Annotated E2E verifies its download event and independently validates archive bytes; WebKit writes and unpacks actual downloads. Linux CI runs the actual-download assertion. This exception is not evidence of physical Android downloads. IndexedDB byte fallback is exercised in Windows WebKit. JSDOM storage tests validate transactions and metadata; real Blob round trips are covered by browser tests.

See [CODEX_TEST_REPORT.md](CODEX_TEST_REPORT.md) for recorded results and [PILOT_ACCEPTANCE_V2.md](PILOT_ACCEPTANCE_V2.md) for human-only tests. No browser emulation establishes real mobile image quality or complete cloud isolation.
