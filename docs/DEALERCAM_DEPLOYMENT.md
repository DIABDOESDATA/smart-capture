# DealerCam hosting — 2026-10-26

The owner authorized publishing the standalone release candidate at **https://dealercam.diabdoesdata.com/** for phone testing. The app is deployed and HTTPS is verified. The existing D Drive application and production infrastructure were not modified. Main remains unmerged.

## Published build

- Application source: `c654232ea18bdd2738a867ed467acd26a9553855`.
- Netlify project: `dealercam-diabdoesdata`, team `emdleb`.
- Site ID: `862f513a-a5e8-4217-831c-f1af4f3c0a9a`.
- Deploy ID: `6adfb82c9d3f2e7e6e9abf09`.
- [Deployment dashboard](https://app.netlify.com/projects/dealercam-diabdoesdata/deploys/6adfb82c9d3f2e7e6e9abf09).
- Secondary address: https://dealercam-diabdoesdata.netlify.app/.

This is a manual publication of the tested static build. Git continuous deployment is not connected to this site. Future repository pushes do not automatically change the live app. Local Netlify association files are ignored through `.netlify/` in `.gitignore`.

## Domain and HTTPS

DNS is managed at Spaceship. The added record is:

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | dealercam | dealercam-diabdoesdata.netlify.app | 30 minutes |

Netlify has `dealercam.diabdoesdata.com` assigned as the custom domain. Its managed Let's Encrypt certificate is issued, and `force_ssl` is enabled. HTTP requests redirect to HTTPS.

## Verification

- Public Google and Cloudflare DNS resolvers return the expected CNAME.
- The custom HTTPS URL responds with HTTP 200 and a valid certificate.
- HTTP requests redirect to the custom HTTPS URL.
- Hosted HTML, manifest, service worker, model definition and entry JavaScript match the local tested build byte-for-byte by SHA-256.
- Service-worker responses use `no-cache, no-store, must-revalidate`; hashed application assets use immutable caching.
- The actual app rendered at the custom hostname, and Studio settings reported **App ready for offline use**.
- Application tests for the published source previously passed: 86 unit/component tests and 50 distinct browser cases, with 2 Chromium-only fixtures skipped in WebKit. Physical phone/vehicle acceptance remains pending.

## Publish an approved update

Use Node.js 24 and check out the reviewed application revision before building:

```sh
npm ci
npm run build
npx netlify-cli deploy --prod --no-build --dir dist --site 862f513a-a5e8-4217-831c-f1af4f3c0a9a
```

`netlify.toml` records the build directory, Node version and cache headers. No secret values are required in the browser build. After publishing, verify HTTPS, the service worker and a saved-session round trip. Installed clients receive the app's existing safe-update flow.

## Phone use

Open https://dealercam.diabdoesdata.com/ in Safari on iPhone or Chrome on Android. Allow camera access when starting a real photo session. Use the app's installation guidance to add it to the home screen. Wait for offline readiness before testing without connectivity; download the optional AI pack separately if needed.

Photos and sessions remain local to the browser/device. Cloud accounts and synchronization are disabled. Export important galleries regularly. Physical acceptance steps are in [PILOT_ACCEPTANCE_V2.md](PILOT_ACCEPTANCE_V2.md).
