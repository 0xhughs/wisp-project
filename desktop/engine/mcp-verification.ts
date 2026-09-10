import { randomUUID } from 'node:crypto';
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { SessionId } from '@deepseek-ai/dsh-session';
import { ToolCallId, createToolResultMessage } from '@deepseek-ai/dsh-llm';
import { publicMcpToolName, DEFAULT_SERVER_NAME } from './connection-config.mjs';

/** Deterministic registry fixture for the mounted demonstration MCP tool. No model inference. */
export class McpVerification {
  owned?: Agent;
  private controller?: AbortController;
  private task?: Promise<any>;
  constructor(private ctx: Context) { ctx.on('tools/change', () => this.cancel()); }
  start() {
    const name = publicMcpToolName(DEFAULT_SERVER_NAME);
    if (process.env.WISP_MCP_VERIFY !== '1' || this.task || !this.ctx.tools.get(name)) throw Error('WISP_QUEUE_UNAVAILABLE');
    this.controller = new AbortController();
    const task = this.run(this.controller.signal, name);
    this.task = task;
    return task.finally(() => { this.task = undefined; this.controller = undefined; });
  }
  private async run(signal: AbortSignal, name: string) {
    const handle = await this.ctx.agents.create({ sessionId: SessionId('wisp-mcp-' + randomUUID()), meta: { cwd: process.cwd() }, signal });
    const agent = handle.agent; this.owned = agent; const session = agent.session;
    try {
      session.append('turn/start', { turn: 1 }); session.append('step/start', { turn: 1, step: 1 });
      const call = { name, callId: ToolCallId('mcp-0'), arguments: { label: 'mcpcheck' } };
      session.append('tool/call', { turn: 1, step: 1, ...call, arguments: JSON.stringify(call.arguments) });
      const result = await this.ctx.tools.execute({ ...call, agent, signal });
      session.append('tool/result', { turn: 1, step: 1, message: createToolResultMessage({ callId: call.callId, content: result.content, isError: result.isError }) }, { surfaceOp: 'append' });
      session.append('step/end', { turn: 1, step: 1 }); session.append('turn/end', { turn: 1, reason: signal.aborted ? { kind: 'aborted', reason: { kind: 'user' } } : { kind: 'completed' } });
      return { deterministicRegistryFixture: true, modelCalls: 0, completed: 1, allowed: result.isError ? 0 : 1, tool: name };
    } finally { this.owned = undefined; await handle.dispose(); }
  }
  cancel() { this.controller?.abort(); }
  async quiesce() { this.cancel(); await this.task?.catch(() => {}); }
}
