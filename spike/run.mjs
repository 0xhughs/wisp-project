import { readFileSync, writeFileSync, mkdirSync, cpSync, realpathSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { args,environment,command,loadAuthorizedRoute } from './prepare.mjs';
import { processIdentity } from './cleanup.mjs';
import { Client,completedTurn,readDurableSession } from './client.mjs';
const a=args(),root=realpathSync(resolve(a.root)),m=JSON.parse(readFileSync(join(root,'.wisp-spike.json'))),up=join(root,'upstream');
if(m.root!==root||realpathSync(m.tempAlias)!==join(root,'tmp'))throw new Error('WISP_INVALID_ROOT');
// Refresh only candidate-owned source copies. All generated artifacts remain outside the candidate.
cpSync(resolve('spike'),join(up,'wisp-spike'),{recursive:true});
const env=environment(root,m.pnpm,m.tempAlias);
env.TSX_TSCONFIG_PATH=join(up,'tsconfig.json');
const patch=join(up,'wisp-spike/profile/wisp.patch.yml');
writeFileSync(patch,readFileSync('spike/profile/wisp.patch.yml','utf8').replace('__WISP_ADAPTER__',JSON.stringify(join(up,'wisp-spike/engine/wisp-sdk.ts'))));
writeFileSync(join(up,'wisp-spike/tsconfig.json'),JSON.stringify({extends:'../tsconfig.base.json',compilerOptions:{noEmit:true,composite:false,incremental:false},include:['engine/**/*.ts'],references:['../vendor/cordis','../packages/sdk/server','../packages/sdk/protocol','../packages/core/tools','../packages/core/session','../packages/core/agent','../packages/interaction/user-approval'].map(path=>({path}))}));
const argv=['--import',m.tsx,join(up,'apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch];
const proof=join(root,'proof');
const save=(name,value)=>writeFileSync(join(proof,name+'.json'),JSON.stringify(value,null,2),{mode:0o600});
if(a.case==='unit') {
 command(join(up,'node_modules/.bin/vitest'),['run','--config',join(up,'wisp-spike/tests/vitest.config.ts')],up,env);
 command(m.node,['--test',join(up,'wisp-spike/tests/client.test.mjs')],up,env);
 command(m.node,[join(up,'node_modules/typescript/bin/tsc'),'--project',join(up,'wisp-spike/tsconfig.json')],up,env);
 save('unit',{passed:true});
} else if(a.case==='dump-config') {
 const r=spawnSync(m.node,[...argv,'--dump-config'],{cwd:join(root,'workspace'),env,encoding:'utf8'});
 writeFileSync(join(proof,'dump-config.yml'),r.stdout);writeFileSync(join(proof,'dump-config.stderr'),r.stderr);
 if(r.status!==0)throw new Error('WISP_CONFIG_FAILED');
 console.log(r.stdout);
} else {
 if(!['live','lifecycle'].includes(a.case))throw new Error('unknown case');
 const routePath=resolve(a['route-file']||'../../work/wisp-01-authorized-route.json');
 const {bytes,route}=loadAuthorizedRoute(routePath);
 async function fetchJson(path,options){const r=await fetch('http://127.0.0.1:11434'+path,{...options,signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('LIVE_RESOURCE_UNAVAILABLE');return r.json();}
 const version=await fetchJson('/api/version'),tags=await fetchJson('/api/tags');
 async function stream(messages,tools) {
   const response=await fetch(route.baseURL+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:route.model,messages,tools,stream:true,reasoning_effort:'none',max_tokens:1024}),signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw new Error('LIVE_RESOURCE_UNAVAILABLE');
   const body=await response.text(),calls=new Map();let text='',done=false,finish=false;
   for(const line of body.split('\n'))if(line.startsWith('data: ')){if(line==='data: [DONE]'){done=true;continue;}const row=JSON.parse(line.slice(6)),choice=row.choices?.[0];if(choice?.finish_reason)finish=true;const delta=choice?.delta;if(delta?.content)text+=delta.content;for(const call of delta?.tool_calls||[]){const old=calls.get(call.index)||{id:'',type:'function',function:{name:'',arguments:''}};if(call.id)old.id=call.id;if(call.function?.name)old.function.name+=call.function.name;if(call.function?.arguments)old.function.arguments+=call.function.arguments;calls.set(call.index,old);}}
   assert.ok(done&&finish,'terminal stream required');return {text,calls:[...calls.values()]};
 }
 const greeting=await stream([{role:'user',content:'Say hello in one short sentence.'}]);assert.ok(greeting.text.trim());
 const messages=[{role:'user',content:'Call resource_probe exactly once with label ready.'}],tools=[{type:'function',function:{name:'resource_probe',description:'Harmless resource protocol probe',parameters:{type:'object',properties:{label:{type:'string'}},required:['label']}}}];
 const toolProbe=await stream(messages,tools);assert.equal(toolProbe.calls.length,1);assert.equal(toolProbe.calls[0].function.name,'resource_probe');assert.equal(JSON.parse(toolProbe.calls[0].function.arguments).label,'ready');
 const follow=await stream([...messages,{role:'assistant',content:toolProbe.text||null,tool_calls:toolProbe.calls},{role:'tool',tool_call_id:toolProbe.calls[0].id,content:'Probe done. Reply with a short confirmation; do not call again.'}],tools);assert.ok(follow.text.trim());assert.equal(follow.calls.length,0);
 const running=await fetchJson('/api/ps');
 assert.equal(version.version,route.runtimeVersion);assert.equal(tags.models.find(x=>x.name===route.model)?.digest,route.modelDigest);assert.equal(running.models.find(x=>x.name===route.model)?.context_length,8192);
 save('preflight',{runtimeVersion:version.version,model:route.model,digest:route.modelDigest,contextWindow:8192,streamedText:true,nativeToolCall:true,toolFollowup:true,terminalStreams:true,routeHash:createHash('sha256').update(bytes).digest('hex')});
 const results=[];
 const scenarios=a.case==='live'?['normal','deny','cancel','allow']:['unknown-provider','unknown-model','invalid-overlay','eof','sigterm','eof-pending','sigterm-pending'];
 for(const scenario of scenarios) {
  const home=join(root,'cases',scenario+'-'+randomUUID()),cwd=join(home,'workspace'),dsh=join(home,'dsh-home');
  mkdirSync(cwd,{recursive:true,mode:0o700});mkdirSync(dsh,{mode:0o700});
  const settings={'llm-pi-ai':{providers:{[route.provider]:{api:route.api,baseURL:route.baseURL,apiKeyEnv:route.apiKeyEnv,reasoning:route.reasoning,compat:route.compat,models:[{id:route.model,contextWindow:route.contextWindow,maxTokens:route.maxTokens,input:route.input,reasoningEfforts:route.reasoningEfforts}]}}}};
  writeFileSync(join(dsh,'settings.yaml'),JSON.stringify(settings),{mode:0o600});
  const ledger=join(home,'ledger.jsonl');
  const childEnv={...env,DSH_HOME:dsh,WISP_SPIKE_LEDGER:ledger,WISP_SPIKE_MODEL_KEY:'ollama'};
  let childArgv=argv;
  if(scenario==='invalid-overlay'){const bad=join(home,'bad.yml');writeFileSync(bad,'- insert:\n    - id: bad\n      name: /wisp-missing-adapter.ts\n');childArgv=[...argv,'--patch',bad];}
  const c=new Client(m.node,childArgv,{cwd,env:childEnv});
  save('owned-process',{pid:c.pid,identity:processIdentity(c.pid)});
  const count=()=>{try{return readFileSync(ledger,'utf8').trim().split('\n').filter(Boolean).length;}catch(e){if(e.code==='ENOENT')return 0;throw e;}};
  const sessionId='wisp-'+randomUUID();let receipt;
  try {
    if(scenario==='invalid-overlay'){await assert.rejects(c.request('initialize',{cwd,provider:route.provider,model:route.model}));const exit=await c.join();assert.notEqual(exit.code,0);results.push({scenario,passed:true,nonzeroExit:true,noOrphan:true});continue;}
    if(scenario.startsWith('unknown-')){await assert.rejects(c.request('initialize',{cwd,provider:scenario==='unknown-provider'?'missing':route.provider,model:scenario==='unknown-model'?'missing':route.model}));results.push({scenario,passed:true,...await c.shutdown()});continue;}
    await c.request('initialize',{cwd,provider:route.provider,model:route.model});
    await assert.rejects(c.request('initialize',{cwd,provider:route.provider,model:route.model}));
    await assert.rejects(c.request('wisp/approval.decide',{decision:'allow-once'}));
    const observation=c.observe();
    assert.deepEqual(c.frames.find(f=>f.method==='wisp.inventory')?.params.tools,['wisp_test_effect']);
    if(['eof','sigterm'].includes(scenario)) {
      if(scenario==='eof')c.child.stdin.end();else process.kill(c.pid,'SIGTERM');
      const exit=await c.join();assert.equal(exit.code,0);results.push({scenario,passed:true,exitCode:exit.code,noOrphan:true,...observation});continue;
    }
    const normal=scenario==='normal';
    const text=normal?'Reply with one short friendly greeting. Do not use any tool.':`Call wisp_test_effect exactly once with operation append-test-record and label ${scenario.replaceAll('-','_')}. After the tool result give a short acknowledgment and finish. If denied do not retry.`;
    receipt=await c.request('session/prompt',{sessionId,contentBlocks:[{type:'text',text}]});
    await assert.rejects(c.request('session/prompt',{sessionId,contentBlocks:[{type:'text',text:'second'}]}),/WISP_BUSY/);
    let descriptor,decision;
    if(!normal) {
      descriptor=await c.wait(frames=>frames.find(f=>f.method==='wisp.approval.requested')?.params);
      assert.equal(count(),0);await delay(250);assert.equal(count(),0);
      const fact=c.frames.find(f=>f.method==='session.event'&&f.params.event.type==='tool/call')?.params.event.data;
      assert.equal(descriptor.callId,fact.callId);assert.equal(descriptor.sessionId,sessionId);assert.deepEqual(descriptor.arguments,JSON.parse(fact.arguments));
      const {requestId,actionDigest,...identity}=descriptor;
      const canonical=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}'):JSON.stringify(v);
      assert.equal(actionDigest,createHash('sha256').update(canonical(identity)).digest('hex'));
      decision={requestId,sessionId,callId:descriptor.callId,actionDigest,decision:scenario==='allow'?'allow-once':'deny'};
      if(scenario.endsWith('-pending')) {
        if(scenario==='eof-pending')c.child.stdin.end();else process.kill(c.pid,'SIGTERM');
        const exit=await c.join();assert.equal(exit.code,0);assert.equal(count(),0);
        const {file,records:durable}=readDurableSession(dsh,sessionId);
        save(scenario+'-durable-raw',{file,records:durable});
        const asked=durable.filter(e=>e.type==='approval/asked'),decided=durable.filter(e=>e.type==='approval/decided');
        assert.equal(asked.length,1);assert.equal(decided.length,1,'pending shutdown must persist approval/decided');
        assert.equal(asked[0].data.callId,descriptor.callId);assert.equal(asked[0].data.toolName,descriptor.toolName);
        assert.equal(decided[0].data.id,asked[0].data.id);assert.equal(decided[0].data.outcome,'cancelled');
        const end=durable.find(e=>e.type==='turn/end'&&e.data.turn===descriptor.turn);
        assert.equal(end?.data.reason.kind,'aborted');assert.ok(decided[0].seq>asked[0].seq&&end.seq>decided[0].seq);
        const turn=completedTurn(c.frames,sessionId,receipt.messageId,'aborted');assert.ok(turn,'pending shutdown must converge after turn/end');
        const closed=c.frames.filter(f=>f.method==='wisp.approval.closed');assert.equal(closed.length,1);
        assert.equal(closed[0].params.requestId,descriptor.requestId);assert.equal(closed[0].params.outcome,'cancelled');
        results.push({scenario,passed:true,exitCode:0,noOrphan:true,effects:0,durableTurn:true,durableApprovalPair:true,approvalOutcome:'cancelled',turnReason:turn.reason,postTurnIdle:true,...observation});continue;
      }
      if(scenario==='cancel')await c.request('wisp/session.cancel',{sessionId});else await c.request('wisp/approval.decide',decision);
    }
    const turn=await c.wait(frames=>completedTurn(frames,sessionId,receipt.messageId,scenario==='cancel'?'aborted':'completed'));
    const calls=c.frames.filter(f=>f.method==='session.event'&&f.params.event.type==='tool/call');assert.equal(calls.length,normal?0:1);
    assert.equal(count(),scenario==='allow'?1:0);
    if(decision)await assert.rejects(c.request('wisp/approval.decide',{...decision,decision:'allow-once'}));
    if(scenario==='allow'){const {requestId,...expected}=descriptor;assert.deepEqual(JSON.parse(readFileSync(ledger,'utf8')),expected);}
    const shutdown=await c.shutdown();
    const {file,records:durable}=readDurableSession(dsh,sessionId);
    save(scenario+'-durable-raw',{file,records:durable});
    const end=durable.find(e=>e.type==='turn/end'&&e.data.turn===turn.turn);
    assert.equal(end?.data.reason.kind,turn.reason);
    if(!normal){
      const asked=durable.filter(e=>e.type==='approval/asked'),decided=durable.filter(e=>e.type==='approval/decided');
      assert.equal(asked.length,1);assert.equal(decided.length,1);
      assert.equal(asked[0].data.callId,descriptor.callId);assert.equal(asked[0].data.toolName,descriptor.toolName);
      assert.equal(decided[0].data.id,asked[0].data.id);
      const outcome=scenario==='allow'?'allowed-once':scenario==='cancel'?'cancelled':'rejected';
      assert.equal(decided[0].data.outcome,outcome);
      const closed=c.frames.filter(f=>f.method==='wisp.approval.closed');assert.equal(closed.length,1);
      assert.equal(closed[0].params.requestId,descriptor.requestId);assert.equal(closed[0].params.outcome,outcome);
    }
    results.push({scenario,passed:true,live:true,turn:{...turn,text:undefined,nonemptyText:!!turn.text},effects:count(),withheldZero:!normal,durableTurn:true,durableApprovalPair:!normal,...observation,...shutdown});
  } catch(e) {
    if(receipt&&!c.exited){try{await c.request('wisp/session.cancel',{sessionId},10000);await c.wait(f=>f.findLast(x=>x.method==='session.status')?.params.status==='idle',10000);}catch{}}
    save(scenario+'-failure',{category:e.message,stderr:c.stderr});
    throw e;
  } finally {writeFileSync(join(home,'stderr.log'),c.stderr);save(scenario+'-frames-private',c.frames);await c.force();save(a.case,results);}
 }
 console.log(JSON.stringify(results,null,2));
}
