import { openSync, closeSync, fstatSync, writeSync, constants } from 'node:fs';
import type { Context } from '@deepseek-ai/cordis';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { PermissionPolicy, strict } from './approval-policy.ts';

/** Developer-only harmless effect, opened once in the launch-owned private directory. */
export function registerFixture(ctx:Context,policy:PermissionPolicy,source:'wisp-direct'|'wisp-local-plugin',ledger:string) {
  const fd=openSync(ledger,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  const original=fstatSync(fd);
  if(!original.isFile()||original.nlink!==1||original.uid!==process.getuid?.()) {closeSync(fd);throw Error('WISP_LEDGER_OWNERSHIP');}
  ctx.effect(()=>()=>closeSync(fd));
  const name=source==='wisp-direct'?'wisp_permission_check':'wisp_plugin_check';
  const validate=(args:any)=>{
    strict(args,['label']);
    if(typeof args.label!=='string'||!/^[A-Za-z0-9_-]{1,40}$/.test(args.label))throw Error('WISP_FIXTURE_ARGUMENT');
    return {operation:'append-test-record',destination:ledger,fields:[{label:'Record label',value:args.label},{label:'Effect',value:'Append one harmless verification record. No user files, accounts or services are changed.'}]};
  };
  const tool=defineTool({name,isConcurrencySafe:()=>true,description:'Developer verification only. Append one harmless record after Wisp asks the user. Call exactly once when explicitly requested. Never retry after denial or cancellation.',parameters:{label:{type:'string',required:true}},output:{schema:{type:'string'},render:()=>[{type:'text',text:'One verification record appended.'}]},
    execute(args,exec){
      const stat=fstatSync(fd);
      if(stat.nlink!==1||stat.ino!==original.ino||stat.dev!==original.dev)throw Error('WISP_LEDGER_CHANGED');
      const d=policy.consume(exec);
      // No await between final grant/signal/ownership check and bounded effect.
      writeSync(fd,JSON.stringify({callId:d.callId,actionDigest:d.actionDigest,label:args.label,source})+'\n');
      return Promise.resolve('One verification record appended.');
    }});
  ctx.tools.register(tool);policy.admit(tool,{source,revision:'1',describe:validate});
}
