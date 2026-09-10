#!/usr/bin/env python3
"""Root-owned developer launcher through LaunchServices; never activates voice.
Keeps a private FIFO open for the existing developer command transport. App exit
is observed through open -W; terminal EOF sends the ordinary stop command.
"""
import argparse, json, os, select, stat, subprocess, sys, tempfile, shutil
from pathlib import Path
p=argparse.ArgumentParser()
for name in ['app','runtime-root','scratch','log-dir']:p.add_argument('--'+name,required=True)
a=p.parse_args(); app=Path(a.app).resolve();runtime=Path(a.runtime_root).resolve();scratch=Path(a.scratch).resolve();logs=Path(a.log_dir).resolve()
assert (scratch/'.wisp-owned').is_file() and (scratch/'support').is_dir()
assert not logs.exists(), 'use a fresh launch evidence directory'
logs.mkdir(parents=True,mode=0o700)
subprocess.run(['/usr/bin/codesign','--verify','--strict',str(app)],check=True)
node=json.loads((runtime/'.wisp-spike.json').read_text())['node']
# launchd opens these before the app can request Documents access. Keep the
# launch streams in a private temporary directory, not a TCC-protected folder.
io=Path(tempfile.mkdtemp(prefix='wisp-native-launch-'))
for name in ['native.log','native.stderr.log']:
    stream=os.open(io/name,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(stream)
fifo=io/'native.stdin';os.mkfifo(fifo,0o600)
fd=os.open(fifo,os.O_RDWR|os.O_NONBLOCK)
args=['/usr/bin/open','-n','-W','-a',str(app),'--stdin',str(fifo),'--stdout',str(io/'native.log'),'--stderr',str(io/'native.stderr.log'),'--args','--developer','true','--runtime-root',str(runtime),'--scratch',str(scratch),'--node',node,'--test-support',str(scratch/'support'),'--test-keychain',str(scratch/'test.keychain')]
(logs/'launch.json').write_text(json.dumps({'app':str(app),'launch':'LaunchServices','scratch':str(scratch),'voiceActivated':False,'liveLog':str(io/'native.log'),'liveStderr':str(io/'native.stderr.log')},indent=2)+'\n')
print(json.dumps({'liveLog':str(io/'native.log'),'liveStderr':str(io/'native.stderr.log')}),flush=True)
proc=subprocess.Popen(args);watch_stdin=True
try:
    while proc.poll() is None:
        if watch_stdin:
            readable,_,_=select.select([sys.stdin],[],[],0.2)
            if readable:
                data=os.read(sys.stdin.fileno(),4096)
                if not data:data=b'{"op":"stop"}\n';watch_stdin=False
                os.write(fd,data)
        else:
            try:proc.wait(timeout=0.2)
            except subprocess.TimeoutExpired:pass
    print(json.dumps({'launchServicesExit':proc.returncode,'log':str(io/'native.log')}),flush=True)
finally:
    os.close(fd);fifo.unlink(missing_ok=True)
    for name in ['native.log','native.stderr.log']:shutil.copy2(io/name,logs/name);(io/name).unlink()
    io.rmdir()
sys.exit(proc.returncode)
