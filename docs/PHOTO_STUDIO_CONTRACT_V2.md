# Future Photo Studio contract — schema 2

`buildManifest` produces schemaVersion 2 / version 2.0. It includes dealership, vehicle ID/VIN/stock, session, immutable template/standard snapshots, ordered shot IDs/codes/categories, source provenance, hero, timestamp, retakes, captured quality, original dimensions, output crop/orientation, reference ID/calibration and exposed camera settings.

`exteriorTargetAngle` is a nominal checklist viewing direction (front 0, passenger 90, rear 180, driver 270). `exteriorViewingAngle` is reserved for an actual measured angle and is omitted today. No camera orbit position, depth or 3D pose is fabricated. Interior scene and open-door/hood/trunk/tailgate states describe the captured shot intent. Original pixels remain independent of adjusted derivatives; `edits` records rotation, straighten, centered crop, brightness and contrast. Quality remains capture-time quality.

Hotspot entries for driver door, dashboard, hood and trunk resolve only to shot IDs actually present in this session. Missing scenes do not produce dangling links. Future viewer code should validate dealership, vehicle and session IDs before associating media. Cloud tenancy and D Drive publishing are not enabled by this contract.

`orbitSequence.mode=checklist` and `suitableForSmooth360=false` are explicit. A future orbit mode needs its own denser sequence, consistent elevation and locked exposure, not interpolation claims from eight exterior images. Angular cadence, overlap and required counts must be chosen through viewer/reconstruction trials and stored with the sequence.

## Actual 3D strategy (future)

Prototype photogrammetry on licensed/dealership-owned capture sets. Reflective paint, windows, featureless panels, moving shadows and transparent surfaces cause correspondence/geometry failures; stationary lighting, high overlap, varied elevations and manual quality review will be necessary. Capture interiors and opened panels as separate scenes rather than assuming exterior photos reveal them.

Benchmark reconstruction completeness, texture fidelity, processing duration, GPU memory, storage and egress per vehicle before choosing a processor or promising costs. Compute cost is measured processing time times the selected provider's then-current rate, plus storage/egress and failure/retake overhead. No full 3D reconstruction, processing-cost claim or production integration is part of V2.
