import { ReferenceAsset } from './assets';
import { AspectRatio } from '@/services/camera/geometry';
import { PhotographyStandard } from '@/types/capture';
import { OverlaySettings } from '@/components/camera/overlays/OverlayControls';
export function referenceGeometry(
  asset: ReferenceAsset | null,
  ratio: AspectRatio,
  standard: PhotographyStandard,
  s: OverlaySettings
) {
  const [a, b] = ratio.split(':').map(Number),
    height = (1000 * b) / a;
  const sourceRatio = asset ? asset.rect[2] / asset.rect[3] : 1.6;
  const width = Math.min(standard.coverage * 1000, height * 0.62 * sourceRatio),
    h = width / sourceRatio;
  return {
    height,
    x: standard.centerX * 1000 - width / 2,
    y: standard.centerY * height - h / 2,
    width,
    h,
    target: {
      ...standard,
      centerX: 0.5 + (standard.centerX - 0.5) * s.scale + (s.x || 0),
      centerY: 0.5 + (standard.centerY - 0.5) * s.scale + (s.y || 0),
      coverage: (width / 1000) * s.scale,
    },
  };
}
