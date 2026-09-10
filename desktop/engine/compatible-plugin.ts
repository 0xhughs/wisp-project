import type { Context } from '@deepseek-ai/cordis';
import { registerFixture } from './permission-fixtures.ts';
import type { PermissionPolicy } from './approval-policy.ts';
declare module '@deepseek-ai/cordis' { interface Context { wispPermissions:PermissionPolicy } }
export const name='wisp-compatible-plugin';
export const inject=['tools','wispPermissions'];
const noteRe=/^[A-Za-z0-9_-]{1,40}$/;
export function apply(ctx:Context,config:unknown) {
  if(config!==undefined&&config!==null){
    if(typeof config!=='object'||Array.isArray(config)||Object.keys(config).sort().join()!=='note'||typeof (config as any).note!=='string'||((config as any).note!==''&&!noteRe.test((config as any).note)))throw Error('WISP_PLUGIN_CONFIG');
  }
  const note=config&&typeof config==='object'?String((config as any).note||''):'';
  const ledger=process.env.WISP_COMPATIBLE_LEDGER;if(!ledger)throw Error('WISP_LEDGER_REQUIRED');
  const extra=note?[{label:'Plugin note',value:note}]:[];
  registerFixture(ctx,ctx.wispPermissions,'wisp-compatible-plugin',ledger,extra);
}
