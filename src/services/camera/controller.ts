export interface RangeCapability {
  min: number;
  max: number;
  step: number;
}
export type CameraCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  zoom?: RangeCapability;
  exposureCompensation?: RangeCapability;
  focusMode?: string[];
  pointsOfInterest?: unknown;
};
export class CameraController {
  private generation = 0;
  stream: MediaStream | null = null;
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
  async start(deviceId?: string, facingMode = 'environment') {
    this.stop();
    const generation = this.generation;
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error('Camera requires HTTPS and a supported browser. Use sample mode to explore.');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: facingMode } }),
        width: { ideal: 3840 },
        height: { ideal: 2880 },
      },
    });
    if (generation !== this.generation) {
      stream.getTracks().forEach((t) => t.stop());
      return null;
    }
    this.stream = stream;
    return stream;
  }
  get track() {
    return this.stream?.getVideoTracks()[0];
  }
  get capabilities(): CameraCapabilities {
    return this.track?.getCapabilities?.() || {};
  }
  async constrain(values: Record<string, unknown>) {
    if (!this.track) throw new Error('Camera is not active.');
    await this.track.applyConstraints({ advanced: [values as MediaTrackConstraintSet] });
  }
}
