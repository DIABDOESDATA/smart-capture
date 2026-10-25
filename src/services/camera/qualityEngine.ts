import { ExposureAssessment, QualityMetric } from '@/types/capture';

export interface QualityCheckOptions {
  minWidth?: number;
  minHeight?: number;
  blurThreshold?: number; // Variance of Laplacian threshold (default 85)
  underexposedRatioThreshold?: number; // > 35% pixels near black
  overexposedRatioThreshold?: number; // > 35% pixels near blown white
}

/**
 * Analyzes an HTMLCanvasElement or ImageData for blur, exposure, and framing resolution.
 */
export function analyzeImageQuality(
  canvas: HTMLCanvasElement,
  currentTiltDegrees: number = 0,
  options: QualityCheckOptions = {}
): QualityMetric {
  const {
    minWidth = 1280,
    minHeight = 720,
    blurThreshold = 85,
    underexposedRatioThreshold = 0.35,
    overexposedRatioThreshold = 0.35,
  } = options;

  const width = canvas.width;
  const height = canvas.height;
  const warnings: string[] = [];

  // 1. Resolution Check
  if (width < minWidth || height < minHeight) {
    warnings.push(
      `Image resolution (${width}x${height}) is lower than standard (${minWidth}x${minHeight})`
    );
  }

  // 2. Tilt / Horizon Check
  const isLevel = Math.abs(currentTiltDegrees) <= 2.5;
  if (!isLevel && Math.abs(currentTiltDegrees) > 4.0) {
    warnings.push(`Camera tilted by ${Math.round(currentTiltDegrees)}°. Align with horizon guide.`);
  }

  // 3. Sample canvas for fast pixel analysis
  // To keep mobile performance instant (<25ms), downscale to a 256x256 analysis buffer
  const sampleSize = 256;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      blurScore: 100,
      isBlurry: false,
      exposure: 'normal',
      meanLuminance: 128,
      tiltDegrees: Math.round(currentTiltDegrees * 10) / 10,
      isLevel,
      width,
      height,
      warnings,
    };
  }

  ctx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imgData.data;
  const totalPixels = sampleSize * sampleSize;

  // Convert to grayscale & compute histogram
  const gray = new Float32Array(totalPixels);
  let totalLuminance = 0;
  let shadowCount = 0; // < 15
  let highlightCount = 0; // > 240

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Standard ITU-R BT.601 luma weights
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = lum;
    totalLuminance += lum;

    if (lum < 15) shadowCount++;
    if (lum > 240) highlightCount++;
  }

  const meanLuminance = totalLuminance / totalPixels;
  let exposure: ExposureAssessment = 'normal';

  const shadowRatio = shadowCount / totalPixels;
  const highlightRatio = highlightCount / totalPixels;

  if (shadowRatio > underexposedRatioThreshold || meanLuminance < 40) {
    exposure = 'underexposed';
    warnings.push('Image appears underexposed (dark scene or shadowed car lot)');
  } else if (highlightRatio > overexposedRatioThreshold || meanLuminance > 220) {
    exposure = 'overexposed';
    warnings.push('Image appears overexposed (harsh direct sunlight or headlight glare)');
  }

  // 3. Fast Laplacian Variance for Blur Detection
  // 3x3 Discrete Laplacian Kernel:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let sampleCount = 0;

  for (let y = 1; y < sampleSize - 1; y++) {
    const rowOffset = y * sampleSize;
    for (let x = 1; x < sampleSize - 1; x++) {
      const idx = rowOffset + x;
      const lap =
        gray[idx - sampleSize] +
        gray[idx + sampleSize] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];

      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      sampleCount++;
    }
  }

  const meanLap = laplacianSum / sampleCount;
  const varianceLap = laplacianSumSq / sampleCount - meanLap * meanLap;
  const blurScore = Math.max(0, Math.round(varianceLap * 10) / 10);
  const isBlurry = blurScore < blurThreshold;

  if (isBlurry) {
    warnings.push(
      `Blur detected (sharpness score ${blurScore} < ${blurThreshold}). Hold camera steady.`
    );
  }

  return {
    blurScore,
    isBlurry,
    exposure,
    meanLuminance: Math.round(meanLuminance),
    tiltDegrees: Math.round(currentTiltDegrees * 10) / 10,
    isLevel,
    width,
    height,
    warnings,
  };
}
