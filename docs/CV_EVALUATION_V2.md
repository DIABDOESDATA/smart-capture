# Optional detector evaluation

The selected experiment is [TensorFlow.js COCO SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd), lite MobileNet v2, from the Apache-2.0 TensorFlow model project. Weights are vendored under `public/models/vehicle`; runtime dependencies are pinned and dynamically imported only on opt-in. No inference images leave the browser. Models and lazy chunks are cached after use, not required for manual capture.

| Candidate | Evaluation | Decision |
|---|---|---|
| COCO SSD Lite MobileNet v2 / TFJS | Documented boxes for car/truck/bus; tested on generated sedan/SUV/pickup examples; no masks | Implemented as experimental opt-in |
| ONNX Runtime Web + suitable permissive detector | [Runtime supports WASM and GPU providers](https://onnxruntime.ai/docs/get-started/with-javascript/web.html); model preprocessing/output/license must be evaluated separately | Replaceable future provider; not benchmarked, no performance claim |
| Segmentation providers | Need a small vehicle-capable model, commercial weight license, mask-quality validation and mobile benchmarks | Planned; no mask-overlap values fabricated |

## Actual desktop smoke benchmark

See `evidence/detector-benchmark.json` for raw results and user agent. Local desktop Chromium, software WebGL, 320x240 generated vehicle fixtures, 5 repeats per category plus blank. Load 4363.6 ms; 16 inference observations about 231.7–380.8 ms, mean about 272.2 ms (~3.7 pure inferences/s). Runtime tensor allocation reported 18,034,528 bytes; this excludes browser heap, decoded images and GPU overhead. On-disk model JSON plus five shards is 18,561,843 bytes. These are measured smoke numbers, not phone latency or accuracy estimates. Blank scene returned no vehicle. Repeated identical generated images do not establish precision/recall or real-lot robustness.

Reproduce with `npm run dev` and `npm run benchmark:detector`. The app samples at 320px with at least 600ms between completed detections, keeping camera rendering independent. It does not run inference on every video frame.

At confidence below 0.65, multiple high-confidence vehicles, load failure or inference error, guidance falls back to manual. Available scores penalize normalized center, coverage, margins and sensor roll when available. They are heuristic framing measures, not percentages of professional correctness. No actual distance, view angle, depth, exact camera height or mask is reported. Mask overlap and image-horizon detection remain optional provider capabilities, unimplemented.

## Not measured yet

Android Chrome/iOS Safari cold/warm load over real connectivity, total memory/thermal load, WebGL/CPU throughput and failure rates, overnight offline model recovery, precision/recall on licensed real vehicle photos, and segmentation quality. Record all as pending in field acceptance; do not enable CV by default until demonstrated useful on the pilot phones.
