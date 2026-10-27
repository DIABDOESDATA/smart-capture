"""Exercise real permission/startup/fold paths on a disposable Android emulator only."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--serial', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--apk', required=True)
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
adb = shutil.which('adb') or str(Path(os.environ['ANDROID_HOME']) / 'platform-tools' / ('adb.exe' if os.name == 'nt' else 'adb'))
package = 'com.diabdoesdata.smartcapture.preview'
activity = package + '/com.diabdoesdata.smartcapture.MainActivity'


def call(*parts, timeout=90):
    result = subprocess.run([adb, '-s', args.serial, *parts], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=timeout)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout


def tree():
    call('shell', 'uiautomator', 'dump', '/sdcard/sc-startup.xml')
    return ET.fromstring(call('shell', 'cat', '/sdcard/sc-startup.xml'))


def find(predicate, timeout=35):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for node in tree().iter('node'):
            if predicate(node):
                return node
        time.sleep(.25)
    raise AssertionError('Expected startup UI missing; see hierarchy and logcat')


def click(node):
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds')))
    call('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))


def screen(name):
    call('shell', 'screencap', '-p', '/sdcard/sc-startup.png')
    call('pull', '/sdcard/sc-startup.png', str(out / (name + '.png')))
    (out / (name + '.xml')).write_text(ET.tostring(tree(), encoding='unicode'), encoding='utf-8')


assert call('shell', 'getprop', 'ro.kernel.qemu').strip() == '1', 'Never run this permission-changing harness on a physical phone.'
assert args.serial.startswith('emulator-'), 'Select an explicit emulator serial.'
original_size = call('shell', 'wm', 'size')
override = re.search(r'Override size: (\d+x\d+)', original_size)
restore_size = override.group(1) if override else 'reset'
summary = {
    'environment': 'Android emulator; not physical hardware',
    'api': call('shell', 'getprop', 'ro.build.version.sdk').strip(),
    'android': call('shell', 'getprop', 'ro.build.version.release').strip(),
    'abi': call('shell', 'getprop', 'ro.product.cpu.abi').strip(),
    'pageSize': call('shell', 'getconf', 'PAGE_SIZE').strip(),
    'apkSha256': hashlib.sha256(Path(args.apk).read_bytes()).hexdigest(),
    'checks': [],
}
try:
    call('install', '-r', args.apk)
    call('shell', 'settings', 'put', 'secure', 'immersive_mode_confirmations', 'confirmed')
    call('shell', 'input', 'keyevent', '82')
    call('shell', 'am', 'force-stop', package)
    call('shell', 'pm', 'revoke', package, 'android.permission.CAMERA')
    call('shell', 'pm', 'clear-permission-flags', package, 'android.permission.CAMERA', 'user-set', 'user-fixed')
    call('shell', 'am', 'start', '-W', '-n', activity)
    button = find(lambda n: n.get('text') == 'Allow camera access')
    screen('01-first-launch-without-permission')
    summary['checks'].append('First launch displays camera permission explanation')
    click(button)
    click(find(lambda n: n.get('resource-id', '').endswith(':id/permission_deny_button')))
    find(lambda n: n.get('text') == 'Allow camera access')
    assert call('shell', 'pidof', package).strip()
    summary['checks'].append('Denying camera permission keeps the app open')
    click(find(lambda n: n.get('text') == 'Allow camera access'))
    click(find(lambda n: n.get('resource-id', '').endswith(':id/permission_allow_foreground_only_button')))
    find(lambda n: n.get('content-desc') == 'Take photo' and n.get('enabled') == 'true')
    screen('02-camera-after-grant')
    summary['checks'].append('Granting camera permission starts a working shutter')
    for size in ['1080x2092', '2208x1840']:
        call('shell', 'wm', 'size', size)
        find(lambda n: n.get('content-desc') == 'Take photo' and n.get('enabled') == 'true')
        call('shell', 'am', 'force-stop', package)
        call('shell', 'am', 'start', '-W', '-n', activity)
        find(lambda n: n.get('content-desc') == 'Take photo' and n.get('enabled') == 'true')
        screen('03-relaunch-' + size)
        summary['checks'].append('Camera survives resize and cold relaunch at ' + size)
    summary['passed'] = True
except Exception:
    screen('failure-before-size-restoration')
    raise
finally:
    call('shell', 'wm', 'size', restore_size)
    (out / 'crash-buffer.log').write_text(call('logcat', '-b', 'crash', '-d', '-t', '300'), encoding='utf-8')
    (out / 'camera-errors.log').write_text(call('logcat', '-d', '-s', 'SmartCaptureCamera:E', 'SmartCaptureStartup:E', 'AndroidRuntime:E'), encoding='utf-8')
    (out / 'result.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps(summary))
