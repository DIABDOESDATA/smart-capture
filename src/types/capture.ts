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
export type ExposureAssessment = 'normal' | 'underexposed' | 'overexposed' | 'unknown';
export interface QualityMetric {
  blurScore: number | null; // Variance of Laplacian (higher is sharper, <100 considered blurry)
  isBlurry: boolean | null;
  exposure: ExposureAssessment;
  meanLuminance: number | null; // 0 - 255
  tiltDegrees: number | null; // Horizon tilt (-45 to 45 deg)
  isLevel: boolean | null;
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
  imageId?: string;
  previousImageId?: string;
  thumbnailUrl?: string;
  source?: 'camera' | 'sample' | 'legacy_unknown';
  metadata?: CaptureMetadata;
  edits?: PhotoEdits;
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
  templateSnapshot?: import('./template').CaptureTemplate;
  standardSnapshot?: PhotographyStandard;
  schemaVersion?: 2;
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
export interface PhotoEdits {
  rotate: number;
  straighten: number;
  brightness: number;
  contrast: number;
  crop: number;
}
export interface PhotographyStandard {
  aspectRatio: import('./template').CaptureTemplate['aspectRatio'];
  coverage: number;
  centerX: number;
  centerY: number;
  groundY: number;
  minWidth: number;
  minHeight: number;
  centerTolerance: number;
  coverageTolerance: number;
  maxTilt: number;
  cameraHeightGuidance: string;
  lightingGuidance: string;
}
export interface CaptureMetadata {
  category: import('./template').ShotCategory;
  referenceAssetId?: string;
  referenceCalibration?: Record<string, unknown>;
  originalDimensions: { width: number; height: number };
  outputCrop: import('@/services/camera/geometry').Crop;
  orientation: number;
  camera?: { label?: string; facingMode?: string; width?: number; height?: number; zoom?: number };
  alignment?: {
    score: number;
    confidence: number;
    provider: string;
    centerDeviation: number;
    coverageDeviation: number;
    maskOverlap?: number;
  };
  exteriorViewingAngle?: number;
  exteriorTargetAngle?: number;
  interiorSceneId?: string;
  panelState?: {
    driverDoor?: 'open' | 'closed';
    hood?: 'open' | 'closed';
    trunk?: 'open' | 'closed';
    tailgate?: 'open' | 'closed';
  };
  hotspots?: { id: string; targetShotCodes: import('./template').ShotAngle[] }[];
}
