> Historical V1 planning document. Current implementation, disabled cloud/integrations, and unrun physical acceptance are documented in [CODEX_HANDOFF.md](CODEX_HANDOFF.md). Do not interpret historical launch or verification claims as V2 evidence.

# Integrations & Dealership Syndication API

## 1. D-Drive Auto Integration (First Customer)

D-Drive Auto (`https://ddriveauto.com`) is the launch customer for Smart Capture. The integration bridges lot photography directly into D-Drive's Photo Studio without manual file transfers.

### Integration Contract:

```typescript
export interface DDriveSyncRequest {
  dealershipSlug: string;
  vin: string;
  stockNumber?: string;
  sessionId: string;
  photos: {
    sequenceNumber: number;
    shotCode: string;
    isHero: boolean;
    imageDataUrl: string;
    quality: {
      blurScore: number;
      exposure: string;
    };
  }[];
}

export interface DDriveSyncResponse {
  success: boolean;
  dDriveVehicleId?: string;
  uploadedPhotoCount: number;
  heroPhotoAssigned: boolean;
  syncedAt: string;
  photoStudioUrl?: string;
  error?: string;
}
```

### Safety & Isolation Boundaries:
- Standalone Smart Capture codebase has **zero write access** to D-Drive Auto's production database.
- Smart Capture communicates strictly over authenticated HTTPS REST endpoints with scoped partner tokens.
- No D-Drive service-role keys are ever embedded in client-side code.
- If the endpoint is unreachable or testing in offline simulation mode, the adapter returns simulated confirmation responses to ensure lot staff can continue photographing inventory.

## 2. Standardized ZIP & Manifest Export (Universal DMS)

For dealerships not yet utilizing direct API integrations, Smart Capture generates a standardized ZIP archive conforming to mainstream DMS requirements (DealerCenter, Frazer, Reynolds & Reynolds, CDK Global):

### Structure:
```
VIN_STOCK.zip
├── 01_FRONT_3Q_DRIVER.jpg       (Primary hero listing image)
├── 02_STRAIGHT_FRONT.jpg
├── 03_FRONT_3Q_PASSENGER.jpg
├── ...
├── 20_VIN_DOOR_JAMB.jpg
├── manifest.json                (Machine-readable session and quality metadata)
├── manifest.csv                 (Spreadsheet for legacy DMS batch import)
└── README.txt                   (Human-readable summary and photo count)
```

### CSV Schema:
```csv
Order,Filename,ShotCode,ShotName,IsHero,CapturedAt,BlurScore,Exposure,TiltDegrees
1,01_FRONT_3Q_DRIVER.jpg,FRONT_3Q_DRIVER,"Front Driver-Side 3/4 (Hero)",true,2026-10-25T01:30:00Z,124.5,normal,0.4
2,02_STRAIGHT_FRONT.jpg,STRAIGHT_FRONT,"Straight Front",false,2026-10-25T01:30:15Z,118.2,normal,0.0
```
