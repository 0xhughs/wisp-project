import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,appendFileSync,readFileSync,realpathSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const options=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+i*2],process.argv[3+i*2]]));
const scratch=resolve(options['--scratch']); mkdirSync(scratch,{recursive:true,mode:0o700}); writeFileSync(join(scratch,'.wisp-owned'),'body-live\n',{mode:0o600});
const app=options['--app'] || join(dirname(scratch),'Wisp.app/Contents/MacOS/WispBody');
const runtime=realpathSync(options['--runtime-root']);
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));
const results=[];
const noProcess=pid=>{try{process.kill(pid,0);return false}catch(e){if(e.code!=='ESRCH')throw e;return true}};
const noGroup=pid=>!spawnSync('/bin/ps',['-axo','pgid='],{encoding:'utf8'}).stdout.split('\n').some(x=>Number(x.trim())===pid);
async function waitFor(fn,ms=120000) { const until=Date.now()+ms; while(Date.now()<until){const value=fn();if(value)return value;await delay(30)}throw Error('LIVE_TIMEOUT') }
for(const scenario of (options['--case'] ? [options['--case']] : ['normal','native-signal','native-kill','bridge-signal','bridge-kill','engine-kill','startup-failure'])) {
 const home=join(scratch,scenario); mkdirSync(home,{mode:0o700}); writeFileSync(join(home,'.wisp-owned'),'case\n',{mode:0o600});
 assert.ok(options['--fixture-helper'],'--fixture-helper required');
 const fixture=spawnSync(options['--fixture-helper'],['create',join(home,'support'),join(home,'wisp-home')],{encoding:'utf8'}); assert.equal(fixture.status,0,fixture.stderr);
 const frames=[]; let tail='',exited=false,status,stderr='';
 const child=spawn(app,['--developer','true','--test-support',join(home,'support'),'--runtime-root',scenario==='startup-failure'?join(home,'missing-runtime'):runtime,'--scratch',home,'--node',meta.node],{stdio:['pipe','pipe','pipe']});
 child.stdout.on('data',bytes=>{tail+=bytes.toString();const lines=tail.split('\n');tail=lines.pop();for(const line of lines){frames.push(JSON.parse(line));appendFileSync(join(home,'events.jsonl'),line+'\n',{mode:0o600})}});
 child.stderr.on('data',bytes=>{stderr+=bytes.toString()}); child.on('exit',(code,signal)=>{exited=true;status={code,signal}});
 const send=op=>child.stdin.write(JSON.stringify({op})+'\n');
 let owned;
 try {
  if(scenario==='startup-failure') {
   await waitFor(()=>frames.find(f=>f.event==='unavailable'));send('status');await waitFor(()=>frames.find(f=>f.event==='status'&&f.state==='unavailable'));
   send('stop');await waitFor(()=>exited,35000);assert.equal(status.code,0);
   results.push({scenario,unavailable:true,noRuntime:!frames.some(f=>f.event==='owned'),exit:status});continue;
  }
  owned=await waitFor(()=>frames.find(f=>f.event==='ready'));
  assert.ok(owned.pid>0 && owned.bridgePID>0 && owned.sessionId);
  if(scenario==='normal') {
   send('smoke');const first=await waitFor(()=>frames.find(f=>f.event==='smoke'));
   send('sequence');await waitFor(()=>frames.find(f=>f.event==='simulated-presentation'&&f.state==='listening'));
   send('recreate');await waitFor(()=>frames.find(f=>f.event==='body'&&f.bodyGeneration===2));
   await delay(3300);send('status');const after=await waitFor(()=>frames.find(f=>f.event==='status'));
   assert.equal(after.state,'idle'); assert.equal(after.liveViews,1); assert.equal(after.activeTimers,after.reduceMotion?0:1); assert.equal(after.bodyWindows,1); assert.equal(after.controller,owned.controller);assert.equal(after.runtimePID,owned.pid);assert.equal(after.sessionId,owned.sessionId);
   send('sequence'); await waitFor(()=>frames.find(f=>f.event==='simulated-presentation'&&f.state==='speaking'));
   await waitFor(()=>frames.find(f=>f.event==='simulated-presentation'&&f.state==='idle'));
   send('hide');const hidden=await waitFor(()=>frames.find(f=>f.event==='hidden'));assert.equal(hidden.animation,false);assert.equal(hidden.visible,false);
   send('show');await waitFor(()=>frames.find(f=>f.event==='shown'&&f.visible));
   send('smoke');const second=await waitFor(()=>frames.filter(f=>f.event==='smoke').length===2&&frames.filter(f=>f.event==='smoke')[1]);
   assert.equal(second.pid,first.pid);assert.equal(second.sessionId,first.sessionId);assert.equal(second.controller,first.controller);assert.notEqual(second.turn,first.turn);
   assert.equal(first.effects+second.effects,0);
   send('stop');await waitFor(()=>exited,35000);assert.equal(status.code,0);
   results.push({scenario,sameController:true,sameSession:true,sameRuntime:true,distinctTurns:true,turns:[first,second],stalePresentationCleared:true,hiddenAnimationPaused:true});
  } else if(scenario==='native-signal' || scenario==='native-kill') {
   process.kill(child.pid,scenario==='native-signal'?'SIGTERM':'SIGKILL');await waitFor(()=>exited,35000);
   results.push({scenario,exit:status});
  } else {
   send('sequence'); await waitFor(()=>frames.find(f=>f.event==='simulated-presentation'&&f.state==='listening'));
   process.kill(scenario==='engine-kill'?owned.pid:owned.bridgePID,scenario==='bridge-signal'?'SIGTERM':'SIGKILL');
   await waitFor(()=>frames.find(f=>f.event==='unavailable'),35000);send('status');const state=await waitFor(()=>frames.find(f=>f.event==='status'));assert.equal(state.state,'unavailable');
   send('stop');await waitFor(()=>exited,35000);results.push({scenario,unavailable:true,exit:status});
  }
  await waitFor(()=>noProcess(owned.pid)&&noGroup(owned.pid)&&noProcess(owned.bridgePID),35000);
  Object.assign(results.at(-1),{noOrphans:true,cleanup:frames.find(f=>f.event==='stopped') || {nativePipeEOF:true,forcedTestSignal:scenario.endsWith('kill')}});
 } catch(error) { writeFileSync(join(home,'failure.json'),JSON.stringify({category:error.message,frames,stderr},null,2));throw error; }
 finally {
  if(!exited){child.stdin.end();await waitFor(()=>exited,35000).catch(()=>child.kill('SIGKILL'))}
  if(owned && !noProcess(owned.pid)){try{process.kill(-owned.pid,'SIGTERM')}catch{} }
  writeFileSync(join(home,'native-events.json'),JSON.stringify(frames,null,2));writeFileSync(join(home,'native.stderr'),stderr);
  writeFileSync(join(scratch,'live.json'),JSON.stringify(results,null,2));
 }
}
console.log(JSON.stringify(results,null,2));
