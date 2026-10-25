# Product Requirements Document (PRD) — Smart Capture

## 1. Executive Summary

Smart Capture is a commercial B2B SaaS platform providing independent automotive dealerships, dealer groups, and wholesale remarketers with a standardized, guided mobile vehicle photography solution. By replacing ad-hoc lot photography with on-screen silhouette framing, automatic VIN decoding, client-side quality assurance, and automated gallery organization, Smart Capture cuts photography cycle time, eliminates retakes, and elevates digital showroom presentation.

## 2. Target Persona & User Journey

### Primary Persona: Lot Operations Specialist / Porter
- **Environment**: Standing outside on dealer lot in bright daylight, summer heat, or winter cold.
- **Goal**: Photograph incoming inventory quickly (under 5 minutes per vehicle) without memorizing angles or having images rejected by the sales manager.
- **Frustration**: Forgetting required shots (e.g. odometer or window sticker), guessing angles, holding phones unlevel, having to re-park vehicles for retakes.

### Secondary Persona: Dealership General Manager / Digital Marketing Director
- **Goal**: Consistent, premium visual branding across all inventory on website, AutoTrader, CarGurus, and Cars.com.
- **Frustration**: Disorganized inventory photos taken at inconsistent heights and angles; porter staff turnover causing quality dips; high labor cost manually organizing photo folders.

## 3. Functional Requirements

### 3.1 Vehicle Identification
- **FR-1.1**: Decode modern 17-character VINs via official NHTSA vPIC Public API.
- **FR-1.2**: Calculate Modulus 11 check digits according to ISO 3779 / 49 CFR Part 565.
- **FR-1.3**: Detect OCR ambiguity (O/0, I/1) and provide suggested corrections without silent auto-mutation.
- **FR-1.4**: Automatically infer vehicle BodyStyle (Sedan, SUV, Truck, Coupe, Convertible, Van, Wagon) from NHTSA data.
- **FR-1.5**: Permit manual 1-click override of suggested body classification.

### 3.2 Guided Camera HUD
- **FR-2.1**: Access device environment (rear) camera by default with high-resolution constraints (up to 4K/1080p).
- **FR-2.2**: Render original vector silhouettes matching specific body style and shot angle (not generic bounding boxes).
- **FR-2.3**: Provide HUD controls for silhouette opacity (10%-90%), outline color presets (Cyan, Green, Amber, White), zoom guide scale (+/-20%), and 3x3 framing grid.
- **FR-2.4**: Read real-time `DeviceOrientationEvent` sensor data to show a dynamic horizon level guide that illuminates green when level within +/-2.5°.
- **FR-2.5**: Gracefully fallback to camera simulation preview when hardware permissions are denied or running in automated test environments.

### 3.3 Quality Review Engine
- **FR-3.1**: Compute image sharpness via Discrete Laplacian variance (<25ms sample processing).
- **FR-3.2**: Evaluate exposure distribution via luminance histogram (detect underexposure <40 mean luma or overexposure >220).
- **FR-3.3**: Display non-obstructive quality advisory banner with "Retake Shot" and "Keep Anyway" actions (staff always retains final override).

### 3.4 Dealership Templates & Sequencing
- **FR-4.1**: Standard 24-shot master walkaround sequence with Shot #1 designated as Front Driver-Side 3/4 Hero.
- **FR-4.2**: Pre-configured templates: D-Drive 20-Shot Premium, Full 24-Shot Luxury, Fast 12-Shot Retail, 8-Shot Wholesale.
- **FR-4.3**: Allow managers to designate shots as Required vs Optional and set custom Hero thumbnail angles.

### 3.5 Offline Persistence & Upload Resilience
- **FR-5.1**: Persist all session drafts, captured photo data, and vehicle metadata locally in IndexedDB using `idb`.
- **FR-5.2**: Maintain local upload queue with retry counters and connectivity status indicators.
- **FR-5.3**: Never lose photographs due to lot connectivity drops or accidental tab closures.

### 3.6 Gallery Management & Export
- **FR-6.1**: Gallery review grid comparing captured angles against template requirements.
- **FR-6.2**: Standardized ordered ZIP export with filenames (`01_FRONT_3Q_DRIVER.jpg`), `manifest.json`, and `manifest.csv`.
- **FR-6.3**: Direct integration adapter for D-Drive Auto Photo Studio syndication.
