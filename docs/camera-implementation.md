# Camera engine V2

Preview and capture use one center-cover transform in `services/camera/geometry.ts`. The viewfinder itself has the selected output ratio, video uses object-cover within that frame, and capture draws the same source rectangle to a canvas with no upscaling. Overlay rendering uses normalized frame coordinates and the same reference target bounds used by CV. References never enter the real-photo canvas.

Rear-camera constraints request up to 3840x2880 but actual track/video dimensions determine output. This is a video-frame capture path. [W3C Image Capture](https://www.w3.org/TR/image-capture/) specifies still capture APIs, but sensor/FOV differences and platform availability require physical calibration before adding a separate still path. No exact physical distance or optical focal length is inferred.

CameraController cancels late streams and stops replaced streams. Visibility changes stop background camera work and restart on return. Interrupted tracks expose recovery. Permissions fail to a retry screen; capture is disabled until a real frame exists or sample mode is chosen explicitly. Sample media is watermarked and source-tagged.

Device list, zoom, exposure, torch and touch-focus controls are exposed only when browser track capabilities support them. Touch points transform back through the crop to source-frame coordinates. Hardware behavior is pending physical mobile tests. Requested camera IDs represent browser-exposed devices, not a guarantee of optical lens labels.

Horizon uses gravity projection from orientation readings and screen rotation. Unknown, flat, stale and rotated-without-new-data states are null; no false LEVEL default. iOS motion permission is user-triggered. The sensor value is a device-roll estimate, not a detected image horizon.

Shutter/keep calls serialize and await atomic IndexedDB commit. Failure retains review and the same shot. JPEG encoding uses 0.95 quality. Sharpness/exposure are heuristics sampled at 256x256, not a field-validated quality guarantee. Missing analysis or orientation remains unavailable in metadata.
