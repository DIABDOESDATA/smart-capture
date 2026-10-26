import { VehicleCaptureSession } from '@/types/capture';
import { Vehicle } from '@/types/vehicle';
export interface DDriveSyncResponse {
  success: boolean;
  uploadedPhotoCount: number;
  heroPhotoAssigned: boolean;
  syncedAt?: string;
  error?: string;
}
/** Intentionally disabled throughout the standalone pilot. No network side effects. */
export class DDriveAdapter {
  constructor(_apiKey = '', _baseUrl = '') {}
  async lookupVehicle(_vin: string): Promise<Partial<Vehicle> | null> {
    throw new Error('D Drive integration is disabled for standalone pilot review.');
  }
  async syncSession(
    _session: VehicleCaptureSession,
    _vehicle: Partial<Vehicle>
  ): Promise<DDriveSyncResponse> {
    return {
      success: false,
      uploadedPhotoCount: 0,
      heroPhotoAssigned: false,
      error: 'D Drive integration is disabled. Export this gallery locally for review.',
    };
  }
}
