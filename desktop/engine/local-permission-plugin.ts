import type { Context } from '@deepseek-ai/cordis';
import { registerFixture } from './permission-fixtures.ts';
import type { PermissionPolicy } from './approval-policy.ts';
declare module '@deepseek-ai/cordis' { interface Context { wispPermissions:PermissionPolicy } }
export const name='wisp-local-permission-plugin';
export const inject=['tools','wispPermissions'];
export function apply(ctx:Context) {
  if(process.env.WISP_PERMISSION_FIXTURES!=='1'||!process.env.WISP_PERMISSION_LEDGER)throw Error('WISP_FIXTURES_DISABLED');
  registerFixture(ctx,ctx.wispPermissions,'wisp-local-plugin',process.env.WISP_PERMISSION_LEDGER+'.plugin');
}
