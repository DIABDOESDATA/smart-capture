"""Install the exact delivery APK, run real instrumentation, collect evidence before teardown.
No UI mocks and no physical-device claims. Android emulator must already be booted.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--apk',required=True)
p.add_argument('--test-apk',required=True)
p.add_argument('--output',default='native-test-evidence')
args=p.parse_args()
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
adb=shutil.which('adb') or str(Path(os.environ['ANDROID_HOME'])/'platform-tools'/('adb.exe' if os.name=='nt' else 'adb'))
def call(*parts,timeout=180):
    r=subprocess.run([adb,*parts],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout)
    if r.returncode: raise RuntimeError(r.stdout+r.stderr)
    return r.stdout
call('wait-for-device')
assert call('shell','getprop','ro.kernel.qemu').strip()=='1','This harness changes networking only on an Android emulator.'
for setting in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:
    call('shell','settings','put','global',setting,'0')
call('shell','input','keyevent','82')
call('shell','settings','put','secure','immersive_mode_confirmations','confirmed')
call('shell','cmd','connectivity','airplane-mode','enable')
call('shell','svc','wifi','disable')
call('install','-r',str(next(Path().glob(args.apk))))
call('install','-r',str(next(Path().glob(args.test_apk))))
call('shell','pm','grant','com.diabdoesdata.smartcapture.preview','android.permission.CAMERA')
try:
    result=call('shell','am','instrument','-w','-r','com.diabdoesdata.smartcapture.preview.test/androidx.test.runner.AndroidJUnitRunner',timeout=1800)
finally:
    call('shell','cmd','connectivity','airplane-mode','disable')
    call('shell','svc','wifi','enable')
(out/'instrumentation.log').write_text(result,encoding='utf-8')
subprocess.run([adb,'pull','/sdcard/Android/data/com.diabdoesdata.smartcapture.preview/files/test-evidence/.',str(out)],capture_output=True)
passed=re.search(r'OK \((\d+) tests?\)',result)
summary=dict(environment='Android API 35 x86_64 emulator; NOT physical hardware',network='Airplane mode with Wi-Fi disabled during instrumentation',passed=bool(passed),tests=int(passed.group(1)) if passed else None)
(out/'result.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary))
if not passed:
    print(result[-16000:]);raise SystemExit(1)
