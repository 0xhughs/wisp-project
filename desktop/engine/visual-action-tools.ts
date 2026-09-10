import type { Context } from '@deepseek-ai/cordis';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { PermissionPolicy } from './approval-policy.ts';
import {
  SOURCE,
  VISUAL_TOOL,
  describeClickDrawn,
  revalidateGrantedVisual,
  createVisualBroker,
} from './visual-actions.mjs';

function spoken(detail: string) {
  return Promise.resolve(detail);
}

export function registerVisualActions(ctx: Context, policy: PermissionPolicy, options: {
  driver?: {perform: (request: {operation: string; destination: string; arguments: Record<string, string>}) => {outcome?: string; detail: string}};
  requestVisual?: (req: {operation: string; destination: string; descriptor: any; arguments: Record<string, string>}) => Promise<{detail?: string}>;
} = {}) {
  const driver = options.driver;
  const requestVisual = options.requestVisual;

  const click = defineTool({
    name: VISUAL_TOOL,
    isConcurrencySafe: () => true,
    description: 'Click the unique Drawn Canary drawing inside the Wisp Accessibility Fixture after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Never click Fixture Button or other applications. This is a fallback when Accessibility cannot reach the drawing.',
    parameters: {title: {type: 'string', required: true}, target: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) {
      const descriptor = policy.consume(exec);
      const action = revalidateGrantedVisual(describeClickDrawn(args).operation, descriptor.destination, args as Record<string, string>);
      const payload = {operation: action.operation, destination: action.destination, arguments: args as Record<string, string>};
      if (driver) {
        const result = driver.perform(payload);
        return spoken(result.detail);
      }
      if (!requestVisual) throw Error('WISP_VISUAL_UNAVAILABLE');
      return Promise.resolve(requestVisual({operation: action.operation, destination: action.destination, descriptor, arguments: args as Record<string, string>})).then(result => result?.detail || action.operation);
    },
  });

  ctx.tools.register(click); policy.admit(click, {source: SOURCE, revision: '1', describe: describeClickDrawn});
  return {driver};
}

export {createVisualBroker, SOURCE, VISUAL_TOOL};
