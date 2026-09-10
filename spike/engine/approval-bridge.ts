import { createHash, randomUUID } from 'node:crypto';
import type { Context } from '@deepseek-ai/cordis';
import type { ToolExecution, PreToolDecision } from '@deepseek-ai/dsh-tools';
import { SessionSeq } from '@deepseek-ai/dsh-session';
import type { ApprovalRequest, ApprovalOutcome } from '@deepseek-ai/dsh-user-approval';

export const TOOL = 'wisp_test_effect';
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value !== null && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
  return JSON.stringify(value);
}
export function strict(value: unknown, fields: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join()!==fields.sort().join()) throw new Error('WISP_INVALID_PARAMS');
}
export function argumentsOf(value: unknown): {operation: 'append-test-record'; label: string} {
  strict(value,['operation','label']);
  if(value.operation!=='append-test-record'||typeof value.label!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(value.label)) throw new Error('WISP_INVALID_ACTION');
  return Object.freeze({operation:value.operation,label:value.label});
}
export type Descriptor = Readonly<{sessionId:string;turn:number;callId:string;toolName:string;arguments:ReturnType<typeof argumentsOf>;destination:'disposable-test-ledger';actionDigest:string}>;
type Captured={descriptor:Descriptor;signal:AbortSignal};
type Pending=Captured & {requestId:string;settle:(outcome:ApprovalOutcome)=>void};
export class ApprovalBridge {
  private captured=new Map<string,Captured>();
  private pending=new Map<string,Pending>();
  private grants=new Map<string,Captured>();
  constructor(private owns:(exec:ToolExecution)=>boolean, private notify:(method:string,params:object)=>void, private deadline=30000) {}
  private key(d:Pick<Descriptor,'sessionId'|'callId'>) {return canonical([d.sessionId,d.callId]);}
  describe(exec:ToolExecution):Descriptor {
    if(exec.name!==TOOL || !exec.agent || !this.owns(exec) || exec.signal.aborted) throw new Error('WISP_UNOWNED_CALL');
    const session=exec.agent.session;
    let fact: {turn:number;callId:string;name:string;arguments:string}|undefined, turn:number|undefined;
    for(let i=session.seq-1;i>=0;i--) {
      const e=session.eventAt(SessionSeq(i));
      if(e?.type==='turn/end') break;
      if(e?.type==='tool/call'&&e.data.callId===exec.callId) {if(fact) throw new Error('WISP_DUPLICATE_CALL');fact=e.data;}
      if(e?.type==='turn/start') {turn=e.data.turn;break;}
    }
    const args=argumentsOf(exec.arguments);
    if(turn===undefined || !fact || fact.turn!==turn || fact.name!==exec.name || canonical(argumentsOf(JSON.parse(fact.arguments)))!==canonical(args)) throw new Error('WISP_CALL_FACT_MISMATCH');
    const identity={sessionId:String(session.id),turn,callId:String(exec.callId),toolName:exec.name,arguments:args,destination:'disposable-test-ledger' as const};
    return Object.freeze({...identity,actionDigest:createHash('sha256').update(canonical(identity)).digest('hex')});
  }
  async preExecute(exec:ToolExecution):Promise<PreToolDecision> {
    try {
      const descriptor=this.describe(exec), key=this.key(descriptor);
      if(this.captured.has(key)||this.grants.has(key)) throw new Error('WISP_DUPLICATE_CALL');
      this.captured.set(key,{descriptor,signal:exec.signal});
      return {kind:'ask',reason:'Append one harmless test record to this isolated run ledger'};
    } catch {return {kind:'deny',reason:'WISP_UNOWNED_OR_INVALID_ACTION'};}
  }
  answer(req:ApprovalRequest):Promise<ApprovalOutcome> {
    const key=this.key({sessionId:String(req.agent.session.id),callId:String(req.callId)}), captured=this.captured.get(key);
    this.captured.delete(key);
    if(!captured || req.toolName!==TOOL || req.signal!==captured.signal) return Promise.resolve('unavailable');
    const {signal,descriptor}=captured;
    if(signal.aborted) return Promise.resolve('cancelled');
    const requestId=randomUUID();
    return new Promise(resolve=>{
      let timer:ReturnType<typeof setTimeout>|undefined, closed=false;
      const settle=(outcome:ApprovalOutcome)=>{
        if(closed)return; closed=true; this.pending.delete(requestId);
        if(timer)clearTimeout(timer);signal.removeEventListener('abort',abort);
        if(outcome==='allowed-once'&&!signal.aborted)this.grants.set(key,captured);
        this.notify('wisp.approval.closed',{requestId,...descriptor,outcome}); resolve(outcome);
      };
      const abort=()=>settle('cancelled');
      this.pending.set(requestId,{...captured,requestId,settle});
      signal.addEventListener('abort',abort,{once:true});
      if(signal.aborted){abort();return;}
      timer=setTimeout(()=>settle('unavailable'),this.deadline);
      this.notify('wisp.approval.requested',{requestId,...descriptor});
    });
  }
  decide(value:unknown) {
    strict(value,['requestId','sessionId','callId','actionDigest','decision']);
    if(!['allow-once','deny'].includes(String(value.decision)))throw new Error('WISP_INVALID_DECISION');
    const p=this.pending.get(String(value.requestId));
    if(!p || ['sessionId','callId','actionDigest'].some(k=>value[k]!==p.descriptor[k as keyof Descriptor]) || p.signal.aborted) throw new Error('WISP_STALE_OR_MISMATCHED_DECISION');
    p.settle(value.decision==='allow-once'?'allowed-once':'rejected');
    return {accepted:true};
  }
  consume(exec:ToolExecution):Descriptor {
    const d=this.describe(exec), key=this.key(d), grant=this.grants.get(key);
    this.grants.delete(key);
    if(!grant || exec.signal.aborted || grant.signal.aborted || canonical(grant.descriptor)!==canonical(d))throw new Error('WISP_NO_GRANT');
    return d;
  }
  cancel(sessionId?:string) {
    for(const p of this.pending.values())if(!sessionId||p.descriptor.sessionId===sessionId)p.settle('cancelled');
    for(const map of [this.captured,this.grants])for(const [key,p] of map)if(!sessionId||p.descriptor.sessionId===sessionId)map.delete(key);
  }
  install(ctx:Context) {
    ctx.on('tools/pre-execute',exec=>this.preExecute(exec));
    ctx.on('approval/request',req=>this.answer(req));
    ctx.tools.guard(exec=>exec.name===TOOL?undefined:'WISP_TOOL_UNAVAILABLE');
  }
}
