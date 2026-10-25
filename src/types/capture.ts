import { ShotAngle } from './template';

export type SessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'pending_upload'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'archived';

export type ExposureAssessment = 'normal' | 'underexposed' | 'overexposed';

export interface QualityMetric {
  blurScore: number; // Variance of Laplacian (higher is sharper, <100 considered blurry)
  isBlurry: boolean;
  exposure: ExposureAssessment;
  meanLuminance: number; // 0 - 255
  tiltDegrees: number; // Horizon tilt (-45 to 45 deg)
  isLevel: boolean;
  width: number;
  height: number;
  warnings: string[];
  userApprovedWarning?: boolean;
}

export interface CapturedShot {
  shotId: string;
  shotCode: ShotAngle;
  shotName: string;
  sequenceOrder: number;
  imageDataUrl: string; // Base64 or Blob URL for display
  rawBlob?: Blob;
  capturedAt: string;
  isHero: boolean;
  retakeCount: number;
  quality: QualityMetric;
  notes?: string;
  syncStatus: 'local' | 'uploading' | 'synced' | 'error';
  remoteStoragePath?: string;
  remoteUrl?: string;
}

export interface VehicleCaptureSession {
  id: string;
  dealershipId: string;
  vehicleId: string;
  templateId: string;
  employeeId: string;
  employeeName: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  shots: CapturedShot[];
  notes?: string;
  syncPendingCount: number;
  exportedAt?: string;
  createdAt: string;
  updatedAt: string;
}
