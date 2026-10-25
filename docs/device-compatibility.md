# Mobile Device Compatibility & Acceptance Matrix

## 1. Supported Platforms

Smart Capture is built to run on standard modern smartphones without requiring app store installation, while supporting home screen installation via Progressive Web App (PWA) standards.

| Operating System | Browser | Supported | Camera Mode | Sensor Support | Notes |
| --- | --- | --- | --- | --- | --- |
| **iOS 16+** | Safari (Mobile) | **Tier 1 (First Class)** | WebRTC MediaDevices | DeviceOrientation API | Requires HTTPS. Native full-screen support via PWA "Add to Home Screen". |
| **iOS 16+** | Chrome / Edge | **Tier 1** | WebRTC MediaDevices | Supported via WebKit | Operates on iOS WebKit engine. |
| **Android 11+** | Chrome (Mobile) | **Tier 1 (First Class)** | WebRTC MediaDevices | Full Gyro/Accel Sensors | Supports hardware torch toggle & optical zoom where permitted by OEM. |
| **Android 11+** | Samsung Internet | **Tier 1** | WebRTC MediaDevices | Full Sensors | Excellent performance on Galaxy devices. |
| **iPadOS 16+** | Safari (Tablet) | **Tier 1** | WebRTC MediaDevices | Supported | Optimized responsive tablet layout for managers reviewing on lot. |
| **macOS / Windows** | Chrome / Safari / Edge | **Tier 2 (Admin & Demo)** | WebRTC or Mock Mode | Simulated Orientation | Desktop mode optimized for gallery review, template editing, and bulk ZIP export. |

## 2. Hardware Capability Handling & Fallbacks

- **Camera Permissions Denied**: The app informs the user clearly and provides an interactive simulator preview mode so workflow testing is never blocked.
- **Hardware Torch / Flash**: Checked dynamically via `track.getCapabilities()`. The torch button is gracefully hidden if the device camera does not support software torch control.
- **Motion Sensors Restricted**: If iOS `DeviceOrientationEvent.requestPermission()` is denied or motion sensors are disabled, core photography and outline framing remain 100% operational with a static horizon reticle.
- **Background Execution Constraints**: iOS Safari suspends background execution when tabs are switched. The upload engine alerts users when photos are pending upload and advises keeping the app in the foreground until the sync counter reaches zero.

## 3. Physical Acceptance Testing Checklist

When testing on physical mobile hardware on the dealership lot:
- [ ] Camera opens immediately in rear-facing environment mode.
- [ ] Screen stays awake during active photo session (WakeLock API where available).
- [ ] Outline silhouette is clearly visible under direct sunlight (test Cyan and Amber color presets).
- [ ] Horizon line rotates smoothly as device tilts and flashes green within +/- 2.5 degrees.
- [ ] Shutter button has immediate visual feedback (<50ms).
- [ ] Quality review banner appears if camera was jerked during shutter press (blur detection).
- [ ] Disconnecting Wi-Fi / cellular data preserves all captured shots in IndexedDB.
- [ ] Reconnecting syncs pending queue without photo loss or duplicate uploads.
- [ ] Downloading ordered ZIP on iOS saves cleanly to Files app.
