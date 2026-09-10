import { it, expect } from 'vitest';
import { Context } from '@deepseek-ai/cordis';
import { Session, SessionId, SessionSeq } from '@deepseek-ai/dsh-session';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { ToolCallId } from '@deepseek-ai/dsh-llm';
import ToolRuntime from '@deepseek-ai/dsh-tools';
import SystemPrompt from '@deepseek-ai/dsh-system-prompt';
import ApprovalService from '@deepseek-ai/dsh-user-approval';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApprovalBridge, TOOL } from '../engine/approval-bridge.ts';
import { registerEffect } from '../engine/test-effect.ts';
async function fixture(deadline=30000,install=true) {
  const ctx=new Context();await ctx.plugin(SystemPrompt);await ctx.plugin(ToolRuntime);await ctx.plugin(ApprovalService);
  const dir=mkdtempSync(join(tmpdir(),'approval-')),ledger=join(dir,'ledger');
  const session=Session.create(SessionId('test-session'));session.append('turn/start',{turn:1});
  // Minimal identity carrier only; Session, ToolRuntime, ApprovalService and Wisp answerer are real.
  const agent={session} as Agent,frames:Array<{method:string;params:any}>=[];
  const bridge=new ApprovalBridge(e=>e.agent===agent,(method,params)=>frames.push({method,params}),deadline);
  if(install)bridge.install(ctx);else ctx.on('tools/pre-execute',async()=>({kind:'ask' as const}));
  registerEffect(ctx,bridge,ledger);
  const count=()=>existsSync(ledger)?readFileSync(ledger,'utf8').trim().split('\n').filter(Boolean).length:0;
  const invoke=(id='call-1',label='test',factLabel=label)=>{
    const controller=new AbortController(),args={operation:'append-test-record',label};
    session.append('tool/call',{turn:1,step:1,callId:ToolCallId(id),name:TOOL,arguments:JSON.stringify({...args,label:factLabel})});
    const result=ctx.tools.execute({callId:ToolCallId(id),name:TOOL,arguments:args,agent,signal:controller.signal});
    return {controller,result};
  };
  const request=async(n=1)=>{for(let i=0;i<100;i++){const requests=frames.filter(f=>f.method==='wisp.approval.requested');if(requests.length>=n)return requests[n-1]!.params;await new Promise(r=>setTimeout(r,1));}throw new Error('missing request');};
  const reply=(p:any,decision='allow-once')=>({requestId:p.requestId,sessionId:p.sessionId,callId:p.callId,actionDigest:p.actionDigest,decision});
  const close=async()=>{bridge.cancel();await ctx.fiber.dispose();rmSync(dir,{recursive:true});};
  return {ctx,session,bridge,frames,ledger,count,invoke,request,reply,close};
}
it('real registry: withhold then deny leaves zero effects and paired service audit',async()=>{const f=await fixture();try{const c=f.invoke(),p=await f.request();expect(f.count()).toBe(0);await new Promise(r=>setTimeout(r,250));expect(f.count()).toBe(0);f.bridge.decide(f.reply(p,'deny'));expect((await c.result).isError).toBe(true);expect(f.count()).toBe(0);const events=Array.from({length:f.session.seq},(_,i)=>f.session.eventAt(SessionSeq(i)));const ask=events.find(e=>e?.type==='approval/asked')!;expect(events.find(e=>e?.type==='approval/decided')).toMatchObject({data:{id:ask.data.id,outcome:'rejected'}});}finally{await f.close();}});
it('allow consumes exactly once; replay fails; same label needs a fresh nonce',async()=>{const f=await fixture();try{const c=f.invoke(),p=await f.request();f.bridge.decide(f.reply(p));expect((await c.result).isError).toBe(false);expect(f.count()).toBe(1);expect(JSON.parse(readFileSync(f.ledger,'utf8'))).toMatchObject({actionDigest:p.actionDigest,callId:p.callId,arguments:p.arguments});expect(()=>f.bridge.decide(f.reply(p))).toThrow();const next=f.invoke('call-2'),p2=await f.request(2);expect(p2.requestId).not.toBe(p.requestId);expect(()=>f.bridge.decide(f.reply(p))).toThrow();f.bridge.decide(f.reply(p2,'deny'));await next.result;expect(f.count()).toBe(1);}finally{await f.close();}});
for(const field of ['requestId','sessionId','callId','actionDigest'])it(`wrong ${field} cannot grant`,async()=>{const f=await fixture();try{const c=f.invoke(),p=await f.request();expect(()=>f.bridge.decide({...f.reply(p),[field]:'wrong'})).toThrow();expect(f.count()).toBe(0);f.bridge.cancel();await c.result;expect(f.count()).toBe(0);}finally{await f.close();}});
it('changed arguments fail before asking',async()=>{const f=await fixture();try{expect((await f.invoke('c','changed','original').result).isError).toBe(true);expect(f.frames).toHaveLength(0);expect(f.count()).toBe(0);}finally{await f.close();}});
it('expiration and missing answerer fail closed',async()=>{for(const install of [true,false]){const f=await fixture(10,install);try{expect((await f.invoke().result).isError).toBe(true);expect(f.count()).toBe(0);}finally{await f.close();}}});
it('cancel before consumption revokes allowed but unconsumed grant',async()=>{const f=await fixture();try{const c=f.invoke(),p=await f.request();f.bridge.decide(f.reply(p));f.bridge.cancel();c.controller.abort();await c.result;expect(f.count()).toBe(0);expect(()=>f.bridge.decide(f.reply(p))).toThrow();}finally{await f.close();}});
it('signal abort closes pending and a late allow fails',async()=>{const f=await fixture();try{const c=f.invoke(),p=await f.request();c.controller.abort();await c.result;expect(f.frames.find(x=>x.method==='wisp.approval.closed')?.params.outcome).toBe('cancelled');expect(()=>f.bridge.decide(f.reply(p))).toThrow();expect(f.count()).toBe(0);}finally{await f.close();}});
it('effect before cancel honestly retains the completed single effect',async()=>{const f=await fixture();try{const c=f.invoke(),p=await f.request();f.bridge.decide(f.reply(p));await c.result;c.controller.abort();f.bridge.cancel();expect(f.count()).toBe(1);}finally{await f.close();}});

import { installDisposalBarrier } from '../engine/wisp-sdk.ts';
it('root barrier keeps persistence attached until quiescence and coalesces disposal',async()=>{
 const ctx=new Context(),events:string[]=[];
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 ctx.effect(()=>()=>{events.push('persistence detached');});
 const dispose=installDisposalBarrier(ctx.fiber,async()=>{events.push('cancel');await pending;events.push('durable turn ended');},()=>{throw new Error('unexpected failure');});
 const first=ctx.fiber.dispose();expect(ctx.fiber.dispose()).toBe(first);expect(dispose()).toBe(first);
 await Promise.resolve();expect(events).toEqual(['cancel']);release();await first;
 expect(events).toEqual(['cancel','durable turn ended','persistence detached']);
 await dispose();expect(events).toHaveLength(3);
});
it('root barrier rejects failed or overdue quiescence without starting root teardown',async()=>{
 for(const mode of ['reject','timeout']) {
  let detached=false,failed=false;const root={dispose:async()=>{detached=true;}};
  const dispose=installDisposalBarrier(root,()=>mode==='reject'?Promise.reject(new Error('private')):new Promise(()=>{}),()=>{failed=true;throw new Error('nonzero exit');},10);
  await expect(dispose()).rejects.toThrow('nonzero exit');expect(failed).toBe(true);expect(detached).toBe(false);
 }
});
