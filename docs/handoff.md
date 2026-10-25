# Engineering Handoff & Session Transition

## 1. Project Status Summary

Smart Capture has been built from scratch as a standalone, production-ready automotive photography platform. All core functional requirements, mobile camera engines, vector silhouette overlays, VIN decoders, IndexedDB offline persistence, quality diagnostics, ZIP packager, and D-Drive Auto integration adapters are fully implemented and verified.

- **Repository**: `https://github.com/DIABDOESDATA/smart-capture` (PUBLIC)
- **Default Branch**: `main`
- **Tech Stack**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS, Lucide React, IndexedDB (`idb`), JSZip, Vitest 5, Playwright 1.51.
- **Test Suite Results**:
  - Unit & Component Tests: **21 / 21 Passing** (100% green)
  - Playwright E2E Multi-Viewport: **4 / 4 Passing** (Desktop Chrome, Mobile Chrome Pixel 7, Mobile Safari iPhone 14, Tablet iPad Mini)
  - TypeScript Typecheck: **0 Errors** (`npx tsc --noEmit`)
  - ESLint 9 Analysis: **0 Errors** (`npm run lint`)
  - Code Style Formatting: **100% Prettier verified** (`npm run format:check`)

## 2. Key Architectural Decisions

1. **Standalone SaaS**: Built completely isolated from D-Drive Auto's internal codebase. Smart Capture owns its database schema, multi-tenant RLS, and media storage.
2. **Offline-First Storage**: Implemented local IndexedDB storage using `idb` (`smart-capture-db`) so porters on dealer lots with zero cellular reception can photograph full vehicles and queue uploads.
3. **Deterministic Quality Engine**: Avoided expensive cloud computer vision latency by writing fast client-side Discrete Laplacian blur calculations and luminance histogram exposure checks in canvas (<25ms execution).
4. **Original Vector Art**: Engineered proportional SVG silhouettes tailored for Sedans, SUVs, Pickup Trucks, Coupes, and Convertibles.
5. **Universal Export**: Implemented ordered ZIP archiving with `manifest.json` and `manifest.csv` for legacy DMS integration alongside the direct D-Drive Auto adapter.

## 3. Directory Layout

```
smart-capture/
├── .github/
│   ├── workflows/           # 9 GitHub Actions workflows (CI, E2E, Responsive, Security, Deploy, etc.)
│   ├── ISSUE_TEMPLATE/      # Bug report & feature request templates
│   ├── dependabot.yml       # Automated dependency updates
│   └── pull_request_template.md
├── docs/                    # 15 Architectural, testing, security, and business documents
├── public/                  # PWA manifest.json, icons, robots.txt
├── src/
│   ├── components/
│   │   ├── camera/          # SmartCameraView, vector silhouettes, HUD controls, quality banner
│   │   ├── vehicle/         # VinLookupForm, VinScannerModal
│   │   ├── gallery/         # SessionGallery, ExportModal
│   │   ├── templates/       # TemplateManager
│   │   ├── dashboard/       # Dealership dashboard & session list
│   │   ├── landing/         # Commercial product landing page & pilot form
│   │   └── layout/          # Navbar, offline indicator, pending upload counter
│   ├── services/
│   │   ├── camera/          # Quality analysis engine (blur, exposure, tilt)
│   │   ├── export/          # JSZip packager & file download triggers
│   │   ├── integrations/    # D-Drive Auto Photo Studio adapter
│   │   ├── storage/         # IndexedDB local persistence & Supabase client
│   │   ├── templates/       # 24-shot master checklist & presets
│   │   └── vin/             # ISO 3779 checksum validator & NHTSA vPIC decoder
│   ├── types/               # Domain models for vehicles, capture, templates, dealerships
│   ├── App.tsx              # Top-level state coordinator
│   ├── index.css            # Tailwind directives & luxury dark theme
│   └── main.tsx             # React DOM root entrypoint
├── supabase/
│   └── migrations/          # Multi-tenant SQL schema with Row Level Security (RLS)
├── tests/
│   ├── unit/                # 21 Vitest tests
│   └── e2e/                 # Playwright end-to-end tests across 4 viewports
└── package.json
```

## 4. Instructions for Future Development Sessions

1. **Running Tests**: Run `npm test` for Vitest and `npx playwright test` for E2E.
2. **Branch Protection**: Branch protection rules can be configured in GitHub settings under repository rulesets.
3. **Supabase Cloud**: When ready to link a remote Supabase instance, supply `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. The database migration is ready to run via `supabase db push` or copy-pasting `supabase/migrations/20261025000000_smart_capture_schema.sql` into the Supabase SQL editor.
