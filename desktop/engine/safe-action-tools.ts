import type { Context } from '@deepseek-ai/cordis';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { PermissionPolicy } from './approval-policy.ts';
import {
  SOURCE,
  describeOpenUrl,
  describeOpenFile,
  describeTellTime,
  revalidateGrantedOpen,
  createClock,
  createOpenBroker,
} from './safe-actions.mjs';

export function registerSafeActions(ctx: Context, policy: PermissionPolicy, options: {
  opener?: {open: (destination: string) => unknown};
  clock?: {read: () => {local: string; iso: string; timeZone: string}};
  requestOpen?: (req: {kind: 'url' | 'file'; destination: string; descriptor: any}) => Promise<unknown>;
} = {}) {
  const clock = options.clock ?? createClock();
  const opener = options.opener;
  const requestOpen = options.requestOpen;

  const openBody = (kind: 'url' | 'file', args: any, exec: any) => {
    const descriptor = policy.consume(exec);
    const destination = revalidateGrantedOpen(kind, descriptor.destination, args);
    if (opener) {
      opener.open(destination);
      return Promise.resolve(kind === 'url'
        ? `Opened ${destination} with the default handler.`
        : `Opened ${destination} for viewing.`);
    }
    if (!requestOpen) throw Error('WISP_OPEN_UNAVAILABLE');
    return Promise.resolve(requestOpen({kind, destination, descriptor})).then(() => kind === 'url'
      ? `Opened ${destination} with the default handler.`
      : `Opened ${destination} for viewing.`);
  };

  const url = defineTool({
    name: 'wisp_open_url',
    isConcurrencySafe: () => true,
    description: 'Open one http or https URL with the default handler after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Never fetch the page. Never use file, javascript, data or helper schemes.',
    parameters: {url: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return openBody('url', args, exec); },
  });
  const file = defineTool({
    name: 'wisp_open_file',
    isConcurrencySafe: () => true,
    description: 'Open one viewable local file with the default handler after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Never execute the file or choose an application.',
    parameters: {path: {type: 'string', required: true}},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(args, exec) { return openBody('file', args, exec); },
  });
  const time = defineTool({
    name: 'wisp_tell_time',
    isConcurrencySafe: () => true,
    description: 'Read this device’s local clock once after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation. Do not guess the time without this tool.',
    parameters: {},
    output: {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: String(value)}]},
    execute(_args, exec) {
      policy.consume(exec);
      const reading = clock.read();
      return Promise.resolve(`Local time: ${reading.local}. ISO-8601: ${reading.iso}. Time zone: ${reading.timeZone}.`);
    },
  });
  ctx.tools.register(url); policy.admit(url, {source: SOURCE, revision: '1', describe: describeOpenUrl});
  ctx.tools.register(file); policy.admit(file, {source: SOURCE, revision: '1', describe: describeOpenFile});
  ctx.tools.register(time); policy.admit(time, {source: SOURCE, revision: '1', describe: describeTellTime});
  return {clock, opener};
}

export {createOpenBroker, SOURCE};
