import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SubagentRun } from '@deepseek-ai/dsh-subagent';
import { SessionSeq } from '@deepseek-ai/dsh-session';

/** Developer-only fixture using the real retained spawn/fork providers. No grant forwarding. */
export class ChildVerification {
  readonly owned=new Set<Agent>();
  private starting=false;
  private activeTask?:Promise<any>;
  private disposal?:Promise<void>;
  private run?:SubagentRun;
  private controller?:AbortController;
  constructor(private ctx:Context,private root:()=>Agent|undefined,private notify:(method:string,params:any)=>void) {
    ctx.on('subagent/start',info=>{
      if(!this.starting)return;
      const child=ctx.agents.get(info.id),parent=this.root();
      if(child&&parent&&child.session.header.parentSession===parent.session.id) {
        this.owned.add(child);this.notify('wisp.child.started',{sessionId:String(child.session.id),provider:info.provider});
      }
    });
  }
  start(provider:'spawn'|'fork') {
    if(this.activeTask)throw Error('WISP_CHILD_BUSY');
    const task=this.performStart(provider);this.activeTask=task;
    return task.finally(()=>{if(this.activeTask===task)this.activeTask=undefined;});
  }
  private async performStart(provider:'spawn'|'fork') {
    const parent=this.root();
    if(process.env.WISP_PERMISSION_FIXTURES!=='1'||!parent||parent.options.provider!=='wisp-ollama'||this.run||this.starting)throw Error('WISP_CHILD_UNAVAILABLE');
    this.controller=new AbortController();this.starting=true;
    try {
      this.run=await this.ctx.subagents.start(provider,{parent,signal:this.controller.signal,prompt:[{type:'text',text:'Call wisp_permission_check exactly once with label childverification. This is a harmless developer test. Never retry after denial. Then answer done.'}]});
      const child=this.ctx.agents.get(this.run.id);
      if(!child||!this.owned.has(child))throw Error('WISP_CHILD_OWNERSHIP');
      const result=await this.run.result;
      const liveStart=Number(child.session.firstLiveSeq);
      const events=Array.from({length:child.session.seq-liveStart},(_,i)=>child.session.eventAt(SessionSeq(i+liveStart)));
      return {provider,liveStart,stopReason:result.stopReason,never:this.ctx.approval.effectivePolicy(child.session)==='never',parentSessionMatches:child.session.header.parentSession===parent.session.id,toolCalls:events.filter(e=>e?.type==='tool/call').length,asked:events.filter(e=>e?.type==='approval/asked').length,outcomes:events.filter(e=>e?.type==='approval/decided').map(e=>(e!.data as any).outcome),sessionId:String(child.session.id)};
    } finally {this.starting=false;await this.dispose();}
  }
  cancel(){this.controller?.abort();for(const child of this.owned)child.cancel({kind:'parent'});}
  async quiesce(){this.cancel();await this.activeTask?.catch(()=>{});await this.dispose();}
  private dispose():Promise<void>{
    return this.disposal ??= (async()=>{
      this.cancel();const run=this.run;this.run=undefined;if(run)await run.dispose();
      for(const child of this.owned){await child.whenIdle();if(this.ctx.agents.get(child.session.id)===child)throw Error('WISP_CHILD_NOT_RELEASED');}
      this.owned.clear();this.controller=undefined;
    })().finally(()=>{this.disposal=undefined;});
  }
}
