import { appendFileSync } from 'node:fs';
import type { Context } from '@deepseek-ai/cordis';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { ApprovalBridge, TOOL } from './approval-bridge.ts';
export function registerEffect(ctx:Context, bridge:ApprovalBridge, ledger:string) {
  ctx.tools.register(defineTool({
    name:TOOL,description:'Append exactly one harmless record to the isolated test ledger after explicit approval. Call at most once when requested; after denial do not retry.',
    parameters:{operation:{type:'string',required:true,enum:['append-test-record']},label:{type:'string',required:true}},
    output:{schema:{type:'string'},render:(_args,value)=>[{type:'text',text:value}]},
    execute(_args,exec) {
      // Deliberately synchronous: no yield between final signal/grant validation and effect.
      const descriptor=bridge.consume(exec);
      appendFileSync(ledger,JSON.stringify(descriptor)+'\n',{encoding:'utf8',mode:0o600});
      return Promise.resolve('One test record appended. Do not call the tool again.');
    },
  }));
}
