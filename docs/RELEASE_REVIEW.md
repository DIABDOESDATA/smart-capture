# Public-release review — 2026-10-26

This pass upgrades the standalone product toward a public release candidate. It does not claim superiority over untested competitors or guarantee zero defects. No merge, hosting deployment, App Store submission, Google Play submission, or D Drive production integration is authorized by this review.

## Confirmed problems addressed

- The home screen and crowded header exposed pilot implementation details instead of a clear studio workflow. Replaced them with a coherent studio home, thumb-friendly mobile navigation, saved-session continuation, meaningful empty/search states and configurable studio identity. Existing workspace keys and sessions remain intact.
- VIN Decode overlaid its input on small screens. It now has a separate grid column; phone inputs use 16px text, and manual/offline entry is explained.
- Leaving a pending photo could discard it immediately. Added Keep / Continue reviewing / Discard choices, a save-aware exit, and browser unload protection.
- Camera metadata handling drew a video frame before playback was necessarily ready. Resolution now comes from crop geometry without premature drawing. Device enumeration failure no longer makes an otherwise working camera unusable; failed camera startup stops its stream.
- AI guidance could retain a prior shot/crop measurement. Context changes clear it, late inference results are rejected, and capture metadata only records fresh measurements from the current exterior shot. The model stays warm during review; screen-wake requests are best effort.
- Reference/settings/review/export overlays lacked native modal focus isolation. Native dialogs now provide focus trapping, Escape behavior, an inert background, and focus restoration.
- Gallery export generated a ZIP after the download tap, risking loss of mobile user activation. Preparation happens before the final tap; downloads and supported native sharing use the ready file directly.
- Service-worker installs activated immediately, used a manually incremented cache key, and did not precache optional screen chunks. Build-derived versions now precache all application chunks and reference packs, wait for a safe user-requested update, and block forced activation while another app window is open.
- Added Android install prompt support, iPhone/Safari instructions, installed/offline/update state, privacy explanation and storage protection requests.
- Added a resumable offline AI pack download with pinned byte lengths and SHA-256 verification. Individual inference remains local. The optional 18.56 MB model is not part of the initial shell download.

- CI caught a workspace-save race that cleared success feedback and could cancel an AI download. Modal lifecycle and name synchronization are now independent; a component regression covers the parent update.
- Reviewed CI screenshots for desktop and iPhone home, settings, vehicle form and portrait/landscape camera. Approved the two changed camera baselines after verifying the frame and shutter remain visible. Strengthened gallery navigation assertions to wait for the gallery heading, not matching camera progress text.

## Validation and evidence

The local in-app browser permission gate continues to deny observation of localhost:5173, despite two explicit user confirmations. Its block has not been bypassed. Local source, unit, lint, type and build checks remain available. Browser execution and review evidence use the repository's existing isolated GitHub CI checkout and test fixtures, not the user's open browser or stored photos.

Additional tests cover worker update isolation, offline asset selection, excluded API requests, verified AI downloads, safe export preparation, unchanged workspace data identity, native modal behavior, viewport bounds, unsaved-photo recovery, workspace persistence, search/deletion confirmation and automated WCAG checks with axe. Browser fixtures run in Chromium and WebKit; they do not constitute physical device acceptance.

Local checks: 84 unit/component tests pass; TypeScript, ESLint and Prettier pass. Production build and the final browser/production-offline rerun are tracked on PR #12. The final review deliverable records the exact tested commit and CI links.

## Release gates still requiring external evidence

- A stable owner-approved HTTPS host and release URL. The branch remains undeployed.
- Physical Android Chrome and iPhone Safari installation, camera/lens/motion behavior, screen rotation, thermal/battery behavior, save/reload/offline export and native share. Use PILOT_ACCEPTANCE_V2.md and record actual phone/OS/browser versions.
- Real vehicles: sedan/SUV/pickup, dark and light finishes, sunlight/shade/interiors; calibrate AI and quality thresholds. The assistant is advisory and remains explicitly beta.
- Cloud/accounts/team isolation are disabled. Public local-only use must not be described as authenticated cloud storage or synchronization.
- Owner-selected distribution/licensing/support policies before public launch. Existing LICENSE.md is unchanged. A PWA install is not an App Store or Google Play listing.

## Install behavior references

Apple's [Safari web-app instructions](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios) informed the iPhone install guidance. [web.dev's update lifecycle](https://web.dev/learn/pwa/update) informed the waiting-worker design. The app offers update activation only from Sessions, and the worker rejects activation if other app windows are open.

## Reproducible browser runner

The browser jobs remained in dependency installation for more than ten minutes on the moving ubuntu-latest image, before any tests ran. Both browser workflows now pin Ubuntu 24.04, a platform in the [Playwright support matrix](https://playwright.dev/docs/intro#system-requirements), to reduce runner-image drift. This is an infrastructure adjustment, not a relaxed test or skipped check.
