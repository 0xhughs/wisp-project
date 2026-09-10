// Real local provider and Harness gate proof. Native GUI proof is separate.
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]])),root=resolve(o['--scratch']);
assert.ok(!existsSync(root));mkdirSync(root,{recursive:true,mode:0o700});
const runtime=resolve(o['--runtime-root']),meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json'))),results=[];
for(const scenario of (o['--case']?[o['--case']]:['direct-deny','direct-cancel','direct-allow','plugin-deny','plugin-cancel','plugin-allow'])) {
 const scratch=join(root,scenario);mkdirSync(scratch,{mode:0o700});writeFileSync(join(scratch,'.wisp-owned'),'permissions',{mode:0o600});
 const memory=join(scratch,'memory.json');writeFileSync(memory,JSON.stringify({version:1,companionId:randomUUID(),revision:'a'.repeat(64),memory:{version:1,entries:[]}}),{mode:0o600});
 const child=spawn(meta.node,[resolve('outputs/wisp-project/desktop/engine/body-bridge.mjs'),'--runtime-root',runtime,'--scratch',scratch,'--memory-file',memory,'--developer','true'],{stdio:['pipe','pipe','pipe']});
 const events=[];let tail='',exited=false,exitCode,errors='';child.stdin.on('error',()=>{});child.stdout.on('data',b=>{tail+=b;const lines=tail.split('\n');tail=lines.pop();for(const line of lines)events.push(JSON.parse(line));});child.stderr.on('data',b=>errors+=b);child.on('exit',code=>{exited=true;exitCode=code});
 const send=m=>child.stdin.write(JSON.stringify(m)+'\n');
 const wait=async(fn,ms=120000)=>{const end=Date.now()+ms;while(Date.now()<end){const value=fn();if(value)return value;if(exited)throw Error('EARLY_EXIT');await delay(25)}throw Error('TIMEOUT')};
 try {
  send({op:'configure',configuration:{version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''}});
  await wait(()=>events.find(e=>e.event==='ready'));
  send({op:scenario.startsWith('plugin')?'permission-plugin':'permission-direct'});
  const request=await wait(()=>events.find(e=>e.event==='approval-request'));
  const ledger=()=>readdirSync(scratch).filter(n=>n.startsWith('body-')).flatMap(n=>['ledger.jsonl','ledger.jsonl.plugin'].map(f=>join(scratch,n,f))).filter(existsSync).flatMap(f=>readFileSync(f,'utf8').trim().split('\n').filter(Boolean));
  assert.equal(ledger().length,0);await delay(250);assert.equal(ledger().length,0);
  const decision={};for(const k of ['version','generation','requestId','sessionId','callId','actionDigest'])decision[k]=request[k];decision.decision=scenario.endsWith('allow')?'allow-once':scenario.endsWith('cancel')?'cancel':'deny';
  send({op:'approval',decision});
  const completed=await wait(()=>events.find(e=>e.event==='permission-test'));
  assert.equal(completed.approvalCount,1);assert.equal(ledger().length,scenario.endsWith('allow')?1:0);
  if(ledger().length)assert.equal(JSON.parse(ledger()[0]).actionDigest,request.actionDigest);
  send({op:'stop'});await wait(()=>exited,35000);assert.equal(exitCode,0);assert.ok(events.find(e=>e.event==='stopped'&&e.noOrphan&&e.clean));
  results.push({scenario,attempts:1,actualLocalHarness:true,withheldZero:true,effects:ledger().length,requestDigest:request.actionDigest,closed:events.find(e=>e.event==='approval-closed')?.outcome,turn:completed.turn,cleanup:true});
 }finally {if(!exited){child.stdin.end();await wait(()=>exited,35000).catch(()=>child.kill('SIGKILL'));}writeFileSync(join(scratch,'private-events.json'),JSON.stringify(events,null,2),{mode:0o600});writeFileSync(join(scratch,'private-errors.txt'),errors,{mode:0o600});}
 writeFileSync(join(root,'results.json'),JSON.stringify(results,null,2),{mode:0o600});
}
console.log(JSON.stringify(results,null,2));
