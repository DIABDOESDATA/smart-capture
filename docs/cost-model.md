# SaaS Unit Economics & Cloud Cost Model

## 1. Cost Philosophy

To guarantee high gross margins and eliminate runway burn during early dealership onboarding, Smart Capture minimizes per-vehicle variable infrastructure costs:
- **Zero AI Cloud Compute Per Frame**: Instead of streaming 30 FPS video to expensive cloud computer vision APIs (which would cost \$10–\$50+ per vehicle), Smart Capture performs all silhouette guidance, blur detection, exposure histograms, and sensor math on-device in the mobile browser.
- **Official Free NHTSA API**: Public VIN decoding leverages the official US government vPIC API without third-party per-VIN subscription fees.
- **Client-Side ZIP Archiving**: Ordered ZIP files are compressed directly on the user's phone or desktop using `JSZip`, consuming zero server CPU or memory.

## 2. Infrastructure Cost Projection

### Scenario A — 1 Dealership (Pilot / 50 Vehicles per Month)
- **Vehicles Photographed**: 50
- **Total Photos**: 50 vehicles × 20 photos = 1,000 photos / month
- **Storage Volume**: ~2.5 GB / month (at 2.5 MB / photo)
- **Hosting (GitHub Pages / Cloudflare Pages)**: \$0.00 / month (Free tier)
- **Supabase Cloud (Free Tier)**: \$0.00 / month (Up to 500 MB DB, 1 GB Storage)
- **NHTSA vPIC API**: \$0.00 / month (Free public API)
- **Total Monthly Infrastructure Cost**: **\$0.00 / month**
- **Subscription Revenue (Pro Plan @ \$79/mo)**: **\$79.00 / month**
- **Gross Margin**: **100%**

### Scenario B — 10 Dealerships (Early Traction / 500 Vehicles per Month)
- **Vehicles Photographed**: 500
- **Total Photos**: 10,000 photos / month
- **Storage Volume**: ~25 GB / month
- **Hosting (Cloudflare Pages)**: \$0.00 / month (Unlimited bandwidth)
- **Supabase Pro Tier**: \$25.00 / month (8 GB database, 100 GB storage included)
- **Egress / Bandwidth**: \$2.25 (Additional storage / CDN transfer)
- **Total Monthly Infrastructure Cost**: **~\$27.25 / month**
- **Subscription Revenue (10 × \$79/mo)**: **\$790.00 / month**
- **Gross Margin**: **~96.5%**

### Scenario C — 100 Dealerships (Scaling SaaS / 5,000 Vehicles per Month)
- **Vehicles Photographed**: 5,000
- **Total Photos**: 100,000 photos / month
- **Storage Volume**: ~250 GB / month
- **Hosting**: \$20.00 / month
- **Supabase Pro + S3 Media Storage (AWS S3 or Cloudflare R2)**: \$45.00 / month (Cloudflare R2 provides zero egress fees at \$0.015/GB storage = \$3.75/mo)
- **Total Monthly Infrastructure Cost**: **~\$65.00 / month**
- **Subscription Revenue (100 × \$79/mo)**: **\$7,900.00 / month**
- **Gross Margin**: **~99.1%**

## 3. Cost Risk Flags & Mitigation

1. **Storage Growth**: Retaining raw full-resolution camera originals indefinitely without lifecycle cleanup could inflate storage. *Mitigation: Implement 90-day cold storage tiering for archived vehicle media.*
2. **Bandwidth Outages**: Cloud providers charging for egress can spike costs. *Mitigation: Transition media storage to Cloudflare R2 (S3-compatible with \$0 egress charges).*
