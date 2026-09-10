#!/usr/bin/env python3
"""Static development bundle check. Never requests permission or starts the app."""
import plistlib, subprocess, sys
from pathlib import Path
app=Path(sys.argv[1]).resolve()
info=plistlib.loads((app/'Contents/Info.plist').read_bytes())
for key in ['NSMicrophoneUsageDescription','NSSpeechRecognitionUsageDescription']:
    assert isinstance(info.get(key),str) and info[key].strip(), key
signature=subprocess.run(['/usr/bin/codesign','-d','--verbose=4',str(app)],capture_output=True,text=True,check=True).stderr
assert 'Identifier='+info['CFBundleIdentifier']+'\n' in signature, 'bundle identifier is not the signing identifier'
assert 'Info.plist=not bound' not in signature and 'Info.plist entries=' in signature, 'usage descriptions not bound to executable signature'
assert 'Sealed Resources=none' not in signature, 'bundle resources not sealed'
subprocess.run(['/usr/bin/codesign','--verify','--strict',str(app)],check=True)
print('Development bundle privacy descriptions bound to own identity; signature verified. No permission request.')
