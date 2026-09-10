import {openSync, closeSync, fstatSync, readSync, realpathSync, constants} from 'node:fs';
import {randomUUID} from 'node:crypto';

export const SOURCE = 'wisp-safe-action';
export const OPEN_DEADLINE_MS = 30000;
export const VIEWER_SUFFIXES = Object.freeze(['.txt', '.md', '.markdown', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.csv', '.json', '.html', '.htm', '.rtf']);
export const DENIED_SUFFIXES = Object.freeze(['.app', '.command', '.tool', '.sh', '.bash', '.zsh', '.exe', '.bin', '.pkg', '.dmg', '.py', '.rb', '.pl']);
export const PRIVILEGED_PREFIXES = Object.freeze(['/etc', '/private/etc', '/System', '/usr', '/bin', '/sbin', '/var', '/private/var', '/dev', '/proc', '/root', '/boot', '/sys', '/Library']);

const unsafe = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
const whitespace = /[\u0000-\u0020\u007f\u202a-\u202e\u2066-\u2069]/;
function exact(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw Error('WISP_INVALID_FRAME');
}
function text(value, max) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && !unsafe.test(value);
}
function id(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}

export function canonicalHttpUrl(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 2048 || whitespace.test(raw)) throw Error('WISP_UNAVAILABLE_ACTION');
  let parsed;
  try { parsed = new URL(raw); } catch { throw Error('WISP_UNAVAILABLE_ACTION'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw Error('WISP_UNAVAILABLE_ACTION');
  if (parsed.username !== '' || parsed.password !== '') throw Error('WISP_UNAVAILABLE_ACTION');
  if (!parsed.hostname) throw Error('WISP_UNAVAILABLE_ACTION');
  const href = parsed.href;
  if (!text(href, 2048)) throw Error('WISP_UNAVAILABLE_ACTION');
  return href;
}

function suffixOf(path) {
  const base = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
  const dot = base.lastIndexOf('.');
  if (dot < 0) return '';
  return base.slice(dot);
}

export function privilegedPath(canonical) {
  if (typeof canonical !== 'string' || !canonical.startsWith('/')) return true;
  if (canonical.includes('/Library/Keychains')) return true;
  return PRIVILEGED_PREFIXES.some(prefix => canonical === prefix || canonical.startsWith(prefix + '/'));
}

export function inspectViewerFile(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.includes('\0') || /^file:/i.test(raw) || unsafe.test(raw) || raw.length > 2048) throw Error('WISP_UNAVAILABLE_ACTION');
  let fd;
  try { fd = openSync(raw, constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch { throw Error('WISP_UNAVAILABLE_ACTION'); }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) throw Error('WISP_UNAVAILABLE_ACTION');
    if (st.mode & 0o111) throw Error('WISP_UNAVAILABLE_ACTION');
    const buf = Buffer.alloc(2);
    const n = readSync(fd, buf, 0, 2, 0);
    if (n >= 2 && buf[0] === 0x23 && buf[1] === 0x21) throw Error('WISP_UNAVAILABLE_ACTION');
    let canonical;
    try { canonical = realpathSync(raw); } catch { throw Error('WISP_UNAVAILABLE_ACTION'); }
    if (typeof canonical !== 'string' || !canonical.startsWith('/') || canonical.length > 2048 || privilegedPath(canonical)) throw Error('WISP_UNAVAILABLE_ACTION');
    const suffix = suffixOf(canonical);
    if (DENIED_SUFFIXES.includes(suffix) || !VIEWER_SUFFIXES.includes(suffix)) throw Error('WISP_UNAVAILABLE_ACTION');
    return canonical;
  } finally { closeSync(fd); }
}

export function describeOpenUrl(args) {
  exact(args, ['url']);
  const destination = canonicalHttpUrl(args.url);
  const fields = [{label: 'Effect', value: 'Open this http(s) address with the default handler after Allow Once. Wisp will not fetch the page or run a command.'}];
  if (args.url !== destination) fields.unshift({label: 'Requested URL', value: args.url}, {label: 'Canonical URL', value: destination});
  else fields.unshift({label: 'URL', value: destination});
  return {operation: 'open-http-url', destination, fields};
}

export function describeOpenFile(args) {
  exact(args, ['path']);
  const destination = inspectViewerFile(args.path);
  const fields = [{label: 'Effect', value: 'Open this file for viewing with the default handler after Allow Once. Wisp will not execute it or pass extra arguments.'}];
  if (args.path !== destination) fields.unshift({label: 'Requested path', value: args.path}, {label: 'Resolved path', value: destination});
  else fields.unshift({label: 'Path', value: destination});
  return {operation: 'open-local-file-for-viewing', destination, fields};
}

export function describeTellTime(args) {
  exact(args, []);
  return {
    operation: 'read-local-clock',
    destination: 'local-system-clock',
    fields: [
      {label: 'Clock', value: 'Wisp will read this device’s local clock once.'},
      {label: 'Network', value: 'No NTP or network time request is made.'},
    ],
  };
}

export function createRecordingOpener() {
  const calls = [];
  return {
    calls,
    spawned: 0,
    get count() { return calls.length; },
    open(destination) {
      if (typeof destination !== 'string' || !destination) throw Error('WISP_OPEN');
      calls.push(destination);
      return {ok: true};
    },
  };
}

export function createClock(now = () => new Date()) {
  let reads = 0;
  return {
    get reads() { return reads; },
    read() {
      reads += 1;
      const date = now();
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw Error('WISP_CLOCK');
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const local = new Intl.DateTimeFormat(undefined, {dateStyle: 'full', timeStyle: 'long', timeZone}).format(date);
      if (!text(local, 2048) || !text(timeZone, 80)) throw Error('WISP_CLOCK');
      return {local, iso: date.toISOString(), timeZone};
    },
  };
}

export function decideThenEffect({describe, args, decision, effect}) {
  const action = describe(args);
  if (decision !== 'allow-once') return {action, performed: false};
  effect(action);
  return {action, performed: true};
}

export function revalidateGrantedOpen(kind, destination, args) {
  if (kind === 'url') {
    const again = canonicalHttpUrl(args.url);
    if (again !== destination) throw Error('WISP_CHANGED_ACTION');
    return again;
  }
  if (kind === 'file') {
    const fromArgs = inspectViewerFile(args.path);
    const fromDest = inspectViewerFile(destination);
    if (fromArgs !== destination || fromDest !== destination || fromArgs !== fromDest) throw Error('WISP_CHANGED_ACTION');
    return fromDest;
  }
  throw Error('WISP_UNAVAILABLE_ACTION');
}

export function validateOpenComplete(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('WISP_OPEN_COMPLETE');
  const keys = Object.keys(value).sort().join();
  const short = ['destination', 'generation', 'kind', 'openRequestId', 'outcome', 'version'].sort().join();
  const full = ['actionDigest', 'callId', 'destination', 'generation', 'kind', 'openRequestId', 'outcome', 'sessionId', 'version'].sort().join();
  if (keys !== short && keys !== full) throw Error('WISP_OPEN_COMPLETE');
  if (value.version !== 1 || !id(value.generation) || !id(value.openRequestId) || !['url', 'file'].includes(value.kind) || !text(value.destination, 2048) || !['opened', 'failed'].includes(value.outcome)) throw Error('WISP_OPEN_COMPLETE');
  if (keys === full && !(id(value.sessionId) && id(value.callId) && /^[a-f0-9]{64}$/.test(value.actionDigest))) throw Error('WISP_OPEN_COMPLETE');
  return value;
}

export function validateOpenRequest(value) {
  const keys = ['version', 'generation', 'openRequestId', 'kind', 'destination', 'sessionId', 'callId', 'actionDigest'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw Error('WISP_OPEN_REQUEST');
  if (value.version !== 1 || !['generation', 'openRequestId', 'sessionId', 'callId'].every(k => id(value[k])) || !/^[a-f0-9]{64}$/.test(value.actionDigest) || !['url', 'file'].includes(value.kind) || !text(value.destination, 2048)) throw Error('WISP_OPEN_REQUEST');
  return value;
}

export function createNativeOpenChannel({opener, deadline = OPEN_DEADLINE_MS, revalidate}) {
  const pending = new Map();
  const notifies = [];
  return {
    notifies,
    request({kind, destination, generation, openRequestId}) {
      notifies.push({kind, destination, generation, openRequestId});
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(openRequestId);
          reject(new Error('WISP_OPEN_TIMEOUT'));
        }, deadline);
        pending.set(openRequestId, {resolve, reject, timer, kind, destination, generation});
      });
    },
    complete(value) {
      const p = pending.get(value?.openRequestId);
      if (!p || value.version !== 1 || value.generation !== p.generation || value.kind !== p.kind || value.destination !== p.destination) throw Error('WISP_STALE_OPEN');
      pending.delete(value.openRequestId);
      clearTimeout(p.timer);
      if (value.outcome !== 'opened') {
        p.reject(new Error('WISP_OPEN_FAILED'));
        return {accepted: true};
      }
      const dest = revalidate(p.kind, p.destination);
      opener.open(dest);
      p.resolve({ok: true});
      return {accepted: true};
    },
    cancel() {
      for (const [id, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error('WISP_OPEN_CANCELLED'));
        pending.delete(id);
      }
    },
  };
}

export function createOpenBroker({notify, deadline = OPEN_DEADLINE_MS} = {}) {
  const pending = new Map();
  return {
    request({kind, destination, descriptor}) {
      const openRequestId = randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(openRequestId);
          reject(new Error('WISP_OPEN_TIMEOUT'));
        }, deadline);
        pending.set(openRequestId, {resolve, reject, timer, kind, destination, generation: descriptor.generation});
        notify?.('wisp.open.requested', {
          version: 1,
          generation: descriptor.generation,
          openRequestId,
          kind,
          destination,
          sessionId: descriptor.sessionId,
          callId: descriptor.callId,
          actionDigest: descriptor.actionDigest,
        });
      });
    },
    complete(value) {
      validateOpenComplete(value);
      const p = pending.get(value.openRequestId);
      if (!p || value.generation !== p.generation || value.kind !== p.kind || value.destination !== p.destination) throw Error('WISP_STALE_OPEN');
      pending.delete(value.openRequestId);
      clearTimeout(p.timer);
      if (value.outcome !== 'opened') {
        p.reject(new Error('WISP_OPEN_FAILED'));
        return {accepted: true};
      }
      p.resolve({ok: true});
      return {accepted: true};
    },
    cancel() {
      for (const [id, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error('WISP_OPEN_CANCELLED'));
        pending.delete(id);
      }
    },
  };
}
