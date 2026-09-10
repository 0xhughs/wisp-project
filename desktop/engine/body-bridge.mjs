import { validateVoice, voiceCompletion, assertVoiceOwner } from './voice-protocol.mjs';
import { productFiles } from './prepare-product.mjs';
import { validateDecision, validateRequest } from './permission-protocol.mjs';
import { validateOpenComplete, validateOpenRequest } from './safe-actions.mjs';
import { bootstrap, profileFor } from './reasoning-config.mjs';
import { readSnapshot } from './memory-schema.mjs';
import { composeOverlay } from './plugin-overlay.mjs';
import { readPluginSnapshot, defaultPluginSnapshot, pluginInventory } from './plugin-config.mjs';
import { readConnectionSnapshot, defaultConnectionSnapshot, connectionInventory } from './connection-config.mjs';
import { Client, completedTurn } from '../../spike/client.mjs';
import { PIN, environment } from '../../spike/prepare.mjs';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, realpathSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export class Lines {
  buffer = '';
  decoder = new TextDecoder('utf-8',{fatal:true});
  push(bytes) {
    this.buffer += this.decoder.decode(bytes,{stream:true});
    if (Buffer.byteLength(this.buffer) > 16384) throw new Error('BODY_FRAME_SIZE');
    const parts = this.buffer.split('\n'); this.buffer = parts.pop();
    return parts.filter(Boolean).map(line => {
      const message = JSON.parse(line);
      if (['voice','voice-cancel'].includes(message?.op)) return validateVoice(message);
      if (message?.op === 'approval') { if(Object.keys(message).sort().join()!=='decision,op')throw Error('BODY_APPROVAL');validateDecision(message.decision);return message; }
      if (message?.op === 'open-complete') { if(Object.keys(message).sort().join()!=='completion,op')throw Error('BODY_OPEN');validateOpenComplete(message.completion);return message; }
      if (message?.op === 'configure') { bootstrap(message); return message; }
      if (!message || Object.keys(message).length !== 1 || !['smoke','recall','test','stop','permission-direct','permission-plugin','permission-pair','permission-queue'].includes(message.op)) throw new Error('BODY_MESSAGE');
      return message;
    });
  }
}
export function denyApproval(descriptor) {
  const {requestId,sessionId,callId,actionDigest} = descriptor;
  if (![requestId,sessionId,callId,actionDigest].every(x => typeof x === 'string' && x)) throw new Error('BODY_APPROVAL');
  return {requestId,sessionId,callId,actionDigest,decision:'deny'};
}
export async function run(argv) {
  const options = {};
  for (let i=0;i<argv.length;i+=2) {
    if (!['--runtime-root','--scratch','--developer','--memory-file','--plugin-file','--connection-file'].includes(argv[i]) || !argv[i+1] || options[argv[i]]) throw new Error('BODY_CONFIG');
    options[argv[i]]=argv[i+1];
  }
  const send = value => { if (!process.stdout.destroyed) process.stdout.write(JSON.stringify(value)+'\n'); };
  let ledger, memory;
  let client, ending, busy=false, ready=false, monitor, failed=false, configured=false, rejectBootstrap;
  let acceptBootstrap;
  const incoming=new Promise((resolve,reject)=>{acceptBootstrap=resolve;rejectBootstrap=reject;});
  incoming.catch(()=>{});
  const bootstrapTimer=setTimeout(()=>rejectBootstrap(Error('MODELS_BOOTSTRAP_TIMEOUT')),5000);
  const sessionId='wisp-'+randomUUID(),permissionGeneration=randomUUID();
  let seen=0,voiceOperation,lastVoice,voiceProvider;
  const voiceIDs=new Set();
  const forwardApprovals=()=>{
    if(!client)return;
    const frames=client.frames.slice(seen);seen=client.frames.length;
    for(const frame of frames) {
      if(frame.method==='wisp.approval.requested'&&!ending)send({event:'approval-request',...validateRequest(frame.params)});
      if(frame.method==='wisp.approval.closed')send({event:'approval-closed',...frame.params});
      if(frame.method==='wisp.open.requested'&&!ending)send({event:'open-request',...validateOpenRequest(frame.params)});
    }
  };
  const finish = (reason='stop') => ending ??= (async () => {
    clearInterval(monitor); clearTimeout(bootstrapTimer); rejectBootstrap(Error('BODY_STOP')); ready=false;
    let clean=false;
    if (client) {
      try { if (!client.exited) { await client.shutdown(); clean=true; } else client.noOrphan(); }
      catch { await client.force(); }
    }
    forwardApprovals();
    send({event:'stopped',reason,clean,noOrphan:true});
    process.stdin.destroy(); process.exitCode=failed?1:0;
  })();
  const fail = async (error) => {
    if (failed || ending) return; failed=true; send({event:'unavailable',category:'runtime-unavailable'}); await finish('failure'); };
  process.on('SIGTERM',()=>void finish('signal')); process.on('SIGINT',()=>void finish('signal'));
  process.stdin.on('end',()=>void finish('eof'));
  process.stdout.on('error',()=>void finish('output-closed'));
  const decoder = new Lines();
  process.stdin.on('data',bytes=>{
    try {
      for (const message of decoder.push(bytes)) {
        if (message.op==='configure') { if(configured||ending)throw Error('MODELS_DUPLICATE');configured=true;acceptBootstrap(bootstrap(message));continue; }
        if(message.op==='approval') {
          if(!ready||ending||message.decision.generation!==permissionGeneration)throw Error('BODY_STALE_APPROVAL');
          void client.request('wisp/approval.decide',message.decision).catch(fail);continue;
        }
        if(message.op==='open-complete') {
          if(!ready||ending||message.completion.generation!==permissionGeneration)throw Error('BODY_STALE_OPEN');
          void client.request('wisp/open.complete',message.completion).catch(fail);continue;
        }
        if (message.op==='stop') { void finish(); continue; }
        if(['voice','voice-cancel'].includes(message.op)) {
          assertVoiceOwner(message,{ready,ending,selected:voiceProvider,generation:permissionGeneration,companionId:memory.companionId});
          const matches=op=>op?.utteranceId===message.utteranceId;
          if(message.op==='voice-cancel') {
            if(matches(lastVoice)&&!voiceOperation){send({...lastVoice,event:'voice-settled',cancelled:true});continue;}
            if(!matches(voiceOperation))throw Error('VOICE_STALE_CANCEL');
            voiceOperation.cancelled=true;
            // Cancellation may precede the prompt receipt; its task waits for it.
            continue;
          }
          if(busy||voiceIDs.has(message.utteranceId)||voiceIDs.size>=1024)throw Error('VOICE_DUPLICATE_OR_BUSY');
          voiceIDs.add(message.utteranceId);busy=true;
          const op=voiceOperation={utteranceId:message.utteranceId,generation:permissionGeneration,companionId:memory.companionId,cancelled:false};
          const meta={utteranceId:op.utteranceId,generation:op.generation,companionId:op.companionId};
          send({...meta,event:'voice-processing'});
          void (async()=>{
            const start=client.frames.length;
            const receipt=await client.request('session/prompt',{sessionId,contentBlocks:[{type:'text',text:message.text}]});
            let cancellation;
            const turn=await client.wait(frames=>{
              if(op.cancelled&&!cancellation)cancellation=client.request('wisp/voice.cancel',{sessionId,messageId:receipt.messageId}).catch(error=>{void fail(error);});
              return voiceCompletion(frames.slice(start),sessionId,receipt.messageId);
            });
            if(cancellation)await cancellation;
            forwardApprovals();if(ending||failed)return;
            if(!op.cancelled&&turn.reason==='completed')send({...meta,event:'voice-result',text:turn.text,messageId:receipt.messageId,turn:turn.turn});
            lastVoice={...meta,messageId:receipt.messageId,turn:turn.turn};voiceOperation=undefined;busy=false;
            send({...meta,event:'voice-settled',cancelled:op.cancelled||turn.reason==='aborted',messageId:receipt.messageId,turn:turn.turn});
          })().catch(async()=>{
            // Unexpected agent failure requires scoped teardown before another input.
            send({...meta,event:'voice-failed',category:'reasoning-unavailable'});await fail();
          });
          continue;
        }

        if (!ready || busy || ending || (message.op!=='test' && options['--developer']!=='true')) throw new Error('BODY_UNAVAILABLE');
        const operation={operation:message.op,operationId:randomUUID(),generation:permissionGeneration};
        busy=true; send({event:'testing',busy:true,...operation});
        void (async()=>{
          if(message.op==='permission-queue'){
            const result=await client.request('wisp/verification.queue',{},120000);
            forwardApprovals();if(ending||failed)return;
            send({event:'permission-test',...result,route:'permission-queue',...operation});busy=false;send({event:'tested',ok:true,...operation});return;
          }
          // Mark BEFORE request: accepted oracle requires buffered-before-receipt events.
          const countEffects=()=>[ledger,ledger+'.plugin'].reduce((n,p)=>n+(existsSync(p)?readFileSync(p,'utf8').trim().split('\n').filter(Boolean).length:0),0);
          const beforeEffects=countEffects();
          const start=client.frames.length;
          const permission=message.op.startsWith('permission-'),tool=message.op==='permission-plugin'?'wisp_plugin_check':'wisp_permission_check';
          const prompt=message.op==='permission-pair' ? 'Call wisp_permission_check with label directpair and wisp_plugin_check with label pluginpair in the same response, exactly once each. These are explicitly requested harmless developer checks. Never retry denied or cancelled tools. Then stop.' : permission ? `Call ${tool} exactly once with label verification. This is an explicitly requested harmless developer permission test. Then stop. Never retry after denial or cancellation.` : undefined;
          const receipt=await client.request('session/prompt',{sessionId,contentBlocks:[{type:'text',text:prompt ?? (message.op==='recall' ? 'What is the saved Wisp verification phrase? Answer only that phrase from your user-managed knowledge. If none is saved, say unknown. Do not use any tool.' : 'Reply with one short friendly greeting. Do not use any tool.')}]});
          const turn=await client.wait(frames=> {const slice=frames.slice(start);const cancelled=slice.some(f=>f.method==='wisp.approval.closed'&&f.params.outcome==='cancelled');return completedTurn(slice,sessionId,receipt.messageId,cancelled?'aborted':'completed');});
          const window=client.frames.slice(start);
          if (!permission && countEffects()!==beforeEffects) throw new Error('BODY_UNEXPECTED_EFFECT');
          if (!permission && window.some(f=>f.method==='session.event' && f.params.event.type==='tool/call')) throw new Error('BODY_UNEXPECTED_TOOL');
          forwardApprovals();if(ending||failed)return;
          send({...operation,event:permission?'permission-test':message.op==='test'?'connection-test':message.op, ...(permission?{route:message.op,effectCount:[ledger,ledger+'.plugin'].reduce((n,p)=>n+(existsSync(p)?readFileSync(p,'utf8').trim().split('\n').filter(Boolean).length:0),0),approvalCount:window.filter(f=>f.method==='wisp.approval.requested').length}: {}),sessionId,pid:client.pid,turn:turn.turn,eventCount:turn.eventCount,nonemptyText:!!turn.text,...(message.op==='recall'?{recallText:turn.text}:{}),effects:countEffects()-beforeEffects,observation:client.observe()});
          busy=false; send({event:'tested',ok:true,...operation});
        })().catch(fail);
      }
    } catch { void fail(); }
  });
  try {
    const root=realpathSync(options['--runtime-root']), m=JSON.parse(readFileSync(join(root,'.wisp-spike.json')));
    const query=(args)=>spawnSync('/usr/bin/git',args,{encoding:'utf8'}).stdout.trim();
    if (m.root!==root || m.pin!==PIN || realpathSync(m.tempAlias)!==join(root,'tmp') || query(['-C',m.source,'rev-parse','HEAD'])!==PIN || query(['-C',m.source,'status','--porcelain','--untracked-files=all'])) throw new Error('BODY_PIN');
    const up=join(root,'upstream');
    if (query(['-C',up,'rev-parse','HEAD'])!==PIN || query(['-C',up,'diff','--name-only','HEAD'])) throw new Error('BODY_PIN');
    const source=resolve(dirname(fileURLToPath(import.meta.url)),'../../spike');
    for (const file of ['wisp-sdk.ts','approval-bridge.ts','test-effect.ts']) {
      // Accepted engine sources must match the prepared external copy byte-for-byte.
      if (!readFileSync(join(source,'engine',file)).equals(readFileSync(join(up,'wisp-spike/engine',file)))) throw new Error('BODY_ENGINE_COPY');
    }
    const product=dirname(fileURLToPath(import.meta.url));
    for(const file of productFiles)if(!readFileSync(join(product,file)).equals(readFileSync(join(up,'wisp-product/engine',file))))throw Error('BODY_PRODUCT_COPY');
    const scratch=realpathSync(options['--scratch']);
    if (!existsSync(join(scratch,'.wisp-owned'))) throw new Error('BODY_ROOT');
    const home=mkdtempSync(join(scratch,'body-')); mkdirSync(join(home,'workspace'),{mode:0o700}); mkdirSync(join(home,'dsh-home'),{mode:0o700}); mkdirSync(join(home,'tmp'),{mode:0o700});
    memory=readSnapshot(options['--memory-file']);
    const plugin=options['--plugin-file']?readPluginSnapshot(options['--plugin-file']):defaultPluginSnapshot();
    const connection=options['--connection-file']?readConnectionSnapshot(options['--connection-file']):defaultConnectionSnapshot();
    let launch=await incoming; clearTimeout(bootstrapTimer); if(ending)return;
    voiceProvider=launch.configuration.selected;
    const route=profileFor(launch.configuration);
    const settings={'llm-pi-ai':{providers:{[route.provider]:route.profile}}};
    writeFileSync(join(home,'dsh-home/settings.yaml'),JSON.stringify(settings),{mode:0o600});
    const patch=join(home,'wisp.patch.yml');
    const memoryPlugin=join(dirname(fileURLToPath(import.meta.url)),'memory-context.mjs');
    writeFileSync(patch,composeOverlay({
      basePatch:readFileSync(join(product,'product.patch.yml'),'utf8'),
      adapterPath:join(up,'wisp-product/engine/product-sdk.ts'),
      memoryPath:memoryPlugin,
      memoryConfig:memory,
      developerPath:options['--developer']==='true'?join(up,'wisp-product/engine/local-permission-plugin.ts'):null,
      compatible:plugin.enabled?{path:join(up,'wisp-product/engine/compatible-plugin.ts'),config:plugin.config,snapshot:plugin}:null,
      mcp:connection.enabled?{path:join(up,'wisp-product/engine/mcp-connection.ts'),config:connection.config,snapshot:connection}:null,
    }),{mode:0o600});
    ledger=join(home,'ledger.jsonl');
    const env={...environment(home,m.pnpm),TSX_TSCONFIG_PATH:join(up,'tsconfig.json'),WISP_COMPANION_ID:memory.companionId,WISP_ENGINE_GENERATION:permissionGeneration,WISP_PLUGIN_SNAPSHOT:JSON.stringify({version:plugin.version,catalogId:plugin.catalogId,enabled:plugin.enabled,config:plugin.config,revision:plugin.revision}),WISP_CONNECTION_SNAPSHOT:JSON.stringify({version:connection.version,catalogId:connection.catalogId,enabled:connection.enabled,config:connection.config,revision:connection.revision}),...(plugin.enabled?{WISP_COMPATIBLE_LEDGER:join(home,'ledger.compatible.jsonl')}:{}),...(connection.enabled?{WISP_MCP_LEDGER:join(home,'ledger.mcp.jsonl')}:{}),...(options['--developer']==='true'?{WISP_PERMISSION_FIXTURES:'1',WISP_PERMISSION_LEDGER:ledger}:{}),[route.profile.apiKeyEnv]:launch.configuration.selected==='local'?'ollama':launch.key};
    launch=undefined;
    client=new Client(m.node,['--import',m.tsx,join(up,'apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch],{cwd:join(home,'workspace'),env});
    delete env.WISP_REASONING_CLOUD_KEY;
    send({event:'owned',pid:client.pid,sessionId});
    monitor=setInterval(()=>{
      if (ending) return;
      if (client.failure || client.exited) { void fail(); return; }
      try {forwardApprovals();}catch {void fail();}
    },20);
    await client.request('initialize',{cwd:join(home,'workspace'),provider:route.provider,model:route.model});
    if (ending) return;
    const notified=client.frames.find(f=>f.method==='wisp.inventory')?.params;
    const inventory=pluginInventory({snapshot:plugin,tools:notified?.tools,transport:notified?.transport||'stdio'});
    const connections=connectionInventory({snapshot:connection,tools:notified?.tools,transport:notified?.transport||'stdio'});
    if(JSON.stringify(notified?.plugins)!==JSON.stringify(inventory.plugins))throw Error('WISP_INVENTORY');
    if(JSON.stringify(notified?.connections||[])!==JSON.stringify(connections.connections))throw Error('WISP_INVENTORY');
    ready=true; send({event:'ready',permissionGeneration,permissionFixtures:options['--developer']==='true',provider:route.provider,model:route.model,pid:client.pid,sessionId,companionId:memory.companionId,memoryRevision:memory.revision,plugins:inventory.plugins,pluginRevision:plugin.revision,connections:connections.connections,connectionRevision:connection.revision,observation:client.observe()});
  } catch (error) { await fail(error); }
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) run(process.argv.slice(2)).catch(()=>{process.exitCode=1;});
