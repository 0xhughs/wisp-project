import { createHash, randomUUID } from 'node:crypto';
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition, ToolExecution, PreToolDecision } from '@deepseek-ai/dsh-tools';
import { SessionSeq } from '@deepseek-ai/dsh-session';
import type { ApprovalRequest, ApprovalOutcome } from '@deepseek-ai/dsh-user-approval';

export function canonical(value: any): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function strict(value: unknown, fields: string[]): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...fields].sort().join()) throw Error('WISP_INVALID_FRAME');
}
export type Action = {operation:string;destination:string;fields:Array<{label:string;value:string}>};
export type Admission = {source:'wisp-direct'|'wisp-local-plugin'|'wisp-compatible-plugin'|'wisp-safe-action'|'wisp-mcp'|'wisp-skill'|'wisp-ax'|'wisp-visual';revision:string;describe:(args:any)=>Action};
export type Descriptor = Action & {version:1;companionId:string;generation:string;sessionId:string;turn:number;callId:string;rootCallId:string;toolName:string;source:string;revision:string;arguments:unknown;actionDigest:string};
type Capture = {exec:ToolExecution;descriptor:Descriptor;signal:AbortSignal};
type Pending = Capture & {requestId:string;settle:(outcome:ApprovalOutcome)=>void};
export function decisionFor(p:Descriptor & {requestId:string},decision:string) {
  return {version:1,generation:p.generation,requestId:p.requestId,sessionId:p.sessionId,callId:p.callId,actionDigest:p.actionDigest,decision};
}

/** Closed admission and ephemeral, execution-token-bound grants. No persisted consent. */
export class PermissionPolicy {
  private admitted=new Map<string,{tool:ToolDefinition;adapter:Admission}>();
  private captured=new Map<string,Capture>();
  private pending=new Map<string,Pending>();
  private grants=new Map<symbol,Capture>();
  private guarded=new Set<symbol>();
  private seen=new Set<string>();
  private sealed=false;
  private invalid=false;
  constructor(private ctx:Context,private identity:{companionId:string;generation:string},private owns:(exec:ToolExecution)=>boolean,private notify:(method:string,params:any)=>void,private deadline=120000) {}
  admit(tool:ToolDefinition,adapter:Admission) {
    if(this.sealed||this.admitted.has(tool.name))throw Error('WISP_ADMISSION_CLOSED');
    // Guard the definition itself against execute/name changes during an ask.
    Object.freeze(tool);Object.freeze(adapter);
    this.admitted.set(tool.name,{tool,adapter});
  }
  seal() { if(!this.inventoryValid())throw Error('WISP_INVENTORY');this.sealed=true; }
  private inventoryValid() {
    return !this.invalid && this.ctx.tools.schemas().map(t=>t.name).sort().join() === [...this.admitted.keys()].sort().join()
      && [...this.admitted].every(([name,a])=>this.ctx.tools.get(name)===a.tool);
  }
  private key(sessionId:string,callId:string) { return canonical([sessionId,callId]); }
  describe(exec:ToolExecution):Descriptor {
    const admission=this.admitted.get(exec.name);
    if(!this.inventoryValid()||!admission||!exec.agent||!this.owns(exec)||exec.signal.aborted||exec.parent!==undefined||exec.rootCallId!==exec.callId||this.ctx.tools.get(exec.name,exec.agent)!==admission.tool)throw Error('WISP_UNAVAILABLE_ACTION');
    const session=exec.agent.session;
    let fact:any,turn:number|undefined;
    for(let i=session.seq-1;i>=0;i--) {
      const event=session.eventAt(SessionSeq(i));
      if(event?.type==='turn/end')break;
      if(event?.type==='tool/call'&&event.data.callId===exec.callId){if(fact)throw Error('WISP_DUPLICATE_FACT');fact=event.data;}
      if(event?.type==='turn/start'){turn=event.data.turn;break;}
    }
    if(turn===undefined||!fact||fact.turn!==turn||fact.name!==exec.name||canonical(JSON.parse(fact.arguments))!==canonical(exec.arguments))throw Error('WISP_ACTION_FACTS');
    const action=admission.adapter.describe(exec.arguments);
    strict(action,['operation','destination','fields']);
    const safeText=(x:unknown,n:number)=>typeof x==='string'&&x.length>0&&x.length<=n&&!/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(x);
    if(!safeText(action.operation,80)||!safeText(action.destination,2048)||!Array.isArray(action.fields)||action.fields.length>12)throw Error('WISP_UNRENDERABLE');
    for(const field of action.fields){strict(field,['label','value']);if(!safeText(field.label,80)||!safeText(field.value,2048))throw Error('WISP_UNRENDERABLE');}
    const value={version:1 as const,...this.identity,sessionId:String(session.id),turn,callId:String(exec.callId),rootCallId:String(exec.rootCallId),toolName:exec.name,source:admission.adapter.source,revision:admission.adapter.revision,arguments:exec.arguments,...action};
    if(Buffer.byteLength(canonical(value))>10000)throw Error('WISP_SCOPE_TOO_LARGE');
    return Object.freeze({...value,actionDigest:createHash('sha256').update(canonical(value)).digest('hex')});
  }
  async preExecute(exec:ToolExecution):Promise<PreToolDecision> {
    try {
      const descriptor=this.describe(exec),key=this.key(descriptor.sessionId,descriptor.callId);
      if(this.seen.has(key)||this.seen.size>=256||this.pending.size+this.captured.size>=8)throw Error('WISP_REQUEST_LIMIT');
      this.seen.add(key);this.captured.set(key,{exec,descriptor,signal:exec.signal});
      return {kind:'ask',reason:'Wisp needs confirmation for this exact action.'};
    } catch { return {kind:'deny',reason:'Wisp cannot safely authorize this action.'}; }
  }
  answer(req:ApprovalRequest):Promise<ApprovalOutcome> {
    const key=this.key(String(req.agent.session.id),String(req.callId)),capture=this.captured.get(key);this.captured.delete(key);
    if(!capture||req.toolName!==capture.descriptor.toolName||req.signal!==capture.signal||req.agent!==capture.exec.agent)return Promise.resolve('unavailable');
    if(req.signal.aborted)return Promise.resolve('cancelled');
    const requestId=randomUUID();
    return new Promise(resolve=>{
      let timer:ReturnType<typeof setTimeout>|undefined,closed=false;
      const settle=(outcome:ApprovalOutcome)=>{
        if(closed)return;closed=true;this.pending.delete(requestId);clearTimeout(timer);capture.signal.removeEventListener('abort',abort);
        if(outcome==='allowed-once'&&!capture.signal.aborted)this.grants.set(capture.exec.token,capture);
        this.notify('wisp.approval.closed',{version:1,generation:this.identity.generation,requestId,sessionId:capture.descriptor.sessionId,callId:capture.descriptor.callId,actionDigest:capture.descriptor.actionDigest,outcome});resolve(outcome);
      };
      const abort=()=>settle('cancelled');
      this.pending.set(requestId,{...capture,requestId,settle});capture.signal.addEventListener('abort',abort,{once:true});
      if(capture.signal.aborted){abort();return;}
      timer=setTimeout(()=>settle('unavailable'),this.deadline);
      this.notify('wisp.approval.requested',{requestId,...capture.descriptor});
    });
  }
  decide(value:unknown) {
    strict(value,['version','generation','requestId','sessionId','callId','actionDigest','decision']);
    if(value.version!==1||!['allow-once','deny','cancel'].includes(value.decision))throw Error('WISP_INVALID_DECISION');
    const p=this.pending.get(value.requestId);
    if(!p||value.generation!==this.identity.generation||['sessionId','callId','actionDigest'].some(k=>value[k]!==p.descriptor[k as keyof Descriptor])||p.signal.aborted)throw Error('WISP_STALE_DECISION');
    if(canonical(this.describe(p.exec))!==canonical(p.descriptor)) {p.settle('unavailable');throw Error('WISP_CHANGED_ACTION');}
    p.settle(value.decision==='allow-once'?'allowed-once':value.decision==='deny'?'rejected':'cancelled');
    return {accepted:true};
  }
  guard(exec:ToolExecution):string|undefined {
    try {
      const p=this.grants.get(exec.token);
      if(!p||p.exec!==exec||p.signal.aborted||canonical(this.describe(exec))!==canonical(p.descriptor))throw Error('WISP_NO_GRANT');
      this.guarded.add(exec.token);return undefined;
    } catch {return 'Wisp did not authorize this exact action.';}
  }
  /** Called synchronously by each admitted body immediately before its effect. */
  consume(exec:ToolExecution):Descriptor {
    const p=this.grants.get(exec.token),guarded=this.guarded.delete(exec.token);this.grants.delete(exec.token);
    if(!guarded||!p||p.exec!==exec||p.signal.aborted||canonical(this.describe(exec))!==canonical(p.descriptor))throw Error('WISP_NO_GRANT');
    return p.descriptor;
  }
  cancel(sessionId?:string) {
    for(const p of this.pending.values())if(!sessionId||p.descriptor.sessionId===sessionId)p.settle('cancelled');
    for(const map of [this.captured,this.grants])for(const [key,p] of map)if(!sessionId||p.descriptor.sessionId===sessionId){map.delete(key as never);this.guarded.delete(p.exec.token);}
  }
  install() {
    this.ctx.on('tools/pre-execute',exec=>this.preExecute(exec));
    const stopAnswering=this.ctx.on('approval/request',req=>this.answer(req));
    this.ctx.tools.guard(exec=>this.guard(exec));
    this.ctx.on('tools/change',()=>{if(this.sealed){
      this.invalid=true;
      // The registry resolves definitions again at dispatch. Cancel the original
      // owning agent signal as well as grants, so replacement after the guard
      // cannot enter a newly registered body. This pin fuses that caller signal.
      const agents=new Set([...this.captured.values(),...this.pending.values(),...this.grants.values()].map(p=>p.exec.agent));
      this.cancel();for(const agent of agents)agent?.cancel({kind:'user'});
    }});
    this.ctx.on('tools/result',(exec:any)=>{this.grants.delete(exec.token);this.guarded.delete(exec.token);this.captured.delete(this.key(String(exec.agent?.session.id),String(exec.callId)));});
    return stopAnswering;
  }
}
