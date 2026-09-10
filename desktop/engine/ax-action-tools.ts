import type { Context } from '@deepseek-ai/cordis';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { PermissionPolicy } from './approval-policy.ts';
import {
  SOURCE,
  describeFocusWindow,
  describeMoveWindow,
  describeReadFocused,
  describeClickNamed,
  describeTypeNamed,
  describeFindNamed,
  revalidateGrantedAx,
  createAxBroker,
} from './ax-actions.mjs';

function spoken(detail: string) {
  return Promise.resolve(detail);
}

export function registerAxActions(ctx: Context, policy: PermissionPolicy, options: {
  driver?: {perform: (request: {operation: string; destination: string; arguments: Record<string, string>}) => {outcome?: string; detail: string}};
  requestAx?: (req: {operation: string; destination: string; descriptor: any; arguments: Record<string, string>}) => Promise<{detail?: string}>;
} = {}) {
  const driver = options.driver;
  const requestAx = options.requestAx;

  const body = (name: string, describe: (args: any) => {operation: string; destination: string}, args: Record<string, string>, exec: any) => {
    const descriptor = policy.consume(exec);
    const action = revalidateGrantedAx(describe(args).operation, descriptor.destination, args);
    const payload = {operation: action.operation, destination: action.destination, arguments: args};
    if (driver) {
      const result = driver.perform(payload);
      return spoken(result.detail);
    }
    if (!requestAx) throw Error('WISP_AX_UNAVAILABLE');
    return Promise.resolve(requestAx({operation: action.operation, destination: action.destination, descriptor, arguments: args})).then(result => result?.detail || action.operation);
  };

  const focus = defineTool({
    name: 'wisp_ax_focus_window',
    isConcurrencySafe: () => true,
    description: 'Raise and focus the Wisp Accessibility Fixture window after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Never target other applications.',
    parameters: {title: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return body('wisp_ax_focus_window', describeFocusWindow, args as Record<string, string>, exec); },
  });
  const move = defineTool({
    name: 'wisp_ax_move_window',
    isConcurrencySafe: () => true,
    description: 'Nudge the Wisp Accessibility Fixture window by a small point delta after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation.',
    parameters: {title: {type: 'string', required: true}, dx: {type: 'string', required: true}, dy: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return body('wisp_ax_move_window', describeMoveWindow, args as Record<string, string>, exec); },
  });
  const read = defineTool({
    name: 'wisp_ax_read_focused',
    isConcurrencySafe: () => true,
    description: 'Read a bounded snapshot of focus inside the Wisp Accessibility Fixture after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Never report other applications.',
    parameters: {},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return body('wisp_ax_read_focused', describeReadFocused, args as Record<string, string>, exec); },
  });
  const click = defineTool({
    name: 'wisp_ax_click_named',
    isConcurrencySafe: () => true,
    description: 'Press the unique Fixture Button on the Wisp Accessibility Fixture after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation.',
    parameters: {name: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return body('wisp_ax_click_named', describeClickNamed, args as Record<string, string>, exec); },
  });
  const type = defineTool({
    name: 'wisp_ax_type_named',
    isConcurrencySafe: () => true,
    description: 'Set Fixture Field on the Wisp Accessibility Fixture to the granted text after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Do not synthesize key events.',
    parameters: {name: {type: 'string', required: true}, text: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return body('wisp_ax_type_named', describeTypeNamed, args as Record<string, string>, exec); },
  });
  const find = defineTool({
    name: 'wisp_ax_find_named',
    isConcurrencySafe: () => true,
    description: 'Search the Wisp Accessibility Fixture tree for one exact name after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Never press or type.',
    parameters: {name: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return body('wisp_ax_find_named', describeFindNamed, args as Record<string, string>, exec); },
  });

  ctx.tools.register(focus); policy.admit(focus, {source: SOURCE, revision: '1', describe: describeFocusWindow});
  ctx.tools.register(move); policy.admit(move, {source: SOURCE, revision: '1', describe: describeMoveWindow});
  ctx.tools.register(read); policy.admit(read, {source: SOURCE, revision: '1', describe: describeReadFocused});
  ctx.tools.register(click); policy.admit(click, {source: SOURCE, revision: '1', describe: describeClickNamed});
  ctx.tools.register(type); policy.admit(type, {source: SOURCE, revision: '1', describe: describeTypeNamed});
  ctx.tools.register(find); policy.admit(find, {source: SOURCE, revision: '1', describe: describeFindNamed});
  return {driver};
}

export {createAxBroker, SOURCE};
