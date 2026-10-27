"""Build the shared catalog from stable V2 shot identifiers and curated photographs.
Reads image dimensions only; does not alter generated photographic assets.
"""
import hashlib
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / 'shared'
source = (ROOT / 'src/services/templates/defaultTemplates.ts').read_text(encoding='utf-8')
source = source[:source.index('export const DEFAULT_TEMPLATES')] if 'export const DEFAULT_TEMPLATES' in source else source
source += (ROOT / 'src/services/templates/additionalShots.ts').read_text(encoding='utf-8')
shots = []
for code, name, category, guidance in re.findall(r"code: '([^']+)',\s+name: '([^']+)',\s+category: '([^']+)',.*?guidanceText:\s*'([^']+)'", source, re.S):
    if code not in [s['code'] for s in shots]:
        shots.append(dict(code=code, name=name.replace(' (Hero)', ''), category=category, instruction=guidance))
for code, name, category, instruction in [
    ('DRIVER_SEAT', 'Driver seat', 'interior', 'Open the driver door. Include the complete cushion, backrest and controls.'),
    ('INFOTAINMENT_SCREEN', 'Infotainment display', 'interior', 'Keep the complete display readable and reduce reflections.'),
    ('TRUCK_BED', 'Truck bed', 'additional', 'Lower the tailgate. Include the full bed, liner and wheel wells.'),
]:
    shots.append(dict(code=code, name=name, category=category, instruction=instruction))

asset_source = (ROOT / 'src/services/references/assets.ts').read_text(encoding='utf-8')
window_source = asset_source[asset_source.index('const windows:'):asset_source.index('export function referenceAsset')]
windows = {}
for pack, values in re.findall(r'  (\w+): \[\n(.*?)\n  \],', window_source, re.S):
    windows[pack] = [list(map(int, re.findall(r'\d+', row))) for row in re.findall(r'\[([^\]]+)\]', values)]
exterior = dict(FRONT_3Q_DRIVER=(0,False), STRAIGHT_FRONT=(1,False), FRONT_3Q_PASSENGER=(0,True), PASSENGER_SIDE=(2,True), REAR_3Q_PASSENGER=(3,True), STRAIGHT_REAR=(4,False), REAR_3Q_DRIVER=(3,False), DRIVER_SIDE=(2,False))
interiors = dict(DRIVER_COCKPIT=0, STEERING_DASHBOARD=1, STEERING_WHEEL=2, INSTRUMENT_CLUSTER=3, DRIVER_SEAT=4, FRONT_SEATS=5, REAR_SEATS=6, CENTER_CONSOLE=7, INFOTAINMENT_SCREEN=8, DOOR_TRIM=9, ROOF_SUNROOF=10, INFOTAINMENT_CONSOLE=11)
details = dict(ENGINE_BAY=3, HOOD_OPEN=4, VIN_DOOR_JAMB=5, KEYS_ACCESSORIES=6, CONDITION_DOCUMENTATION=7, WHEEL_FRONT_DRIVER=8, WHEEL_REAR_PASSENGER=9, GRILLE_HEADLIGHT_DETAIL=10, REAR_BADGE_TAILLIGHT=11, TRUCK_BED=2)
assets = {}
for path in sorted((SHARED/'references').glob('*.png')):
    with Image.open(path) as im:
        w,h = im.size
    assets[path.name] = dict(path=f'references/{path.name}', width=w,height=h,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),provenance='Original AI-generated photographic composition example; not a customer inventory photo.',license='Project-owned generated asset; no third-party stock license claimed. Subject to LICENSE.md.',generation='references/generation-prompts.json' if path.name.startswith('interior-') or path.stem in ['details','extras'] else 'references/v2-provenance.json')

def cell(file, index, cols=3, rows=4):
    a=assets[file]; w=a['width'];h=a['height']
    # Exclude contact-sheet seams. Full source photographs are retained unchanged.
    x=round(index%cols*w/cols)+5;y=round(index//cols*h/rows)+5
    right=round((index%cols+1)*w/cols)-5;bottom=round((index//cols+1)*h/rows)-5
    return dict(asset=file, rect=[x,y,right-x,bottom-y],mirror=False)

angles=[315,0,45,90,135,180,225,270]
for s in shots:
    code=s['code']; refs={}
    for body in windows:
        if code in exterior:
            idx,mirror=exterior[code]; ref=dict(asset=f'{body}.png',rect=windows[body][idx],mirror=mirror)
        elif code in interiors:
            family=body if body in ['suv','truck'] else 'suv' if body=='van' else 'sedan'
            idx=interiors[code]
            ref=cell(f'interior-{family}.png',idx)
            if code=='FRONT_SEATS' and family=='sedan': ref=cell('extras.png',2,2,2)
            if code=='INFOTAINMENT_CONSOLE' and family=='suv': ref=cell('interior-sedan.png',11)
        elif code=='TRUNK_CARGO': ref=cell('details.png',2 if body=='truck' else 1 if body in ['suv','van','wagon'] else 0)
        elif code=='THIRD_ROW': ref=cell('extras.png',1,2,2)
        elif code=='CONVERTIBLE_ROOF_UP': ref=cell('extras.png',0,2,2)
        elif code=='ADDITIONAL_FREE': ref=cell('extras.png',3,2,2)
        else: ref=cell('details.png',details[code])
        ref.update(type='photographic-cutout' if code in exterior else 'photographic-scene-example',status='complete', preview=dict(path=assets[ref['asset']]['path'],rect=ref['rect']),anchors=[[.1,.1],[.9,.9]],cropMode='fit',mask='source-alpha' if code in exterior else 'rectangle',calibration=dict(opacity=.32,scale=1,offsetX=0,offsetY=0))
        refs[body]=ref
    s['references']=refs
    s['detectorEligible']=code in exterior
    s['nominalAzimuthDegrees']=angles[list(exterior).index(code)] if code in exterior else None
    s['panelState']='hood-open' if code in ['ENGINE_BAY','HOOD_OPEN'] else 'cargo-open' if code in ['TRUNK_CARGO','TRUCK_BED'] else 'driver-door-open' if code in ['DRIVER_COCKPIT','DRIVER_SEAT','VIN_DOOR_JAMB'] else 'as-fitted'
    s['applicableBodies']=['suv','van'] if code=='THIRD_ROW' else ['truck'] if code=='TRUCK_BED' else ['convertible'] if code=='CONVERTIBLE_ROOF_UP' else list(windows)

assert len(shots)==34, len(shots)
catalog=dict(schemaVersion=3,revision='2026-10-27.1',description='Photographic examples indicate composition, not exact make/model geometry. Applicability depends on fitted equipment.',assets=assets,shots=shots)
(SHARED/'catalog.v3.json').write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8')
print(f'Built {len(shots)} shots, {len(assets)} original atlases, {sum(len(s["references"]) for s in shots)} body/shot references')
