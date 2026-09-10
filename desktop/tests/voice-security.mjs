// Real bridge rejection before any model turn; no capture or synthesis.
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]])),root=resolve(o['--scratch']),runtime=resolve(o['--runtime-root']),meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));
assert.ok(!existsSync(root));mkdirSync(root,{recursive:true,mode:0o700});const results=[];
for(const scenario of (o['--scenario']?[o['--scenario']]:['foreign-generation','extra-session','invalid-utf8'])){
 const scratch=join(root,scenario);mkdirSync(scratch,{mode:0o700});writeFileSync(join(scratch,'.wisp-owned'),'voice',{mode:0o600});const companionId=randomUUID(),memory=join(scratch,'memory.json');writeFileSync(memory,JSON.stringify({version:1,companionId,revision:'a'.repeat(64),memory:{version:1,entries:[]}}),{mode:0o600});
 const child=spawn(meta.node,[resolve('outputs/wisp-project/desktop/engine/body-bridge.mjs'),'--runtime-root',runtime,'--scratch',scratch,'--memory-file',memory,'--developer','true'],{stdio:['pipe','pipe','pipe']});
 let tail='',exited=false,code;const events=[];child.stdin.on('error',()=>{});child.stderr.resume();child.stdout.on('data',b=>{tail+=b;const lines=tail.split('\n');tail=lines.pop();for(const l of lines)events.push(JSON.parse(l))});child.on('exit',c=>{exited=true;code=c});
 const send=m=>child.stdin.write(JSON.stringify(m)+'\n');const wait=async(fn)=>{const end=Date.now()+35000;while(Date.now()<end){const v=fn();if(v)return v;if(exited)throw Error('EARLY_EXIT');await delay(20)}throw Error('TIMEOUT')};
 try{
  send({op:'configure',configuration:{version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''}});
  const ready=await wait(()=>events.find(e=>e.event==='ready')),frame={op:'voice',generation:ready.permissionGeneration,companionId,utteranceId:randomUUID(),text:'Must not be submitted'};
  if(scenario==='duplicate'){send(frame);send(frame)}
  if(scenario==='foreign-generation')send({...frame,generation:randomUUID()});if(scenario==='extra-session')send({...frame,sessionId:'foreign'});if(scenario==='invalid-utf8')child.stdin.write(Buffer.from([0xc3,0x28,10]));
  await wait(()=>exited);assert.equal(code,1);assert.equal(events.filter(e=>e.event==='voice-processing').length,scenario==='duplicate'?1:0);assert.ok(!events.some(e=>e.event==='voice-result'));assert.ok(events.some(e=>e.event==='stopped'&&e.clean&&e.noOrphan));
  const homes=readdirSync(scratch).filter(n=>n.startsWith('body-'));for(const home of homes){const sessions=join(scratch,home,'dsh-home','sessions');if(scenario!=='duplicate')assert.ok(!existsSync(sessions)||readdirSync(sessions).length===0,'no persisted user session');}
  results.push({scenario,maximumPromptSubmissions:scenario==='duplicate'?1:0,noUserSession:scenario!=='duplicate',duplicateRejected:scenario==='duplicate',cleanup:true});
 }finally{if(!exited){child.stdin.end();await wait(()=>exited).catch(()=>child.kill('SIGKILL'))}writeFileSync(join(scratch,'events.json'),JSON.stringify(events,null,2),{mode:0o600})}
}
console.log(JSON.stringify(results,null,2));
