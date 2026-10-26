> Historical V1 planning document. Current implementation, disabled cloud/integrations, and unrun physical acceptance are documented in [CODEX_HANDOFF.md](CODEX_HANDOFF.md). Do not interpret historical launch or verification claims as V2 evidence.

# Deployment Architecture & CI/CD Pipelines

## 1. Zero-Cost Production Hosting

Smart Capture is built to run on cost-conscious, high-performance static edge infrastructure. Because the core camera, VIN scanner, image quality checks, and IndexedDB storage operate entirely on the client, the frontend application can be served from free-tier static hosting with global CDN delivery and automatic SSL certificates.

### Supported Production Platforms:
1. **GitHub Pages (Primary Built-in Deployment)**:
   - Configured via `.github/workflows/deploy.yml`.
   - Automated deployment on push to `main`.
   - Global CDN distribution, HTTPS by default.
   - Hosted at: `https://DIABDOESDATA.github.io/smart-capture/`
2. **Cloudflare Pages (Alternative Production Platform)**:
   - Zero-cost tier with unlimited bandwidth.
   - Fast edge response times and instant branch preview environments.
3. **Custom Domain**:
   - Easily mapped to `capture.diabdoesdata.com` via CNAME record.

## 2. Environment Variables

Configure these in the deployment platform or GitHub Repository Settings -> Secrets:

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `VITE_APP_URL` | Public application URL | No | `http://localhost:3000` |
| `VITE_BASE_PATH` | Base URL path for router | No | `./` (or `/smart-capture/`) |
| `VITE_SUPABASE_URL` | Multi-tenant Supabase project URL | No | Empty (Local IDB fallback) |
| `VITE_SUPABASE_ANON_KEY` | Public client anon key | No | Empty (Local IDB fallback) |
| `VITE_NHTSA_API_URL` | Official NHTSA vPIC Public API URL | No | `https://vpic.nhtsa.dot.gov/api` |
| `VITE_DDRIVE_API_URL` | D-Drive Auto integration endpoint | No | `https://api.ddriveauto.com` |

## 3. GitHub Actions Workflows Matrix

| Workflow | File | Trigger | Purpose |
| --- | --- | --- | --- |
| **CI** | `ci.yml` | Push & PR | Lint, Prettier, TypeScript, Vitest, Build, Dist Artifacts |
| **E2E Tests** | `e2e.yml` | Push & PR | Playwright core tests with mocked camera stream |
| **Responsive Matrix** | `responsive.yml` | Push & PR | Multi-viewport tests (iPhone 14, Pixel 7, iPad Mini) |
| **Security Analysis** | `security.yml` | Weekly & Push | CodeQL static scan & NPM dependency vulnerability audit |
| **Deploy** | `deploy.yml` | Push to `main` | Production build and automated deployment to GitHub Pages |
| **Release** | `release.yml` | Git Tag `v*.*.*` | Release build packaging, changelog generation, GitHub Release |
| **Health Check** | `health-check.yml` | Daily schedule | Ping public NHTSA vPIC API and integration uptime |
| **Manual Ops** | `manual.yml` | Manual dispatch | Full regression suite, security audit, or preview build |
