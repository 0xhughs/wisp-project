import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Client,readDurableSession} from '../../spike/client.mjs';
import {environment} from '../../spike/prepare.mjs';
import {profileFor} from '../engine/reasoning-config.mjs';
const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]])),scratch=resolve(o['--scratch']),runtime=resolve(o['--runtime-root']);
assert.ok(!existsSync(scratch));mkdirSync(scratch,{recursive:true,mode:0o700});
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json'))),up=join(runtime,'upstream'),source=resolve('outputs/wisp-project/desktop/engine'),results=[];
 const home=join(scratch,'queue');mkdirSync(home,{mode:0o700});for(const dir of ['workspace','dsh-home','tmp'])mkdirSync(join(home,dir),{mode:0o700});
 const route=profileFor({version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''});
 writeFileSync(join(home,'dsh-home/settings.yaml'),JSON.stringify({'llm-pi-ai':{providers:{[route.provider]:route.profile}}}),{mode:0o600});
 const patch=join(home,'product.patch.yml');writeFileSync(patch,readFileSync(join(source,'product.patch.yml'),'utf8').replace('__WISP_PRODUCT_ADAPTER__',JSON.stringify(join(up,'wisp-product/engine/product-sdk.ts')))+'\n- insert:\n    - '+JSON.stringify({id:'wisp-local-permission-plugin',name:join(up,'wisp-product/engine/local-permission-plugin.ts'),inject:['tools','wispPermissions']})+'\n',{mode:0o600});
 const ledger=join(home,'ledger.jsonl'),sessionId='wisp-'+randomUUID();
 const client=new Client(meta.node,['--import',meta.tsx,join(up,'apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch],{cwd:join(home,'workspace'),env:{...environment(home,meta.pnpm),TSX_TSCONFIG_PATH:join(up,'tsconfig.json'),WISP_REASONING_LOCAL_KEY:'ollama',WISP_COMPANION_ID:randomUUID(),WISP_ENGINE_GENERATION:randomUUID(),WISP_PERMISSION_FIXTURES:'1',WISP_PERMISSION_LEDGER:ledger}});

try {
 await client.request('initialize',{cwd:join(home,'workspace'),provider:route.provider,model:route.model});
 const running=client.request('wisp/verification.queue',{},150000); running.catch(()=>{});
 const requests=await client.wait(fs=>{const rs=fs.filter(f=>f.method==='wisp.approval.requested');return rs.length===2?rs.map(f=>f.params):null});
 const records=()=>[ledger,ledger+'.plugin'].filter(existsSync).flatMap(p=>readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
 assert.equal(records().length,0,'both bodies withheld before decisions');
 assert.notEqual(requests[0].requestId,requests[1].requestId);
 assert.notEqual(requests[0].actionDigest,requests[1].actionDigest);
 const chosen=requests.find(r=>r.source==='wisp-local-plugin'),denied=requests.find(r=>r.source==='wisp-direct');
 const decide=(r,decision)=>Object.assign(Object.fromEntries(['version','generation','requestId','sessionId','callId','actionDigest'].map(k=>[k,r[k]])),{decision});
 // Resolve the second request first, proving selection is scoped, not FIFO authority.
 await client.request('wisp/approval.decide',decide(chosen,'allow-once'));
 await assert.rejects(client.request('wisp/approval.decide',decide(chosen,'allow-once')));
 await client.request('wisp/approval.decide',decide(denied,'deny'));
 const result=await running;
 assert.deepEqual(result,{deterministicRegistryFixture:true,modelCalls:0,completed:2,allowed:1});
 assert.equal(records().length,1);assert.equal(records()[0].callId,chosen.callId);
 assert.equal(records()[0].actionDigest,chosen.actionDigest);assert.equal(records()[0].source,'wisp-local-plugin');
 const cleanup=await client.shutdown();
 const audit=readDurableSession(join(home,'dsh-home'),chosen.sessionId).records;
 for(const r of requests){const asked=audit.find(e=>e.type==='approval/asked'&&e.data.callId===r.callId);assert.ok(asked);const decided=audit.filter(e=>e.type==='approval/decided'&&e.data.id===asked.data.id);assert.equal(decided.length,1);assert.equal(decided[0].data.outcome,r===chosen?'allowed-once':'rejected');}
 results.push({...result,withheldZero:true,reverseDecisionOrder:true,replayRejected:true,effectMatchesChosenCall:true,auditPairs:2,cleanup});
 writeFileSync(join(scratch,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
} catch(error){console.error(error);console.error(client.stderr);console.error(client.frames.filter(f=>f.error));process.exitCode=1;}finally{if(!client.exited)await client.force();writeFileSync(join(scratch,'frames.json'),JSON.stringify(client.frames,null,2));}
