import type { Context } from '@deepseek-ai/cordis';
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol';
import { HarnessSdkJsonRpcServer } from '@deepseek-ai/dsh-sdk-jsonrpc-server';
import { SessionId } from '@deepseek-ai/dsh-session';
import { ApprovalBridge, TOOL, strict } from './approval-bridge.ts';
import { registerEffect } from './test-effect.ts';
export const name='wisp-sdk';
export const inject=['sdkAppStartup','loader','agents','tools','approval'];
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
  let initialized=false,initializing=false,busy=false,sessionId:string|undefined,turnEnded=false,closing=false;
  const bridge=new ApprovalBridge(exec=>busy&&String(exec.agent?.session.id)===sessionId&&ctx.agents.get(SessionId(sessionId!))===exec.agent,(m,p)=>transport.notify(m,p));
  bridge.install(ctx);
  const ledger=process.env.WISP_SPIKE_LEDGER;
  if(!ledger)throw new Error('WISP_LEDGER_REQUIRED');
  registerEffect(ctx,bridge,ledger);
  ctx.on('session/event',(s,e)=>{if(String(s.id)===sessionId&&e.type==='turn/end')turnEnded=true;});
  ctx.on('agent/status',({agent,status})=>{if(String(agent.session.id)===sessionId&&status==='idle'&&turnEnded)busy=false;});
  const failDisposal=():never=>{process.stderr.write('WISP_DISPOSAL_FAILED\n');process.exit(1);};
  installDisposalBarrier(ctx.root.fiber,async()=>{
    closing=true;bridge.cancel();
    const agent=sessionId?ctx.agents.get(SessionId(sessionId)):undefined;
    if(agent){agent.cancel({kind:'user'});await agent.whenIdle();}
    // Session persistence remains attached until the driver has written the
    // cancellation audit and turn/end. Server handle disposal then drains it.
    await server.shutdown();await transport.flush();
  },failDisposal);
  let exitTask:Promise<void>|undefined;
  const exit=()=>exitTask??=(async()=>{
    try {bridge.cancel();await transport.flush();await ctx.root.fiber.dispose();await transport.flush();process.exit(0);}
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
          if(ctx.tools.schemas().map(s=>s.name).sort().join()!==TOOL)throw new Error('WISP_UNEXPECTED_TOOLS');
          const result=await server.handleRequest(method,params);initialized=true;
          transport.notify('wisp.inventory',{tools:ctx.tools.schemas().map(s=>s.name),transport:'stdio'});return result;
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
        try{return await server.handleRequest(method,params);}catch(e){busy=false;throw e;}
      }
      case 'wisp/approval.decide':return bridge.decide(params);
      case 'wisp/session.cancel': {
        strict(params,['sessionId']);
        if(!busy||params.sessionId!==sessionId)throw new Error('WISP_NO_ACTIVE_SESSION');
        bridge.cancel(sessionId);ctx.agents.get(SessionId(sessionId!))?.cancel({kind:'user'});return {cancellationRequested:true};
      }
      case 'shutdown': {
        if(params&&Object.keys(params).length)throw new Error('WISP_INVALID_PARAMS');
        closing=true;bridge.cancel();
        try {const result=await server.handleRequest(method,params);setImmediate(()=>void exit());return result;}
        catch {setImmediate(()=>process.exit(1));throw new Error('WISP_DISPOSAL_FAILED');}
      }
      default:throw new Error('WISP_UNKNOWN_METHOD');
    }
  });
  ctx.effect(()=>{transport.start();return async()=>{closing=true;bridge.cancel();await server.shutdown();await transport.flush();transport.close();};},'wisp.stdio');
}
