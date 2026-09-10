import { createHash } from 'node:crypto';
import { QueueVerification } from './queue-verification.ts';
import { CompatibleVerification } from './compatible-verification.ts';
import { ChildVerification } from './child-verification.ts';
import type { Context } from '@deepseek-ai/cordis';
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol';
import { HarnessSdkJsonRpcServer } from '@deepseek-ai/dsh-sdk-jsonrpc-server';
import { SessionId } from '@deepseek-ai/dsh-session';
import { PermissionPolicy, strict } from './approval-policy.ts';
import { registerFixture } from './permission-fixtures.ts';
import { registerSafeActions, createOpenBroker } from './safe-action-tools.ts';
function pluginSnapshotFromEnv() {
  const raw=process.env.WISP_PLUGIN_SNAPSHOT;
  if(!raw)return {version:1 as const,catalogId:'wisp-compatible-plugin',enabled:false,config:{note:''},revision:''};
  const o=JSON.parse(raw);
  if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join()!=='catalogId,config,enabled,revision,version'||o.version!==1||o.catalogId!=='wisp-compatible-plugin'||typeof o.enabled!=='boolean'||typeof o.revision!=='string'||(o.revision!==''&&!/^[a-f0-9]{64}$/.test(o.revision))||!o.config||typeof o.config!=='object'||Array.isArray(o.config)||Object.keys(o.config).join()!=='note'||typeof o.config.note!=='string'||(o.config.note!==''&&!/^[A-Za-z0-9_-]{1,40}$/.test(o.config.note)))throw Error('WISP_PLUGIN_SNAPSHOT');
  if(o.enabled&&!o.revision)throw Error('WISP_PLUGIN_SNAPSHOT');
  return o as {version:1;catalogId:'wisp-compatible-plugin';enabled:boolean;config:{note:string};revision:string};
}
function pluginInventoryPayload(tools:string[]) {
  const snap=pluginSnapshotFromEnv(),has=tools.includes('wisp_compatible_check');
  if(snap.enabled){if(!has)throw Error('WISP_INVENTORY');}
  else if(has)throw Error('WISP_INVENTORY');
  return {tools,transport:'stdio',plugins:snap.enabled?[{id:'wisp-compatible-plugin',revision:snap.revision,tools:['wisp_compatible_check'],configDigest:createHash('sha256').update(JSON.stringify({note:snap.config.note})).digest('hex')}]:[]};
}
export const name='wisp-product-sdk';
export const inject=['sdkAppStartup','loader','agents','tools','approval','subagents'];
// Pinned Cordis has concurrent effect teardown and no pre-disposal hook. The
// CLI and SDK EOF handlers look up this own function at call time. Interpose
// only this process's root entry; never alter upstream files or prototypes.
export function installDisposalBarrier(root:{readonly dispose:()=>Promise<void>},quiesce:()=>Promise<void>,fail:()=>never,deadline=4000) {
  const original=root.dispose.bind(root);
  let task:Promise<void>|undefined;
  const dispose=()=>task??=(async()=>{
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      await Promise.race([
        Promise.resolve().then(quiesce).then(original),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('WISP_DISPOSAL_TIMEOUT')),deadline);}),
      ]);
    } catch {fail();}
    finally {clearTimeout(timer);}
  })();
  Object.defineProperty(root,'dispose',{value:dispose,configurable:true,writable:true});
  return dispose;
}
export function apply(ctx:Context) {
  const transport=new JsonRpcLineTransport(process.stdin,process.stdout);
  const server=new HarnessSdkJsonRpcServer(ctx,transport,{maxTokensAsSuccess:false});
  let lastPromptId:string|undefined;
  let initialized=false,initializing=false,busy=false,sessionId:string|undefined,turnEnded=false,closing=false;
  const companionId=process.env.WISP_COMPANION_ID,generation=process.env.WISP_ENGINE_GENERATION;
  const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if(!companionId||!generation||!uuid.test(companionId)||!uuid.test(generation))throw Error('WISP_IDENTITY');
  const queue=new QueueVerification(ctx);
  const compatible=new CompatibleVerification(ctx);
  const children=new ChildVerification(ctx,()=>sessionId?ctx.agents.get(SessionId(sessionId)):undefined,(m,p)=>transport.notify(m,p));
  const bridge=new PermissionPolicy(ctx,{companionId,generation},exec=>busy&&!!exec.agent&&(String(exec.agent.session.id)===sessionId||children.owned.has(exec.agent)||queue.owned===exec.agent||compatible.owned===exec.agent)&&ctx.agents.get(exec.agent.session.id)===exec.agent,(m,p)=>transport.notify(m,p));
  bridge.install();
  ctx.provide('wispPermissions',bridge);
  const opens=createOpenBroker({notify:(m,p)=>transport.notify(m,p)});
  registerSafeActions(ctx,bridge,{requestOpen:req=>opens.request(req)});
  if(process.env.WISP_PERMISSION_FIXTURES==='1') {
    const ledger=process.env.WISP_PERMISSION_LEDGER;if(!ledger)throw Error('WISP_LEDGER_REQUIRED');
    registerFixture(ctx,bridge,'wisp-direct',ledger);
  }
  ctx.on('session/event',(s,e)=>{if(String(s.id)===sessionId&&e.type==='turn/end')turnEnded=true;});
  ctx.on('agent/status',({agent,status})=>{if(String(agent.session.id)===sessionId&&status==='idle'&&turnEnded)busy=false;});
  const failDisposal=():never=>{process.stderr.write('WISP_DISPOSAL_FAILED\n');process.exit(1);};
  installDisposalBarrier(ctx.root.fiber,async()=>{
    closing=true;bridge.cancel();opens.cancel();children.cancel();queue.cancel();compatible.cancel();
    const agent=sessionId?ctx.agents.get(SessionId(sessionId)):undefined;
    if(agent){agent.cancel({kind:'user'});await agent.whenIdle();}
    // Session persistence remains attached until the driver has written the
    // cancellation audit and turn/end. Server handle disposal then drains it.
    await children.quiesce();await queue.quiesce();await compatible.quiesce();await server.shutdown();await transport.flush();
  },failDisposal);
  let exitTask:Promise<void>|undefined;
  const exit=()=>exitTask??=(async()=>{
    try {bridge.cancel();opens.cancel();await transport.flush();await ctx.root.fiber.dispose();await transport.flush();process.exit(0);}
    catch {process.stderr.write('WISP_DISPOSAL_FAILED\n');process.exit(1);}
  })();
  transport.onRequest(async(method,params)=>{
    if(closing&&method!=='shutdown')throw new Error('WISP_CLOSING');
    switch(method) {
      case 'initialize': {
        strict(params,['cwd','provider','model']);
        if(initialized||initializing)throw new Error('WISP_ALREADY_INITIALIZED');
        if(Object.values(params).some(v=>typeof v!=='string'||!v))throw new Error('WISP_INVALID_PARAMS');
        if(params.cwd!==process.cwd())throw new Error('WISP_INVALID_WORKSPACE');
        initializing=true;
        try {
          await ctx.get('loader')?.await();
          bridge.seal();
          const result=await server.handleRequest(method,params);initialized=true;
          transport.notify('wisp.inventory',pluginInventoryPayload(ctx.tools.schemas().map(s=>s.name)));return result;
        } finally {initializing=false;}
      }
      case 'session/prompt': {
        strict(params,['sessionId','contentBlocks']);
        if(!initialized)throw new Error('WISP_NOT_INITIALIZED');
        if(busy)throw new Error('WISP_BUSY');
        if(typeof params.sessionId!=='string'||!/^wisp-[a-zA-Z0-9-]{1,70}$/.test(params.sessionId)||sessionId&&params.sessionId!==sessionId)throw new Error('WISP_UNOWNED_SESSION');
        if(!Array.isArray(params.contentBlocks)||params.contentBlocks.length!==1)throw new Error('WISP_INVALID_PROMPT');
        strict(params.contentBlocks[0],['type','text']);
        if(params.contentBlocks[0].type!=='text'||typeof params.contentBlocks[0].text!=='string'||!params.contentBlocks[0].text||params.contentBlocks[0].text.length>4000)throw new Error('WISP_INVALID_PROMPT');
        sessionId=params.sessionId;busy=true;turnEnded=false;
        try{const result=await server.handleRequest(method,params) as {messageId:string};lastPromptId=result.messageId;return result;}catch(e){busy=false;throw e;}
      }
      case 'wisp/verification.queue': {
        if(params&&Object.keys(params).length||!initialized||busy)throw Error('WISP_QUEUE_UNAVAILABLE');
        busy=true;try{return await queue.start();}finally{busy=false;}
      }
      case 'wisp/verification.compatible': {
        if(params&&Object.keys(params).length||!initialized||busy)throw Error('WISP_QUEUE_UNAVAILABLE');
        busy=true;try{return await compatible.start();}finally{busy=false;}
      }
      case 'wisp/verification.child': {
        strict(params,['provider']);
        if(!initialized||busy||!sessionId||!['spawn','fork'].includes(String(params.provider)))throw Error('WISP_CHILD_UNAVAILABLE');
        busy=true;try{return await children.start(params.provider as 'spawn'|'fork');}finally{busy=false;}
      }
      case 'wisp/approval.decide': {
        const result=bridge.decide(params);
        if((params as any).decision==='cancel'){bridge.cancel();opens.cancel();queue.cancel();compatible.cancel();children.cancel();if(sessionId)ctx.agents.get(SessionId(sessionId))?.cancel({kind:'user'});}
        return result;
      }
      case 'wisp/voice.cancel': {
        strict(params,['sessionId','messageId']);
        if(!initialized||params.sessionId!==sessionId||!lastPromptId||params.messageId!==lastPromptId)throw Error('WISP_UNOWNED_VOICE');
        const agent=ctx.agents.get(SessionId(sessionId!));
        if(!agent)throw Error('WISP_UNOWNED_VOICE');
        if(busy){bridge.cancel();opens.cancel();children.cancel();queue.cancel();compatible.cancel();agent.cancel({kind:'user'});}
        await agent.whenIdle();
        return {settled:true,messageId:lastPromptId};
      }
      case 'wisp/session.cancel': {
        strict(params,['sessionId']);
        if(!busy||params.sessionId!==sessionId)throw new Error('WISP_NO_ACTIVE_SESSION');
        bridge.cancel();opens.cancel();children.cancel();queue.cancel();compatible.cancel();ctx.agents.get(SessionId(sessionId!))?.cancel({kind:'user'});return {cancellationRequested:true};
      }
      case 'shutdown': {
        if(params&&Object.keys(params).length)throw new Error('WISP_INVALID_PARAMS');
        closing=true;bridge.cancel();opens.cancel();
        try {const result=await server.handleRequest(method,params);setImmediate(()=>void exit());return result;}
        catch {setImmediate(()=>process.exit(1));throw new Error('WISP_DISPOSAL_FAILED');}
      }
      case 'wisp/open.complete': {
        if(!initialized)throw new Error('WISP_NOT_INITIALIZED');
        return opens.complete(params);
      }
      default:throw new Error('WISP_UNKNOWN_METHOD');
    }
  });
  ctx.effect(()=>{transport.start();return async()=>{closing=true;bridge.cancel();opens.cancel();await children.quiesce();await queue.quiesce();await compatible.quiesce();await server.shutdown();await transport.flush();transport.close();};},'wisp.stdio');
}
