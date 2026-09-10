import { randomUUID } from 'node:crypto';
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { SessionId } from '@deepseek-ai/dsh-session';
import { ToolCallId, createToolResultMessage } from '@deepseek-ai/dsh-llm';

/** Deterministic native queue fixture: real registry/agent/audit; no model inference. */
export class QueueVerification {
  owned?:Agent;
  private controller?:AbortController;
  private task?:Promise<any>;
  constructor(private ctx:Context){ctx.on('tools/change',()=>this.cancel());}
  start() {
    if(process.env.WISP_PERMISSION_FIXTURES!=='1'||this.task)throw Error('WISP_QUEUE_UNAVAILABLE');
    this.controller=new AbortController();const task=this.run(this.controller.signal);this.task=task;
    return task.finally(()=>{this.task=undefined;this.controller=undefined;});
  }
  private async run(signal:AbortSignal) {
    const handle=await this.ctx.agents.create({sessionId:SessionId('wisp-queue-'+randomUUID()),meta:{cwd:process.cwd()},signal});
    const agent=handle.agent;this.owned=agent;const session=agent.session;
    try {
      session.append('turn/start',{turn:1});session.append('step/start',{turn:1,step:1});
      const calls=['wisp_permission_check','wisp_plugin_check'].map((name,i)=>({name,callId:ToolCallId('queue-'+i),arguments:{label:i===0?'queuefirst':'queuesecond'}}));
      for(const call of calls)session.append('tool/call',{turn:1,step:1,...call,arguments:JSON.stringify(call.arguments)});
      const results=await Promise.all(calls.map(async call=>{
        const result=await this.ctx.tools.execute({...call,agent,signal});
        session.append('tool/result',{turn:1,step:1,message:createToolResultMessage({callId:call.callId,content:result.content,isError:result.isError})},{surfaceOp:'append'});return result;
      }));
      session.append('step/end',{turn:1,step:1});session.append('turn/end',{turn:1,reason:signal.aborted?{kind:'aborted',reason:{kind:'user'}}:{kind:'completed'}});
      return {deterministicRegistryFixture:true,modelCalls:0,completed:results.length,allowed:results.filter(r=>!r.isError).length};
    }finally{this.owned=undefined;await handle.dispose();}
  }
  cancel(){this.controller?.abort();}
  async quiesce(){this.cancel();await this.task?.catch(()=>{});}
}
