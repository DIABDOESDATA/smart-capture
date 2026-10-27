# Added third-party notices — Smart Capture

This file does not license Smart Capture itself. The owner's existing LICENSE.md remains unchanged.

- ZXing browser layer: MIT, Copyright 2018 ZXing for JS; `public/notices/zxing-browser-LICENSE.txt`.
- ZXing JavaScript decoding library: Apache-2.0; `public/notices/zxing-library-LICENSE.txt`, including upstream notices contained in that license distribution.
- TensorFlow.js runtime/model wrapper and vendored COCO SSD Lite MobileNet v2 model: Apache-2.0 TensorFlow/Google project; `public/notices/tensorflow-js-LICENSE.txt` and `tensorflow-models-LICENSE.txt`. Runtime source notices are preserved by the bundler. Weights originate from `https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/` via the upstream COCO SSD loader. No ONNX/YOLO weights are bundled.
- fake-indexeddb is a development-only Apache-2.0 test dependency. Existing dependencies retain their respective upstream terms and are pinned by package-lock.json.
- Vehicle reference packs: original built-in image_gen outputs, copied into this repository with generation prompts/provenance in `public/references/provenance.json`. Generic generated framing examples; no scraped or hotlinked manufacturer image assets. They are not real dealership inventory photos. Dealer uploads must be owned or appropriately licensed by the dealer.

## Development accessibility tests

@axe-core/playwright 4.14.0 and its axe-core dependency are development-only automated accessibility tools (MPL-2.0), not part of the shipped runtime. Upstream: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright .

## Native Android V3

- EfficientDet-Lite0 TensorFlow model: Apache-2.0; source, SHA-256 and model card in `shared/models/NOTICE.json`, full license in `shared/models/LICENSE.efficientdet.txt`. LiteRT runtime retains its upstream notices and is pinned in the Android Gradle build.
- AndroidX/Compose/CameraX/Room/ExifInterface, Kotlin, Coil and ML Kit retain their respective upstream terms; dependency coordinates are pinned in `android/app/build.gradle.kts`. ML Kit's bundled barcode library is used for VIN labels, without a model download during capture.
- Five additional original image_gen photographic atlases cover scene-specific interiors and mechanical/detail views. Tool mode, full prompts, source paths, usage/provenance and hashes are recorded in `shared/references/generation-prompts.json` and `shared/catalog.v3.json`. The eight V2 original atlases retain their original provenance. These are generic composition examples, not actual inventory or exact manufacturer geometry. No stock photos were scraped or hotlinked.
