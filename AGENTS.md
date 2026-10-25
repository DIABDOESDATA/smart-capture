# Smart Capture — Agent Guidelines & Repository Manifesto

This repository is maintained by autonomous engineering agents working alongside human product strategists. Any agent working on this codebase must adhere strictly to these engineering guardrails:

## 1. Core Operating Principles

1. **Working Functionality Over Facades**: Never commit placeholder buttons that pretend to work, fake upload progress bars, or simulated mockups disguised as completed features. Every UI control must be connected to working code.
2. **Mobile First & Field Ergonomics**: The primary user is an automotive lot specialist holding a smartphone outdoors in bright direct sunlight. Prioritize high-contrast charcoal/white surfaces, 48px+ touch targets, and single-handed thumb accessibility.
3. **No Secret Leaks**: Never commit Supabase service-role keys, private API credentials, or customer PII. Always use environment variables and public client keys.
4. **Offline Resilience**: Automotive car lots frequently have unreliable connectivity. Every new feature must function gracefully when offline by utilizing IndexedDB persistence via `idb`.
5. **Preserve Documentation Integrity**: When adding features, update the corresponding documentation files in `docs/` and verify that all test suites pass.

## 2. Testing & Verification Checklist

Before declaring any task or milestone complete:
- [ ] Run `npx tsc --noEmit` and resolve all type errors.
- [ ] Run `npm run lint` and ensure 0 warnings/errors.
- [ ] Run `npm run format:check` to verify Prettier style consistency.
- [ ] Run `npm test` and verify that all Vitest unit & component tests pass.
- [ ] Run `npm run test:e2e` to ensure all Playwright viewport tests pass.
- [ ] Run `npm run build` to verify the production bundle compiles cleanly.

## 3. Technology Stack Reference

- **UI Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.7 (Strict mode enabled)
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS 3.4 (Automotive charcoal theme: `#0B0D11`, `#12151C`, `#1E2330`, cyan `#06B6D4`, amber `#F59E0B`, emerald `#10B981`)
- **Icons**: Lucide React
- **Local Database**: IndexedDB via `idb` (`smart-capture-db`)
- **Packaging**: JSZip
- **Test Runners**: Vitest 5 (JSDOM environment) & Playwright 1.51 (Chromium & WebKit)
- **Database & Auth (Remote)**: Supabase PostgreSQL with Row Level Security (RLS)
- **Vehicle Intelligence**: Official US DOT NHTSA vPIC Public API

## 4. Licensing Guardrail

Do **NOT** add an open-source license (MIT, Apache, GPL, etc.) to this repository without explicit approval from the repository owner. Commercial licensing is documented as pending in `LICENSE.md` and `README.md`.
