// Supplemental typed-text bridge proof. This never claims microphone or audible output.
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]])),scratch=resolve(o['--scratch']),runtime=resolve(o['--runtime-root']);
assert.ok(!existsSync(scratch));mkdirSync(scratch,{recursive:true,mode:0o700});writeFileSync(join(scratch,'.wisp-owned'),'voice',{mode:0o600});
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json'))),companionId=randomUUID(),memory=join(scratch,'memory.json');writeFileSync(memory,JSON.stringify({version:1,companionId,revision:'a'.repeat(64),memory:{version:1,entries:[]}}),{mode:0o600});
const child=spawn(meta.node,[resolve('outputs/wisp-project/desktop/engine/body-bridge.mjs'),'--runtime-root',runtime,'--scratch',scratch,'--memory-file',memory,'--developer','true'],{stdio:['pipe','pipe','pipe']});
let tail='',exited=false,code;const events=[],proof=[];
child.stdin.on('error',()=>{});child.stderr.resume();child.stdout.on('data',b=>{tail+=b;const lines=tail.split('\n');tail=lines.pop();for(const l of lines)events.push(JSON.parse(l))});child.on('exit',c=>{exited=true;code=c});
const send=m=>child.stdin.write(JSON.stringify(m)+'\n');
const wait=async(fn,ms=120000)=>{const end=Date.now()+ms;while(Date.now()<end){const v=fn();if(v)return v;if(exited)throw Error('EARLY_EXIT '+code);await delay(15)}throw Error('TIMEOUT')};
try{
 send({op:'configure',configuration:{version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''}});
 const ready=await wait(()=>events.find(e=>e.event==='ready'));
 for(const scenario of ['first','second','cancel']){
  const utteranceId=randomUUID(),base={generation:ready.permissionGeneration,companionId,utteranceId},start=Date.now();
  send({op:'voice',...base,text:scenario==='cancel'?'Explain the history of mathematics in twenty paragraphs. Do not use tools.':'Reply with one short friendly greeting. Do not use any tool.'});
  await wait(()=>events.find(e=>e.event==='voice-processing'&&e.utteranceId===utteranceId));
  if(scenario==='cancel'){await delay(250);send({op:'voice-cancel',...base})}
  const settled=await wait(()=>events.find(e=>e.event==='voice-settled'&&e.utteranceId===utteranceId));
  const result=events.find(e=>e.event==='voice-result'&&e.utteranceId===utteranceId);
  if(scenario==='cancel'){assert.equal(settled.cancelled,true);assert.equal(result,undefined)}else{assert.ok(result.text.trim());assert.equal(result.messageId,settled.messageId);assert.equal(result.turn,settled.turn);send({op:'voice-cancel',...base});await delay(80)}
  proof.push({scenario,utteranceId,messageId:settled.messageId,turn:settled.turn,cancelled:settled.cancelled,nonemptyText:!!result?.text,elapsedMs:Date.now()-start,attempt:1,typedSeam:true});
 }
 assert.ok(!events.some(e=>['unavailable','approval-request','voice-failed'].includes(e.event)));send({op:'stop'});await wait(()=>exited,35000);assert.equal(code,0);assert.ok(events.some(e=>e.event==='stopped'&&e.clean&&e.noOrphan));
 console.log(JSON.stringify({proof,cleanup:true,model:'qwen3:8b',cloudCalls:0,hardwareProof:false},null,2));
}finally{if(!exited){child.stdin.end();await wait(()=>exited,35000).catch(()=>child.kill('SIGKILL'))}writeFileSync(join(scratch,'events.json'),JSON.stringify(events.map(({text,...e})=>({...e,...(text?{textCharacters:text.length}:{})})),null,2),{mode:0o600})}
