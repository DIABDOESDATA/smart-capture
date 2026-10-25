# Smart Capture — Automotive Photography Platform

[![CI](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/ci.yml/badge.svg)](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/e2e.yml/badge.svg)](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/e2e.yml)
[![Security Analysis](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/security.yml/badge.svg)](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/security.yml)
[![Deploy to GitHub Pages](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/deploy.yml/badge.svg)](https://github.com/DIABDOESDATA/smart-capture/actions/workflows/deploy.yml)

> **Consistent Vehicle Photos. Every Car. Every Time.**  
> Smart Capture is a commercial-grade, mobile-first Progressive Web Application (PWA) designed for independent dealerships, dealer groups, and vehicle remarketers. It guides dealership staff through standardized lot photography using on-screen vehicle silhouettes, automated VIN decoding, on-device quality checks, and automated gallery syndication.

---

## Key Features

- **Guided Smart Camera**: Proportional vector silhouettes tailored for Sedans, SUVs, Pickup Trucks, Coupes, and Convertibles. Shows exactly how to frame each required angle (hero 3/4, straight front, profiles, rears, cockpit, cluster, and details).
- **HUD Viewfinder Controls**: Real-time opacity slider (10%–90%), high-visibility color presets (Cyan, Green, Amber, White), zoom guide (+/-20%), and rule-of-thirds grid.
- **Hardware Horizon Level Guide**: Reads device orientation sensors to display a level indicator that illuminates green when level within `+/- 2.5 degrees`.
- **VIN Scanner & NHTSA vPIC Decoding**: Scan windshield/door-jamb barcodes or enter 17-digit VINs. Automatically verifies check digits (ISO 3779) and fetches Year, Make, Model, and Body Style from official NHTSA public APIs.
- **On-Device Quality Engine**: Evaluates sharpness via Discrete Laplacian variance and warns of blurry or over/underexposed shots in <25ms on-device without cloud compute costs.
- **Offline-First Resilience**: All captured images, session drafts, and metadata persist in local IndexedDB (`smart-capture-db`). Lot staff can photograph vehicles without Wi-Fi or cellular reception and sync when reconnected.
- **Universal Ordered ZIP & Manifest Export**: Download organized ZIP archives with standard filenames (`01_FRONT_3Q_DRIVER.jpg`), `manifest.json`, and `manifest.csv` for any DMS.
- **D-Drive Auto Partner Adapter**: Direct integration layer syncing galleries and hero thumbnails to D-Drive Auto Photo Studio.
- **Multi-Tenant SaaS Foundation**: Complete PostgreSQL database schema with Row Level Security (RLS) guaranteeing strict dealership isolation.

---

## Technical Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS
- **Icons**: Lucide React
- **Local Storage**: IndexedDB via `idb`
- **Packaging**: JSZip
- **Backend / Auth / Storage**: Supabase (PostgreSQL with RLS)
- **Vehicle Intelligence**: Official NHTSA vPIC Public API
- **Testing**: Vitest (21/21 passing unit & component tests), Playwright (4/4 viewports passing E2E)
- **CI/CD**: GitHub Actions (9 automated workflows)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/DIABDOESDATA/smart-capture.git
cd smart-capture

# Install dependencies
npm ci

# Start local development server
npm run dev

# Run unit tests
npm test

# Run Playwright E2E tests
npm run test:e2e

# Build production bundle
npm run build
```

---

## Architecture & Documentation

Comprehensive documentation is maintained in the [`docs/`](./docs) directory:

- [System Architecture](./docs/architecture.md)
- [Product Requirements (PRD)](./docs/product-requirements.md)
- [Product Roadmap](./docs/roadmap.md)
- [Camera Implementation & WebRTC](./docs/camera-implementation.md)
- [Guided Silhouette Overlays](./docs/guided-overlays.md)
- [Device Compatibility Matrix](./docs/device-compatibility.md)
- [Database Schema & RLS Policies](./docs/database.md)
- [Integrations & D-Drive Adapter](./docs/integrations.md)
- [Quality Assurance & Testing Strategy](./docs/testing.md)
- [Deployment & CI/CD Pipelines](./docs/deployment.md)
- [Security & Data Governance](./docs/security.md)
- [SaaS Cost Model & Unit Economics](./docs/cost-model.md)
- [Competitive Analysis](./docs/competitive-analysis.md)
- [Dealership Pilot Plan](./docs/pilot-plan.md)
- [Engineering Handoff Guide](./docs/handoff.md)

---

## Commercial Licensing

Copyright (c) 2026 DIABDOESDATA / Smart Capture. All rights reserved.  
The licensing terms for this repository are currently **PENDING** formal commercial and legal review. Unauthorized distribution, copying, or commercial exploitation is strictly prohibited without prior written permission.
