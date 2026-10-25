import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';

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

/**
 * Adapter client to sync Smart Capture galleries with D-Drive Auto Photo Studio & Inventory
 */
export class DDriveAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string = '', baseUrl: string = '') {
    this.apiKey = apiKey;
    this.baseUrl =
      baseUrl || (import.meta.env.VITE_DDRIVE_API_URL as string) || 'https://api.ddriveauto.com';
  }

  /**
   * Look up vehicle in D-Drive inventory by VIN
   */
  async lookupVehicle(vin: string): Promise<Partial<Vehicle> | null> {
    if (!this.apiKey) {
      // Offline/Demo simulator mode
      return {
        vin,
        make: 'BMW',
        model: '330i xDrive',
        year: 2023,
        bodyStyle: 'sedan',
        stockNumber: `DD-${vin.slice(-5)}`,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/inventory/lookup?vin=${encodeURIComponent(vin)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`D-Drive API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn('D-Drive lookup error, falling back:', err);
      return null;
    }
  }

  /**
   * Sync complete capture session to D-Drive Auto Photo Studio
   */
  async syncSession(
    session: VehicleCaptureSession,
    vehicle: Partial<Vehicle>
  ): Promise<DDriveSyncResponse> {
    const sortedShots = [...session.shots].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    const payload: DDriveSyncRequest = {
      dealershipSlug: 'd-drive-auto',
      vin: vehicle.vin || 'UNKNOWN',
      stockNumber: vehicle.stockNumber,
      sessionId: session.id,
      photos: sortedShots.map((s, idx) => ({
        sequenceNumber: idx + 1,
        shotCode: s.shotCode,
        isHero: s.isHero,
        imageDataUrl: s.imageDataUrl,
        quality: {
          blurScore: s.quality.blurScore,
          exposure: s.quality.exposure,
        },
      })),
    };

    if (!this.apiKey) {
      // Simulate real latency & successful integration response for testing
      await new Promise((r) => setTimeout(r, 600));
      return {
        success: true,
        dDriveVehicleId: `dd-veh-${(vehicle.vin || 'vin').slice(-6)}`,
        uploadedPhotoCount: payload.photos.length,
        heroPhotoAssigned: true,
        syncedAt: new Date().toISOString(),
        photoStudioUrl: `https://ddriveauto.com/admin/inventory/${vehicle.vin || 'demo'}/studio`,
      };
    }

    const response = await fetch(`${this.baseUrl}/v1/inventory/sync-gallery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return {
        success: false,
        uploadedPhotoCount: 0,
        heroPhotoAssigned: false,
        syncedAt: new Date().toISOString(),
        error: `Sync failed (${response.status}): ${errBody}`,
      };
    }

    return await response.json();
  }
}
