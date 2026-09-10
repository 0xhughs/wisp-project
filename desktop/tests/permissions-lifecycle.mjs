// Product bridge + actual registry lifecycle proof; deterministic fixture, no inference.
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]])),root=resolve(o['--scratch']);
assert.ok(!existsSync(root));mkdirSync(root,{recursive:true,mode:0o700});
const runtime=resolve(o['--runtime-root']),meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json'))),results=[];
let oldDecision;
for(const scenario of [...(o['--native-close-probe']?['native-close']:[]),'cancel','eof','signal','invalid-frame','stale-generation']) {
 const scratch=join(root,scenario);mkdirSync(scratch,{mode:0o700});writeFileSync(join(scratch,'.wisp-owned'),'permissions',{mode:0o600});
 const memory=join(scratch,'memory.json');writeFileSync(memory,JSON.stringify({version:1,companionId:randomUUID(),revision:'a'.repeat(64),memory:{version:1,entries:[]}}),{mode:0o600});
 const child=spawn(meta.node,[resolve('outputs/wisp-project/desktop/engine/body-bridge.mjs'),'--runtime-root',runtime,'--scratch',scratch,'--memory-file',memory,'--developer','true'],{stdio:['pipe','pipe','pipe']});
 const events=[];let tail='',exited=false,exitCode;child.stdin.on('error',()=>{});child.stdout.on('data',b=>{tail+=b;const lines=tail.split('\n');tail=lines.pop();for(const line of lines)events.push(JSON.parse(line));});child.stderr.resume();child.on('exit',code=>{exited=true;exitCode=code});
 const send=m=>child.stdin.write(JSON.stringify(m)+'\n');
 const wait=async(fn,ms=30000)=>{const end=Date.now()+ms;while(Date.now()<end){const value=fn();if(value)return value;if(exited)throw Error('EARLY_EXIT');await delay(20)}throw Error('TIMEOUT')};
 const records=()=>readdirSync(scratch).filter(n=>n.startsWith('body-')).flatMap(n=>['ledger.jsonl','ledger.jsonl.plugin'].map(f=>join(scratch,n,f))).filter(existsSync).flatMap(f=>readFileSync(f,'utf8').trim().split('\n').filter(Boolean));
 try {
  send({op:'configure',configuration:{version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''}});
  await wait(()=>events.find(e=>e.event==='ready'));send({op:'permission-queue'});
  const requests=await wait(()=>{const r=events.filter(e=>e.event==='approval-request');return r.length===2?r:null});
  assert.equal(records().length,0);const d=Object.assign(Object.fromEntries(['version','generation','requestId','sessionId','callId','actionDigest'].map(k=>[k,requests[0][k]])),{decision:'cancel'});
  if(scenario==='cancel'){oldDecision={...d,decision:'allow-once'};send({op:'approval',decision:d});await wait(()=>events.find(e=>e.event==='permission-test'));
   await wait(()=>events.filter(e=>e.event==='approval-closed'&&requests.some(r=>r.requestId===e.requestId)).length===2);
   for(const r of requests){const closed=events.filter(e=>e.event==='approval-closed'&&e.requestId===r.requestId);assert.equal(closed.length,1);for(const k of ['generation','sessionId','callId','actionDigest'])assert.equal(closed[0][k],r[k]);assert.equal(closed[0].outcome,'cancelled');}
   assert.ok(!events.some(e=>e.event==='unavailable'));send({op:'stop'});}
  if(scenario==='native-close') {
   const closeBatch=async(batch)=>{
    const probe=spawnSync(resolve(o['--native-close-probe']),[],{input:JSON.stringify(batch),encoding:'utf8'});assert.equal(probe.status,0,probe.stderr);
    const decisions=JSON.parse(probe.stdout);assert.equal(decisions.length,1);send({op:'approval',decision:decisions[0]});
    await wait(()=>batch.every(r=>events.some(e=>e.event==='approval-closed'&&e.requestId===r.requestId&&e.actionDigest===r.actionDigest&&e.outcome==='cancelled')));
   };
   await closeBatch(requests);await wait(()=>events.filter(e=>e.event==='permission-test').length===1);
   assert.equal(records().length,0);assert.ok(!events.some(e=>e.event==='unavailable'));
   send({op:'permission-queue'});
   const next=await wait(()=>{const rs=events.filter(e=>e.event==='approval-request'&&!requests.some(r=>r.requestId===e.requestId));return rs.length===2?rs:null});
   assert.equal(next[0].generation,requests[0].generation);await closeBatch(next);await wait(()=>events.filter(e=>e.event==='permission-test').length===2);
   for(const complete of events.filter(e=>e.event==='tested')){assert.equal(complete.operation,'permission-queue');assert.ok(complete.operationId);assert.equal(complete.generation,requests[0].generation);assert.ok(events.some(e=>e.event==='testing'&&e.operationId===complete.operationId));}
   assert.ok(!events.some(e=>e.event==='connection-test'||e.event==='unavailable'));send({op:'stop'});
  }
  if(scenario==='eof')child.stdin.end();
  if(scenario==='signal')child.kill('SIGTERM');
  if(scenario==='invalid-frame')send({op:'approval',decision:{...d,extra:'forbidden'}});
  if(scenario==='stale-generation'){assert.notEqual(oldDecision.generation,d.generation);send({op:'approval',decision:oldDecision});}
  await wait(()=>exited,35000);assert.equal(exitCode,['invalid-frame','stale-generation'].includes(scenario)?1:0);assert.equal(records().length,0);assert.ok(events.some(e=>e.event==='stopped'&&e.noOrphan&&e.clean));
  assert.equal(events.filter(e=>e.event==='approval-closed').length,scenario==='native-close'?4:2,'teardown drains both correlated closures');
  for(const request of events.filter(e=>e.event==='approval-request')) {
   const closed=events.filter(e=>e.event==='approval-closed'&&e.requestId===request.requestId);assert.equal(closed.length,1);
   for(const key of ['generation','sessionId','callId','actionDigest'])assert.equal(closed[0][key],request[key]);assert.equal(closed[0].outcome,'cancelled');
  }
  const failureIndex=events.findIndex(e=>e.event==='unavailable');
  if(failureIndex>=0)assert.ok(!events.slice(failureIndex+1).some(e=>['tested','permission-test','connection-test'].includes(e.event)),'failed operation cannot report success afterward');
  results.push({scenario,pending:2,batches:scenario==='native-close'?2:1,closures:events.filter(e=>e.event==='approval-closed').length,effects:0,cleanup:true,modelCalls:0,correlatedClosures:true,noCompletionAfterFailure:true,categoricalFailure:failureIndex>=0});
 }finally{if(!exited){child.stdin.end();await wait(()=>exited,35000).catch(()=>child.kill('SIGKILL'));}writeFileSync(join(scratch,'events.json'),JSON.stringify(events,null,2),{mode:0o600});}
 writeFileSync(join(root,'results.json'),JSON.stringify(results,null,2),{mode:0o600});
}
console.log(JSON.stringify(results,null,2));
