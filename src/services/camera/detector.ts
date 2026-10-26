import { PhotographyStandard } from '@/types/capture';
export interface VehicleDetection {
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
  label: string;
  mask?: Uint8Array;
  maskWidth?: number;
  maskHeight?: number;
}
export interface Detector {
  id: string;
  load(): Promise<void>;
  detect(frame: HTMLCanvasElement): Promise<VehicleDetection | null>;
  dispose(): void;
}
export interface DetectorBenchmark {
  loadMs: number;
  inferenceMs: number[];
  tensorBytes?: number;
  backend?: string;
}
export class CocoVehicleDetector implements Detector {
  id = 'coco-ssd-lite-mobilenet-v2';
  private model: import('@tensorflow-models/coco-ssd').ObjectDetection | null = null;
  private disposed = false;
  benchmark: DetectorBenchmark = { loadMs: 0, inferenceMs: [] };
  async load() {
    const start = performance.now();
    const tf = await import('@tensorflow/tfjs-core');
    await import('@tensorflow/tfjs-backend-webgl');
    await import('@tensorflow/tfjs-backend-cpu');
    try {
      if (!(await tf.setBackend('webgl'))) await tf.setBackend('cpu');
    } catch {
      await tf.setBackend('cpu');
    }
    await tf.ready();
    const coco = await import('@tensorflow-models/coco-ssd');
    const model = await coco.load({
      base: 'lite_mobilenet_v2',
      modelUrl: `${import.meta.env.BASE_URL}models/vehicle/model.json`,
    });
    if (this.disposed) {
      model.dispose();
      throw new Error('Detector was closed during loading.');
    }
    this.model = model;
    this.benchmark.loadMs = performance.now() - start;
    this.benchmark.tensorBytes = tf.memory().numBytes;
    this.benchmark.backend = tf.getBackend();
  }
  async detect(frame: HTMLCanvasElement) {
    if (!this.model) throw new Error('Detector is not loaded.');
    const start = performance.now();
    const predictions = await this.model.detect(frame, 10, 0.35);
    this.benchmark.inferenceMs.push(performance.now() - start);
    if (this.benchmark.inferenceMs.length > 60) this.benchmark.inferenceMs.shift();
    const vehicles = predictions
      .filter((p) => ['car', 'truck', 'bus'].includes(p.class))
      .sort((a, b) => b.score - a.score);
    // Ambiguous multi-vehicle scenes must never produce confident guidance.
    if (!vehicles.length || (vehicles[1] && vehicles[1].score > 0.65)) return null;
    const p = vehicles[0];
    return {
      box: {
        x: p.bbox[0] / frame.width,
        y: p.bbox[1] / frame.height,
        width: p.bbox[2] / frame.width,
        height: p.bbox[3] / frame.height,
      },
      confidence: p.score,
      label: p.class,
    };
  }
  dispose() {
    this.disposed = true;
    this.model?.dispose();
    this.model = null;
  }
}
export function alignment(d: VehicleDetection | null, s: PhotographyStandard, tilt: number | null) {
  if (!d || d.confidence < 0.65)
    return {
      available: false as const,
      guidance: 'Detection uncertain — align manually',
      score: undefined,
    };
  const b = d.box,
    dx = b.x + b.width / 2 - s.centerX,
    dy = b.y + b.height / 2 - s.centerY,
    coverage = b.width - s.coverage;
  const centerDeviation = Math.hypot(dx, dy),
    coverageDeviation = Math.abs(coverage);
  const margins = Math.min(b.x, b.y, 1 - b.x - b.width, 1 - b.y - b.height);
  const positionPenalty = Math.min(1, centerDeviation / 0.2),
    sizePenalty = Math.min(1, coverageDeviation / 0.25),
    marginPenalty = margins < 0.025 ? 1 : 0;
  const horizonPenalty = tilt === null ? 0 : Math.min(1, Math.abs(tilt) / 12);
  const score = Math.round(
    100 *
      Math.max(
        0,
        1 -
          positionPenalty * 0.45 -
          sizePenalty * 0.35 -
          marginPenalty * 0.15 -
          horizonPenalty * 0.05
      )
  );
  let guidance = 'Vehicle is aligned within framing tolerance';
  if (margins < 0.025) guidance = 'Leave more space around the vehicle';
  else if (Math.abs(dx) > s.centerTolerance)
    guidance =
      dx > 0
        ? 'Pan slightly right to center the vehicle'
        : 'Pan slightly left to center the vehicle';
  else if (Math.abs(dy) > s.centerTolerance)
    guidance = dy > 0 ? 'Aim slightly lower' : 'Aim slightly higher';
  else if (coverage < -s.coverageTolerance) guidance = 'Move a little closer';
  else if (coverage > s.coverageTolerance) guidance = 'Move back a little';
  else if (tilt !== null && Math.abs(tilt) > s.maxTilt) guidance = 'Hold the phone level';
  return {
    available: true as const,
    guidance,
    score,
    confidence: d.confidence,
    centerDeviation,
    coverageDeviation,
  };
}
