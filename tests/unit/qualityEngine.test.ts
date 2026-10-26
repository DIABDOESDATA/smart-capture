import { describe, it, expect } from 'vitest';
import { analyzeImageQuality } from '@/services/camera/qualityEngine';

describe('Real-Time Photo Quality Engine', () => {
  it('correctly assesses level horizon within +/- 2.5 degrees', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;

    const levelResult = analyzeImageQuality(canvas, 1.2);
    expect(levelResult.isLevel).toBe(true);

    const tiltedResult = analyzeImageQuality(canvas, 6.5);
    expect(tiltedResult.isLevel).toBe(false);
    expect(tiltedResult.warnings.some((w) => w.includes('Align with horizon guide'))).toBe(true);
  });

  it('flags image resolution below required minimum', () => {
    const lowResCanvas = document.createElement('canvas');
    lowResCanvas.width = 640;
    lowResCanvas.height = 480;

    const result = analyzeImageQuality(lowResCanvas, 0, { minWidth: 1280, minHeight: 720 });
    expect(
      result.warnings.some((w) => w.includes('resolution (640x480) is lower than standard'))
    ).toBe(true);
  });

  it('detects underexposure when scene is dominated by dark pixels', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Paint dark black scene
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, 256, 256);
    }

    const result = analyzeImageQuality(canvas, 0);
    expect(result.exposure).toBe('underexposed');
    expect(result.warnings.some((w) => w.includes('underexposed'))).toBe(true);
  });

  it('detects overexposure when scene is blown out white', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Paint blown white scene
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, 256, 256);
    }

    const result = analyzeImageQuality(canvas, 0);
    expect(result.exposure).toBe('overexposed');
    expect(result.warnings.some((w) => w.includes('overexposed'))).toBe(true);
  });
});
