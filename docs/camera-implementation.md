# Guided Camera Implementation & Mobile WebRTC

## 1. WebRTC Camera Initialization

Smart Capture interacts directly with standard HTML5 MediaDevices APIs to initialize the device's rear-facing camera sensor:

```typescript
const constraints: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 2560 }, // Request high-resolution sensor feed
    height: { ideal: 1440 },
  },
  audio: false,
};
const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

### Key Implementation Details:
- **Environment Preference**: Mobile devices default to `facingMode: { ideal: 'environment' }` so the lot employee immediately sees the car rather than the selfie camera.
- **Dynamic Camera Switching**: The HUD provides a quick camera switch action (`user` vs `environment`) for vehicles where interior self-facing documentation is needed.
- **Hardware Torch / Flash**: We detect track capabilities via `track.getCapabilities()` and toggle `track.applyConstraints({ advanced: [{ torch: boolean }] })` for shaded engine bays or dark trunks.
- **Simulator Fallback**: If permissions are denied, running in headless CI, or executed on a desktop without webcam, the engine gracefully transitions to an interactive canvas simulation rather than crashing.

## 2. High-Resolution Photo Capture vs Screenshot

A common flaw in rudimentary web camera implementations is capturing low-resolution screenshots of the CSS-scaled preview element. Smart Capture captures the uncompressed native resolution buffer from the underlying `HTMLVideoElement.videoWidth` and `videoHeight` into a full-sized offscreen canvas:

```typescript
const canvas = document.createElement('canvas');
canvas.width = videoRef.current.videoWidth;
canvas.height = videoRef.current.videoHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
const highQualityJpeg = canvas.toDataURL('image/jpeg', 0.92);
```

The guided vector silhouette overlay is rendered as an HTML/SVG HUD layer above the video preview—it is **never burned into the exported photograph**.

## 3. Real-Time Horizon & Orientation Sensors

Car lot photos often look sloppy because employees hold phones tilted at 5-15 degree angles. Smart Capture reads the device's orientation sensor via the standard `DeviceOrientationEvent`:

```typescript
const handleOrientation = (e: DeviceOrientationEvent) => {
  if (e.gamma !== null) {
    setTiltDegrees(e.gamma);
  }
};
window.addEventListener('deviceorientation', handleOrientation);
```

The HUD displays a dynamic horizon level line:
- Rotates with device tilt.
- Turns bright neon green (`#22C55E`) and displays a "LEVEL" indicator when level within `+/- 2.5 degrees`.
- Issues a quality advisory if captured beyond 4.0 degrees of tilt.
