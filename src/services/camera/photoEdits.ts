import { PhotoEdits } from '@/types/capture';
import { canvasBlob } from './geometry';
export const DEFAULT_EDITS: PhotoEdits = {
  rotate: 0,
  straighten: 0,
  brightness: 1,
  contrast: 1,
  crop: 0,
};
export function editGeometry(width: number, height: number, e: PhotoEdits) {
  const quarter = Math.abs(e.rotate % 180) === 90,
    w = quarter ? height : width,
    h = quarter ? width : height,
    a = Math.abs((e.straighten * Math.PI) / 180);
  const safe = Math.min(
    1 - e.crop,
    1 / (Math.cos(a) + (Math.sin(a) * w) / h),
    1 / (Math.cos(a) + (Math.sin(a) * h) / w)
  );
  return { width: Math.max(1, Math.floor(w * safe)), height: Math.max(1, Math.floor(h * safe)) };
}
export async function renderEdits(blob: Blob, e: PhotoEdits) {
  const u = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = u;
    await img.decode();
    const size = editGeometry(img.naturalWidth, img.naturalHeight, e),
      c = document.createElement('canvas');
    c.width = size.width;
    c.height = size.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Photo editing unavailable.');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(((e.rotate + e.straighten) * Math.PI) / 180);
    ctx.filter = `brightness(${e.brightness}) contrast(${e.contrast})`;
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvasBlob(c);
  } finally {
    URL.revokeObjectURL(u);
  }
}
