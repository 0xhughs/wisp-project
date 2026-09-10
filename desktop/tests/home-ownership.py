"""Real two-process lock replacement regression; pass fresh external scratch and probe."""
import json, os, pathlib, select, shutil, subprocess, sys
root = pathlib.Path(sys.argv[1]).resolve()
root.mkdir(mode=0o700)
probe = str(pathlib.Path(sys.argv[2]).resolve())
processes = []
def response(process):
    assert select.select([process.stdout], [], [], 5)[0], 'probe response timeout'
    return process.stdout.readline().strip()
def start(case, name):
    process = subprocess.Popen([probe, str(case), name], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    processes.append(process)
    return process, response(process)
def stop(process):
    if process.poll() is None:
        process.stdin.write('quit\n'); process.stdin.flush()
    process.wait(timeout=5)
results = []
try:
    for location in ('home', 'private'):
        for mutation in ('unlink', 'replace', 'symlink', 'hardlink', 'mode'):
            case = root / (location + '-' + mutation); case.mkdir(mode=0o700)
            (case / '.wisp-owned').write_text('ownership-test\n')
            (case / 'home').mkdir(mode=0o700)
            owner, ready = start(case, 'a'); assert ready == 'READY'
            original = (case / 'home/memory.json').read_bytes()
            (case / 'b').mkdir(mode=0o700); shutil.copy2(case / 'a/home.json', case / 'b/home.json')
            lock = case / ('home/.wisp-lock' if location == 'home' else 'a/owner.lock')
            canary = case / 'canary'; canary.write_text('outside'); canary.chmod(0o600)
            if mutation == 'mode': lock.chmod(0o644)
            else:
                lock.unlink()
                if mutation == 'replace': lock.touch(mode=0o600)
                elif mutation == 'symlink': lock.symlink_to(canary)
                elif mutation == 'hardlink': os.link(canary, lock)
            rival, outcome = start(case, 'b' if location == 'home' else 'a')
            assert outcome == 'REFUSED', (location, mutation, 'second owner admitted')
            stop(rival)
            for command in ('read', 'load', 'choose', 'stage', 'save'):
                owner.stdin.write(command + '\n'); owner.stdin.flush()
                assert response(owner) == 'REFUSED', (location, mutation, command)
            assert (case / 'home/memory.json').read_bytes() == original
            assert canary.read_text() == 'outside'
            assert not (case / 'a/launch-memory.json').exists()
            stop(owner)
            if lock.exists() or lock.is_symlink(): lock.unlink()
            restored, outcome = start(case, 'a'); assert outcome == 'READY'
            stop(restored)
            results.append({'location': location, 'mutation': mutation, 'rivalRefused': True, 'allOperationsRefused': True, 'dataUnchanged': True, 'recoveredAfterOwnerExit': True})
    # Keep one live store and an independent contender descriptor open across rename/rebind.
    case = root / 'live-move'; case.mkdir(mode=0o700)
    (case / '.wisp-owned').write_text('ownership-test\n'); (case / 'home').mkdir(mode=0o700)
    owner, outcome = start(case, 'a'); assert outcome == 'READY'
    (case / 'b').mkdir(mode=0o700); shutil.copy2(case / 'a/home.json', case / 'b/home.json')
    watcher_code = """import os,fcntl,sys,time,pathlib,json
fd=os.open(sys.argv[1],os.O_RDONLY); print('READY',flush=True); attempts=0; acquired=0
while not pathlib.Path(sys.argv[2]).exists():
 attempts+=1
 try: fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB);acquired+=1;fcntl.flock(fd,fcntl.LOCK_UN)
 except BlockingIOError: pass
 time.sleep(.001)
os.close(fd);print(json.dumps({'attempts':attempts,'acquired':acquired}),flush=True)
"""
    watcher = subprocess.Popen([sys.executable,'-c',watcher_code,str(case/'home'),str(case/'stop')],stdout=subprocess.PIPE,text=True)
    processes.append(watcher); assert response(watcher) == 'READY'
    (case / 'home').rename(case / 'moved')
    def command(value):
        owner.stdin.write(value+'\n');owner.stdin.flush();return response(owner)
    assert command('read') == 'REFUSED'
    shutil.copytree(case/'moved',case/'other')
    assert command('choose-other') == 'REFUSED', 'copied same UUID must not replace held inode'
    marker = case/'other/wisp-home.json'; data=json.loads(marker.read_text());data['companionId']='a68b29b8-dbe2-4903-b7d1-90dd071cb419';marker.write_text(json.dumps(data))
    assert command('choose-other') == 'REFUSED', 'different identity refused'
    rival,outcome=start(case,'b');assert outcome=='REFUSED';stop(rival)
    for _ in range(20): assert command('choose-moved') == 'OK'
    for op in ('read','load','stage','save'): assert command(op)=='OK'
    rival,outcome=start(case,'b');assert outcome=='REFUSED';stop(rival)
    (case/'stop').touch(); observation=json.loads(response(watcher));watcher.wait(timeout=5)
    assert observation['attempts']>0 and observation['acquired']==0, observation
    stop(owner)
    next_owner,outcome=start(case,'b');assert outcome=='READY';stop(next_owner)
    results.append({'liveMoveReselect':True,'wrongIdentityAndCopiedInodeRefused':True,'readsLoadsStagesSavesRestored':True,'competingLockAttempts':observation['attempts'],'competingLockAcquired':0,'rivalRefusedBeforeAndAfter':True,'ownerExitRecovery':True})

finally:
    for process in processes:
        if process.poll() is None: process.kill()
        process.wait(timeout=5)
(root / 'result.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps({'realTwoProcessReplacementCases': len(results), 'allPassed': True}))
