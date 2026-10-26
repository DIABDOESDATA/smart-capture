import { PhotographyStandard } from '@/types/capture';
export const DEFAULT_STANDARD: PhotographyStandard = {
  aspectRatio: '4:3',
  coverage: 0.78,
  centerX: 0.5,
  centerY: 0.53,
  groundY: 0.78,
  minWidth: 1600,
  minHeight: 1200,
  centerTolerance: 0.06,
  coverageTolerance: 0.1,
  maxTilt: 3,
  cameraHeightGuidance:
    'Start near the headlight height; keep verticals upright. Use the approved reference perspective.',
  lightingGuidance:
    'Use even shade when possible. Avoid sun behind the vehicle and reflections that hide condition.',
};
