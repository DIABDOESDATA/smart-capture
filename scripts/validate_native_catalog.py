"""Dependency-free CI gate: every supported body/shot needs a real, intact PNG crop."""
import hashlib
import json
import struct
from pathlib import Path

root=Path(__file__).resolve().parents[1]/'shared'
catalog=json.loads((root/'catalog.v3.json').read_text())
assert len(catalog['shots'])==34
codes=[s['code'] for s in catalog['shots']]
assert len(codes)==len(set(codes))
for name,asset in catalog['assets'].items():
    data=(root/asset['path']).read_bytes()
    assert data[:8]==b'\x89PNG\r\n\x1a\n',name
    assert hashlib.sha256(data).hexdigest()==asset['sha256'],name
    assert struct.unpack('>II',data[16:24])==(asset['width'],asset['height']),name
    assert asset['provenance'] and asset['license'] and (root/asset['generation']).exists()
for shot in catalog['shots']:
    for body,ref in shot['references'].items():
        a=catalog['assets'][ref['asset']];x,y,w,h=ref['rect']
        assert ref['status']=='complete' and w>=150 and h>=150,(shot['code'],body)
        assert x>=0 and y>=0 and x+w<=a['width'] and y+h<=a['height'],(shot['code'],body)
        assert ref['preview']['path']==a['path']
    assert all(b in shot['references'] for b in shot['applicableBodies'])
model=json.loads((root/'models/NOTICE.json').read_text())
assert hashlib.sha256((root/'models/vehicle-detection.tflite').read_bytes()).hexdigest()==model['sha256']
print(f"PASS: {len(codes)} shot types, {len(catalog['assets'])} photographic atlases, 272 checked crops, bundled model hash")
