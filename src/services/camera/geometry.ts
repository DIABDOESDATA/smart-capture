import { CaptureTemplate } from '@/types/template';
export type AspectRatio = CaptureTemplate['aspectRatio'];
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function coverCrop(width: number, height: number, ratio: AspectRatio): Crop {
  if (width <= 0 || height <= 0) throw new Error('Camera has no image yet.');
  const [a, b] = ratio.split(':').map(Number);
  const target = a / b;
  const w = Math.min(width, height * target),
    h = w / target;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
export function captureFrame(
  source: CanvasImageSource,
  width: number,
  height: number,
  ratio: AspectRatio
) {
  const crop = coverCrop(width, height, ratio);
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(crop.width);
  canvas.height = Math.floor(crop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image canvas is unavailable.');
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return { canvas, crop };
}
export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Photo encoding failed.'))),
      'image/jpeg',
      0.95
    )
  );
}
// Gravity projected onto screen axes. Portrait uses gamma; landscape uses beta.
export function screenRoll(
  beta: number | null,
  gamma: number | null,
  angle: number
): number | null {
  if (beta === null || gamma === null) return null;
  const b = (beta * Math.PI) / 180,
    g = (gamma * Math.PI) / 180,
    a = (angle * Math.PI) / 180;
  const x = Math.sin(g) * Math.cos(b),
    y = Math.sin(b);
  const sx = x * Math.cos(a) + y * Math.sin(a),
    sy = -x * Math.sin(a) + y * Math.cos(a);
  if (Math.hypot(sx, sy) < 0.15) return null; // flat phone has no reliable horizon
  let roll = (Math.atan2(sx, Math.abs(sy)) * 180) / Math.PI;
  if (roll > 90) roll -= 180;
  if (roll < -90) roll += 180;
  return roll;
}
