import {randomUUID} from 'node:crypto';

export const SOURCE = 'wisp-ax';
export const AX_DEADLINE_MS = 30000;
export const FIXTURE_TITLE = 'Wisp Accessibility Fixture';
export const FIXTURE_BUTTON = 'Fixture Button';
export const FIXTURE_FIELD = 'Fixture Field';
export const FIXTURE_MARKER = 'Fixture Marker';
export const FIND_NAMES = Object.freeze([FIXTURE_BUTTON, FIXTURE_FIELD, FIXTURE_MARKER]);
export const DIRECT_SAFE_ACTION_NAMES = Object.freeze(['wisp_open_url', 'wisp_open_file', 'wisp_tell_time']);
export const DIRECT_AX_NAMES = Object.freeze([
  'wisp_ax_focus_window',
  'wisp_ax_move_window',
  'wisp_ax_read_focused',
  'wisp_ax_click_named',
  'wisp_ax_type_named',
  'wisp_ax_find_named',
]);
export const AX_TOOLS = Object.freeze({
  wisp_ax_focus_window: {operation: 'focus-fixture-window', args: ['title'], destination: 'ax-fixture-window'},
  wisp_ax_move_window: {operation: 'move-fixture-window', args: ['title', 'dx', 'dy'], destination: 'ax-fixture-window'},
  wisp_ax_read_focused: {operation: 'read-fixture-interface', args: [], destination: 'ax-fixture-focused'},
  wisp_ax_click_named: {operation: 'press-named-control', args: ['name'], destination: 'ax-fixture-control:Fixture Button'},
  wisp_ax_type_named: {operation: 'set-named-text', args: ['name', 'text'], destination: 'ax-fixture-field:Fixture Field'},
  wisp_ax_find_named: {operation: 'search-fixture-tree', args: ['name']},
});

const unsafe = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
function exact(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw Error('WISP_INVALID_FRAME');
}
function text(value, max) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && !unsafe.test(value);
}
function id(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}

export function expectedInventoryNames({plugin = false, connection = false, skill = false, developer = false} = {}) {
  const names = [...DIRECT_SAFE_ACTION_NAMES, ...DIRECT_AX_NAMES];
  if (developer) names.push('wisp_permission_check');
  if (plugin) names.push('wisp_compatible_check');
  if (connection) names.push('mcp__wispdemo__record');
  if (skill) names.push('skill');
  return names;
}

export function parseDelta(raw) {
  if (typeof raw !== 'string' || !/^-?(0|[1-9][0-9]?)$/.test(raw)) throw Error('WISP_UNAVAILABLE_ACTION');
  const n = Number(raw);
  if (!Number.isInteger(n) || n < -64 || n > 64) throw Error('WISP_UNAVAILABLE_ACTION');
  return n;
}

export function parseFixtureText(raw) {
  if (typeof raw !== 'string' || raw.length < 1 || raw.length > 80 || unsafe.test(raw)) throw Error('WISP_UNAVAILABLE_ACTION');
  return raw;
}

function fieldsFor(effect) {
  return [{label: 'Effect', value: effect}];
}

export function describeFocusWindow(args) {
  exact(args, ['title']);
  if (args.title !== FIXTURE_TITLE) throw Error('WISP_UNAVAILABLE_ACTION');
  return {
    operation: 'focus-fixture-window',
    destination: 'ax-fixture-window',
    fields: [{label: 'Window', value: FIXTURE_TITLE}, ...fieldsFor('Raise and focus this Wisp-owned fixture window after Allow Once. Other applications are not targeted.')],
  };
}

export function describeMoveWindow(args) {
  exact(args, ['title', 'dx', 'dy']);
  if (args.title !== FIXTURE_TITLE) throw Error('WISP_UNAVAILABLE_ACTION');
  const dx = parseDelta(args.dx);
  const dy = parseDelta(args.dy);
  if (dx === 0 && dy === 0) throw Error('WISP_UNAVAILABLE_ACTION');
  return {
    operation: 'move-fixture-window',
    destination: 'ax-fixture-window',
    fields: [
      {label: 'Window', value: FIXTURE_TITLE},
      {label: 'Delta', value: `dx ${args.dx}, dy ${args.dy}`},
      ...fieldsFor('Nudge this fixture window by the granted point delta after Allow Once, clamped onto a visible screen.'),
    ],
  };
}

export function describeReadFocused(args) {
  exact(args, []);
  return {
    operation: 'read-fixture-interface',
    destination: 'ax-fixture-focused',
    fields: fieldsFor('Read a bounded snapshot of focus inside the Wisp Accessibility Fixture after Allow Once. Other applications are not reported.'),
  };
}

export function describeClickNamed(args) {
  exact(args, ['name']);
  if (args.name !== FIXTURE_BUTTON) throw Error('WISP_UNAVAILABLE_ACTION');
  return {
    operation: 'press-named-control',
    destination: 'ax-fixture-control:Fixture Button',
    fields: [{label: 'Control', value: FIXTURE_BUTTON}, ...fieldsFor('Press this unique fixture control once after Allow Once.')],
  };
}

export function describeTypeNamed(args) {
  exact(args, ['name', 'text']);
  if (args.name !== FIXTURE_FIELD) throw Error('WISP_UNAVAILABLE_ACTION');
  parseFixtureText(args.text);
  return {
    operation: 'set-named-text',
    destination: 'ax-fixture-field:Fixture Field',
    fields: [
      {label: 'Field', value: FIXTURE_FIELD},
      {label: 'Text', value: args.text},
      ...fieldsFor('Set this unique fixture field to the granted text after Allow Once. Keys are not synthesized.'),
    ],
  };
}

export function describeFindNamed(args) {
  exact(args, ['name']);
  if (!FIND_NAMES.includes(args.name)) throw Error('WISP_UNAVAILABLE_ACTION');
  return {
    operation: 'search-fixture-tree',
    destination: `ax-fixture-search:${args.name}`,
    fields: [{label: 'Name', value: args.name}, ...fieldsFor('Search only the Wisp Accessibility Fixture tree after Allow Once. This does not press or type.')],
  };
}

export const DESCRIBE = Object.freeze({
  wisp_ax_focus_window: describeFocusWindow,
  wisp_ax_move_window: describeMoveWindow,
  wisp_ax_read_focused: describeReadFocused,
  wisp_ax_click_named: describeClickNamed,
  wisp_ax_type_named: describeTypeNamed,
  wisp_ax_find_named: describeFindNamed,
});

export function describeAxTool(name, args) {
  const fn = DESCRIBE[name];
  if (!fn) throw Error('WISP_UNAVAILABLE_ACTION');
  return fn(args);
}

export function revalidateGrantedAx(operation, destination, args) {
  const tool = Object.entries(AX_TOOLS).find(([, spec]) => spec.operation === operation);
  if (!tool) throw Error('WISP_CHANGED_ACTION');
  const again = describeAxTool(tool[0], args);
  if (again.operation !== operation || again.destination !== destination) throw Error('WISP_CHANGED_ACTION');
  return again;
}

export function createRecordingAxDriver() {
  const calls = [];
  return {
    calls,
    spawned: 0,
    get count() { return calls.length; },
    perform(request) {
      if (!request || typeof request !== 'object') throw Error('WISP_AX');
      calls.push({...request});
      const operation = request.operation;
      if (operation === 'read-fixture-interface') {
        return {outcome: 'applied', detail: 'role window; title Wisp Accessibility Fixture; focused Fixture Field'};
      }
      if (operation === 'search-fixture-tree') {
        const name = request.arguments?.name;
        return {outcome: 'applied', detail: `found true; name ${name}; role ${name === FIXTURE_BUTTON ? 'button' : name === FIXTURE_FIELD ? 'text field' : 'static text'}`};
      }
      if (operation === 'press-named-control') return {outcome: 'applied', detail: 'Pressed Fixture Button once.'};
      if (operation === 'set-named-text') return {outcome: 'applied', detail: `Set Fixture Field to the granted text.`};
      if (operation === 'focus-fixture-window') return {outcome: 'applied', detail: 'Raised Wisp Accessibility Fixture.'};
      if (operation === 'move-fixture-window') return {outcome: 'applied', detail: 'Nudged Wisp Accessibility Fixture.'};
      throw Error('WISP_AX');
    },
  };
}

export function validateAxComplete(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('WISP_AX_COMPLETE');
  const keys = Object.keys(value).sort().join();
  const short = ['axRequestId', 'destination', 'detail', 'generation', 'operation', 'outcome', 'version'].sort().join();
  const full = ['actionDigest', 'axRequestId', 'callId', 'destination', 'detail', 'generation', 'operation', 'sessionId', 'outcome', 'version'].sort().join();
  if (keys !== short && keys !== full) throw Error('WISP_AX_COMPLETE');
  if (value.version !== 1 || !id(value.generation) || !id(value.axRequestId)) throw Error('WISP_AX_COMPLETE');
  if (!Object.values(AX_TOOLS).some(spec => spec.operation === value.operation)) throw Error('WISP_AX_COMPLETE');
  if (!text(value.destination, 2048) || !text(value.detail, 2048) || !['applied', 'failed', 'untrusted'].includes(value.outcome)) throw Error('WISP_AX_COMPLETE');
  if (keys === full && !(id(value.sessionId) && id(value.callId) && /^[a-f0-9]{64}$/.test(value.actionDigest))) throw Error('WISP_AX_COMPLETE');
  return value;
}

export function validateAxRequest(value) {
  const keys = ['actionDigest', 'arguments', 'axRequestId', 'callId', 'destination', 'generation', 'operation', 'sessionId', 'version'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw Error('WISP_AX_REQUEST');
  if (value.version !== 1 || !['generation', 'axRequestId', 'sessionId', 'callId'].every(k => id(value[k])) || !/^[a-f0-9]{64}$/.test(value.actionDigest)) throw Error('WISP_AX_REQUEST');
  const tool = Object.entries(AX_TOOLS).find(([, spec]) => spec.operation === value.operation);
  if (!tool) throw Error('WISP_AX_REQUEST');
  const described = describeAxTool(tool[0], value.arguments);
  if (described.operation !== value.operation || described.destination !== value.destination || !text(value.destination, 2048)) throw Error('WISP_AX_REQUEST');
  return value;
}

export function createNativeAxChannel({driver, deadline = AX_DEADLINE_MS} = {}) {
  const pending = new Map();
  const notifies = [];
  return {
    notifies,
    request({operation, destination, generation, axRequestId, arguments: args}) {
      notifies.push({operation, destination, generation, axRequestId});
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(axRequestId);
          reject(new Error('WISP_AX_TIMEOUT'));
        }, deadline);
        pending.set(axRequestId, {resolve, reject, timer, operation, destination, generation, arguments: args});
      });
    },
    complete(value) {
      const p = pending.get(value?.axRequestId);
      if (!p || value.version !== 1 || value.generation !== p.generation || value.operation !== p.operation || value.destination !== p.destination) throw Error('WISP_STALE_AX');
      pending.delete(value.axRequestId);
      clearTimeout(p.timer);
      if (value.outcome === 'untrusted') {
        p.reject(new Error('WISP_AX_UNTRUSTED'));
        return {accepted: true};
      }
      if (value.outcome !== 'applied') {
        p.reject(new Error('WISP_AX_FAILED'));
        return {accepted: true};
      }
      const again = revalidateGrantedAx(p.operation, p.destination, p.arguments);
      const result = driver.perform({operation: again.operation, destination: again.destination, arguments: p.arguments});
      p.resolve(result);
      return {accepted: true};
    },
    cancel() {
      for (const [key, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error('WISP_AX_CANCELLED'));
        pending.delete(key);
      }
    },
  };
}

export function createAxBroker({notify, deadline = AX_DEADLINE_MS} = {}) {
  const pending = new Map();
  return {
    request({operation, destination, descriptor, arguments: args}) {
      const axRequestId = randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(axRequestId);
          reject(new Error('WISP_AX_TIMEOUT'));
        }, deadline);
        pending.set(axRequestId, {resolve, reject, timer, operation, destination, generation: descriptor.generation});
        notify?.('wisp.ax.requested', {
          version: 1,
          generation: descriptor.generation,
          axRequestId,
          operation,
          destination,
          sessionId: descriptor.sessionId,
          callId: descriptor.callId,
          actionDigest: descriptor.actionDigest,
          arguments: args,
        });
      });
    },
    complete(value) {
      validateAxComplete(value);
      const p = pending.get(value.axRequestId);
      if (!p || value.generation !== p.generation || value.operation !== p.operation || value.destination !== p.destination) throw Error('WISP_STALE_AX');
      pending.delete(value.axRequestId);
      clearTimeout(p.timer);
      if (value.outcome === 'untrusted') {
        p.reject(new Error('WISP_AX_UNTRUSTED'));
        return {accepted: true};
      }
      if (value.outcome !== 'applied') {
        p.reject(new Error('WISP_AX_FAILED'));
        return {accepted: true};
      }
      p.resolve({ok: true, detail: value.detail});
      return {accepted: true};
    },
    cancel() {
      for (const [key, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error('WISP_AX_CANCELLED'));
        pending.delete(key);
      }
    },
  };
}
