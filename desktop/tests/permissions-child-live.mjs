import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Client,completedTurn,readDurableSession} from '../../spike/client.mjs';
import {environment} from '../../spike/prepare.mjs';
import {profileFor} from '../engine/reasoning-config.mjs';
const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]])),scratch=resolve(o['--scratch']),runtime=resolve(o['--runtime-root']);
assert.ok(!existsSync(scratch));mkdirSync(scratch,{recursive:true,mode:0o700});
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json'))),up=join(runtime,'upstream'),source=resolve('outputs/wisp-project/desktop/engine'),results=[];
for(const scenario of (o['--case']?[o['--case']]:['spawn-denied','fork-denied','spawn-cancelled','fork-cancelled'])) {
 const home=join(scratch,scenario);mkdirSync(home,{mode:0o700});for(const dir of ['workspace','dsh-home','tmp'])mkdirSync(join(home,dir),{mode:0o700});
 const route=profileFor({version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''});
 writeFileSync(join(home,'dsh-home/settings.yaml'),JSON.stringify({'llm-pi-ai':{providers:{[route.provider]:route.profile}}}),{mode:0o600});
 const patch=join(home,'product.patch.yml');writeFileSync(patch,readFileSync(join(source,'product.patch.yml'),'utf8').replace('__WISP_PRODUCT_ADAPTER__',JSON.stringify(join(up,'wisp-product/engine/product-sdk.ts'))),{mode:0o600});
 const ledger=join(home,'ledger.jsonl'),sessionId='wisp-'+randomUUID();
 const client=new Client(meta.node,['--import',meta.tsx,join(up,'apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch],{cwd:join(home,'workspace'),env:{...environment(home,meta.pnpm),TSX_TSCONFIG_PATH:join(up,'tsconfig.json'),WISP_REASONING_LOCAL_KEY:'ollama',WISP_COMPANION_ID:randomUUID(),WISP_ENGINE_GENERATION:randomUUID(),WISP_PERMISSION_FIXTURES:'1',WISP_PERMISSION_LEDGER:ledger}});
 try {
  await client.request('initialize',{cwd:join(home,'workspace'),provider:route.provider,model:route.model});
  const start=client.frames.length,receipt=await client.request('session/prompt',{sessionId,contentBlocks:[{type:'text',text:'Call wisp_permission_check exactly once with label parentverification. Then stop. Never retry.'}]});
  const request=await client.wait(frames=>frames.slice(start).find(f=>f.method==='wisp.approval.requested')?.params,120000);
  const decision={};for(const key of ['version','generation','requestId','sessionId','callId','actionDigest'])decision[key]=request[key];decision.decision='allow-once';
  await client.request('wisp/approval.decide',decision);await client.wait(frames=>completedTurn(frames.slice(start),sessionId,receipt.messageId),120000);assert.equal(readFileSync(ledger,'utf8').trim().split('\n').length,1);
  const childStart=client.frames.length;
  const running=client.request('wisp/verification.child',{provider:scenario.split('-')[0]},120000);
  if(scenario.endsWith('cancelled')) {await client.wait(frames=>frames.slice(childStart).find(f=>f.method==='wisp.child.started'),120000);await client.request('wisp/session.cancel',{sessionId});}
  const result=await running;
  assert.equal(result.never,true);assert.equal(result.parentSessionMatches,true);assert.equal(readFileSync(ledger,'utf8').trim().split('\n').length,1);
  if(scenario.endsWith('denied')) {assert.equal(result.stopReason,'completed');assert.equal(result.toolCalls,1);assert.equal(result.asked,1);assert.deepEqual(result.outcomes,['rejected']);}else assert.equal(result.stopReason,'aborted');
  assert.equal(client.frames.slice(childStart).filter(f=>f.method==='wisp.approval.requested').length,0);
  await client.shutdown();
  results.push({scenario,actualLocalModel:true,actualProvider:true,attempts:1,...result,parentEffects:1,childEffects:0,noForwardedPrompt:true,cleanup:true});
 }finally{if(!client.exited)await client.force();writeFileSync(join(home,'private-frames.json'),JSON.stringify(client.frames,null,2),{mode:0o600});}
 writeFileSync(join(scratch,'results.json'),JSON.stringify(results,null,2),{mode:0o600});
}
console.log(JSON.stringify(results,null,2));
