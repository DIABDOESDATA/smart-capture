# Added third-party notices — Smart Capture V2

This file does not license Smart Capture itself. The owner's existing LICENSE.md remains unchanged.

- ZXing browser layer: MIT, Copyright 2018 ZXing for JS; `public/notices/zxing-browser-LICENSE.txt`.
- ZXing JavaScript decoding library: Apache-2.0; `public/notices/zxing-library-LICENSE.txt`, including upstream notices contained in that license distribution.
- TensorFlow.js runtime/model wrapper and vendored COCO SSD Lite MobileNet v2 model: Apache-2.0 TensorFlow/Google project; `public/notices/tensorflow-js-LICENSE.txt` and `tensorflow-models-LICENSE.txt`. Runtime source notices are preserved by the bundler. Weights originate from `https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/` via the upstream COCO SSD loader. No ONNX/YOLO weights are bundled.
- fake-indexeddb is a development-only Apache-2.0 test dependency. Existing dependencies retain their respective upstream terms and are pinned by package-lock.json.
- Vehicle reference packs: original built-in image_gen outputs, copied into this repository with generation prompts/provenance in `public/references/provenance.json`. Generic generated framing examples; no scraped or hotlinked manufacturer image assets. They are not real dealership inventory photos. Dealer uploads must be owned or appropriately licensed by the dealer.

## Development accessibility tests

@axe-core/playwright 4.14.0 and its axe-core dependency are development-only automated accessibility tools (MPL-2.0), not part of the shipped runtime. Upstream: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright .
