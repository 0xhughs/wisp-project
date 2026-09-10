import type { Context } from '@deepseek-ai/cordis';
import { apply as applyMcp } from '@deepseek-ai/dsh-mcp-client';
import type { PermissionPolicy } from './approval-policy.ts';
import { wrapMcpExecute } from './mcp-wrap.mjs';
import {
  validateConnectionInsertConfig,
  publicMcpToolName,
  describeMcpRecord,
  resolveMcpAdapterEnv,
  MCP_SOURCE,
  MCP_RAW_TOOL,
} from './connection-config.mjs';
import { readConnectionSecret } from './connection-secrets.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare module '@deepseek-ai/cordis' { interface Context { wispPermissions: PermissionPolicy } }

export const name = 'wisp-mcp-connection';
export const inject = ['tools', 'wispPermissions'];

export async function apply(ctx: Context, config: unknown) {
  const resolved = validateConnectionInsertConfig(config);
  const ledger = process.env.WISP_MCP_LEDGER;
  if (!ledger) throw Error('WISP_LEDGER_REQUIRED');
  const fixture = join(dirname(fileURLToPath(import.meta.url)), 'mcp-demo-fixture.mjs');
  let secret = '';
  if (resolved.credentialId && process.env.WISP_CONNECTION_SECRET_PATH) {
    secret = readConnectionSecret(process.env.WISP_CONNECTION_SECRET_PATH, resolved.credentialId);
  }
  const env = resolveMcpAdapterEnv({
    credentialId: resolved.credentialId,
    secret,
    sentinel: process.env.WISP_MCP_TEST_SENTINEL,
  });
  await applyMcp(ctx, {
    transport: 'stdio',
    serverName: resolved.serverName,
    command: process.execPath,
    args: [fixture, '--ledger', ledger, ...(process.env.WISP_MCP_EXTRA_TOOL === '1' ? ['--extra-tool'] : []), ...(process.env.WISP_MCP_EMIT_CHANGE === '1' ? ['--emit-change'] : [])],
    env,
    cwd: process.cwd(),
    toolCallTimeoutMs: 60_000,
    failOnStartupError: true,
    reconnect: { enabled: false },
  });
  const publicName = publicMcpToolName(resolved.serverName, MCP_RAW_TOOL);
  const tool = ctx.tools.get(publicName);
  if (!tool || ctx.tools.get(publicName) !== tool) throw Error('WISP_INVENTORY');
  wrapMcpExecute(tool, exec => ctx.wispPermissions.consume(exec));
  if (ctx.tools.get(publicName) !== tool) throw Error('WISP_INVENTORY');
  ctx.wispPermissions.admit(tool, {
    source: MCP_SOURCE,
    revision: '1',
    describe: args => describeMcpRecord(args, ledger, { publicName, note: resolved.note }),
  });
}
