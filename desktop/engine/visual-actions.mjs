import {randomUUID} from 'node:crypto';
import {FIXTURE_TITLE} from './ax-actions.mjs';

export const SOURCE = 'wisp-visual';
export const VISUAL_DEADLINE_MS = 30000;
export const DRAWN_CANARY = 'Drawn Canary';
export const VISUAL_TOOL = 'wisp_visual_click_drawn';
export const VISUAL_OPERATION = 'click-drawn-canary';
export const VISUAL_DESTINATION = 'visual-fixture-canary:Drawn Canary';
export const CANARY_DIP = 48;
export const CORE_DIP = 8;
export const FILL_SRGB = Object.freeze([190, 18, 60]);
export const CORE_SRGB = Object.freeze([255, 255, 255]);
export const DIRECT_VISUAL_NAMES = Object.freeze([VISUAL_TOOL]);
export const VISUAL_TOOLS = Object.freeze({
  wisp_visual_click_drawn: {operation: VISUAL_OPERATION, args: ['title', 'target'], destination: VISUAL_DESTINATION},
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

function pointInCanary(centroid, canaryRect) {
  return Number.isFinite(centroid?.x) && Number.isFinite(centroid?.y)
    && centroid.x >= canaryRect.x && centroid.x <= canaryRect.x + canaryRect.width
    && centroid.y >= canaryRect.y && centroid.y <= canaryRect.y + canaryRect.height;
}

/** Unique = exactly one 8×8 core with surrounding fill; centroid must lie inside the 48×48 canary. */
export function classifyDrawnCanaryHits(hits, canaryRect = {x: 0, y: 0, width: CANARY_DIP, height: CANARY_DIP}) {
  const cores = (Array.isArray(hits) ? hits : []).filter(h =>
    h && h.fillSurrounds === true
    && h.coreWidth === CORE_DIP && h.coreHeight === CORE_DIP
    && Number.isFinite(h.centroid?.x) && Number.isFinite(h.centroid?.y));
  if (cores.length === 0) return {kind: 'zero'};
  if (cores.length > 1) return {kind: 'ambiguous'};
  const centroid = cores[0].centroid;
  if (!pointInCanary(centroid, canaryRect)) return {kind: 'outside'};
  return {kind: 'unique', centroid};
}

export function uniqueInsideHit() {
  return {fillSurrounds: true, coreWidth: CORE_DIP, coreHeight: CORE_DIP, centroid: {x: CANARY_DIP / 2, y: CANARY_DIP / 2}};
}

export function describeClickDrawn(args) {
  exact(args, ['title', 'target']);
  if (typeof args.title !== 'string' || typeof args.target !== 'string') throw Error('WISP_UNAVAILABLE_ACTION');
  if (args.title !== FIXTURE_TITLE || args.target !== DRAWN_CANARY) throw Error('WISP_UNAVAILABLE_ACTION');
  return {
    operation: VISUAL_OPERATION,
    destination: VISUAL_DESTINATION,
    fields: [
      {label: 'Window', value: FIXTURE_TITLE},
      {label: 'Target', value: DRAWN_CANARY},
      {label: 'Effect', value: 'Click the unique Drawn Canary drawing inside this Wisp-owned fixture after Allow Once. This is not a click on Fixture Button. Fixture Button stays on the Accessibility path.'},
    ],
  };
}

export function describeVisualTool(name, args) {
  if (name !== VISUAL_TOOL) throw Error('WISP_UNAVAILABLE_ACTION');
  return describeClickDrawn(args);
}

export function revalidateGrantedVisual(operation, destination, args) {
  if (operation !== VISUAL_OPERATION) throw Error('WISP_CHANGED_ACTION');
  const again = describeClickDrawn(args);
  if (again.operation !== operation || again.destination !== destination) throw Error('WISP_CHANGED_ACTION');
  return again;
}

function failedDetail(kind) {
  if (kind === 'zero') return 'No Drawn Canary match.';
  if (kind === 'ambiguous') return 'Drawn Canary match was not unique.';
  if (kind === 'outside') return 'Drawn Canary match was outside the canary.';
  return 'The Drawn Canary was not uniquely visible.';
}

export function createRecordingVisualDriver({hits} = {}) {
  const signatureHits = hits ?? [uniqueInsideHit()];
  const calls = [];
  return {
    calls,
    spawned: 0,
    rasters: 0,
    mouseEvents: 0,
    get count() { return calls.length; },
    hits: signatureHits,
    perform(request) {
      if (!request || typeof request !== 'object') throw Error('WISP_VISUAL');
      calls.push({...request});
      const classified = classifyDrawnCanaryHits(signatureHits);
      if (classified.kind !== 'unique') return {outcome: 'failed', detail: failedDetail(classified.kind)};
      return {outcome: 'applied', detail: 'Clicked Drawn Canary once.'};
    },
  };
}

export function validateVisualComplete(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('WISP_VISUAL_COMPLETE');
  const keys = Object.keys(value).sort().join();
  const short = ['destination', 'detail', 'generation', 'operation', 'outcome', 'version', 'visualRequestId'].sort().join();
  const full = ['actionDigest', 'callId', 'destination', 'detail', 'generation', 'operation', 'outcome', 'sessionId', 'version', 'visualRequestId'].sort().join();
  if (keys !== short && keys !== full) throw Error('WISP_VISUAL_COMPLETE');
  if (value.version !== 1 || !id(value.generation) || !id(value.visualRequestId)) throw Error('WISP_VISUAL_COMPLETE');
  if (value.operation !== VISUAL_OPERATION) throw Error('WISP_VISUAL_COMPLETE');
  if (!text(value.destination, 2048) || !text(value.detail, 2048) || !['applied', 'failed'].includes(value.outcome)) throw Error('WISP_VISUAL_COMPLETE');
  if (keys === full && !(id(value.sessionId) && id(value.callId) && /^[a-f0-9]{64}$/.test(value.actionDigest))) throw Error('WISP_VISUAL_COMPLETE');
  return value;
}

export function validateVisualRequest(value) {
  const keys = ['actionDigest', 'arguments', 'callId', 'destination', 'generation', 'operation', 'sessionId', 'version', 'visualRequestId'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw Error('WISP_VISUAL_REQUEST');
  if (value.version !== 1 || !['generation', 'visualRequestId', 'sessionId', 'callId'].every(k => id(value[k])) || !/^[a-f0-9]{64}$/.test(value.actionDigest)) throw Error('WISP_VISUAL_REQUEST');
  if (value.operation !== VISUAL_OPERATION) throw Error('WISP_VISUAL_REQUEST');
  const described = describeClickDrawn(value.arguments);
  if (described.operation !== value.operation || described.destination !== value.destination || !text(value.destination, 2048)) throw Error('WISP_VISUAL_REQUEST');
  return value;
}

export function createNativeVisualChannel({driver, deadline = VISUAL_DEADLINE_MS} = {}) {
  const pending = new Map();
  const notifies = [];
  return {
    notifies,
    request({operation, destination, generation, visualRequestId, arguments: args}) {
      notifies.push({operation, destination, generation, visualRequestId});
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(visualRequestId);
          reject(new Error('WISP_VISUAL_TIMEOUT'));
        }, deadline);
        pending.set(visualRequestId, {resolve, reject, timer, operation, destination, generation, arguments: args});
      });
    },
    complete(value) {
      const p = pending.get(value?.visualRequestId);
      if (!p || value.version !== 1 || value.generation !== p.generation || value.operation !== p.operation || value.destination !== p.destination) throw Error('WISP_STALE_VISUAL');
      pending.delete(value.visualRequestId);
      clearTimeout(p.timer);
      if (value.outcome !== 'applied') {
        p.reject(new Error('WISP_VISUAL_FAILED'));
        return {accepted: true};
      }
      const again = revalidateGrantedVisual(p.operation, p.destination, p.arguments);
      const result = driver.perform({operation: again.operation, destination: again.destination, arguments: p.arguments});
      p.resolve(result);
      return {accepted: true};
    },
    cancel() {
      for (const [key, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error('WISP_VISUAL_CANCELLED'));
        pending.delete(key);
      }
    },
  };
}

export function createVisualBroker({notify, deadline = VISUAL_DEADLINE_MS} = {}) {
  const pending = new Map();
  return {
    request({operation, destination, descriptor, arguments: args}) {
      const visualRequestId = randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(visualRequestId);
          reject(new Error('WISP_VISUAL_TIMEOUT'));
        }, deadline);
        pending.set(visualRequestId, {resolve, reject, timer, operation, destination, generation: descriptor.generation});
        notify?.('wisp.visual.requested', {
          version: 1,
          generation: descriptor.generation,
          visualRequestId,
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
      validateVisualComplete(value);
      const p = pending.get(value.visualRequestId);
      if (!p || value.generation !== p.generation || value.operation !== p.operation || value.destination !== p.destination) throw Error('WISP_STALE_VISUAL');
      pending.delete(value.visualRequestId);
      clearTimeout(p.timer);
      if (value.outcome !== 'applied') {
        p.reject(new Error('WISP_VISUAL_FAILED'));
        return {accepted: true};
      }
      p.resolve({ok: true, detail: value.detail});
      return {accepted: true};
    },
    cancel() {
      for (const [key, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error('WISP_VISUAL_CANCELLED'));
        pending.delete(key);
      }
    },
  };
}
