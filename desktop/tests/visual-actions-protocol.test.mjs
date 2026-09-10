import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRequest} from '../engine/permission-protocol.mjs';
import {Lines} from '../engine/body-bridge.mjs';
import {DISABLED_STOCK_IDS} from '../engine/plugin-overlay.mjs';
import {productFiles} from '../engine/prepare-product.mjs';
import {
  createRecordingOpener,
  describeOpenUrl,
  describeOpenFile,
  decideThenEffect,
  revalidateGrantedOpen,
} from '../engine/safe-actions.mjs';
import {
  SOURCE as AX_SOURCE,
  FIXTURE_TITLE,
  FIXTURE_BUTTON,
  FIXTURE_FIELD,
  FIXTURE_MARKER,
  FIND_NAMES,
  DIRECT_SAFE_ACTION_NAMES,
  DIRECT_AX_NAMES,
  DIRECT_VISUAL_NAMES,
  expectedInventoryNames,
  createRecordingAxDriver,
  createNativeAxChannel,
  describeFocusWindow,
  describeClickNamed,
  describeFindNamed,
  validateAxComplete,
} from '../engine/ax-actions.mjs';
import {
  SOURCE,
  VISUAL_TOOL,
  VISUAL_OPERATION,
  VISUAL_DESTINATION,
  DRAWN_CANARY,
  createRecordingVisualDriver,
  createNativeVisualChannel,
  createVisualBroker,
  describeClickDrawn,
  revalidateGrantedVisual,
  validateVisualComplete,
  validateVisualRequest,
} from '../engine/visual-actions.mjs';
import {VoiceController, RecognitionDouble, SynthesisDouble} from '../engine/voice-seams.mjs';

const fixture = () => ({
  version: 1, generation: 'g', requestId: 'r', sessionId: 's', callId: 'c',
  actionDigest: 'a'.repeat(64), companionId: 'companion', turn: 1, rootCallId: 'c',
  toolName: 'wisp_permission_check', source: 'wisp-direct', revision: '1',
  arguments: {label: 'safe'}, operation: 'append-test-record', destination: '/owned/ledger',
  fields: [{label: 'Record', value: 'safe'}],
});

const visual = () => ({
  ...fixture(),
  toolName: VISUAL_TOOL, source: SOURCE,
  arguments: {title: FIXTURE_TITLE, target: DRAWN_CANARY},
  operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION,
  fields: [{label: 'Target', value: DRAWN_CANARY}],
});

const args = {title: FIXTURE_TITLE, target: DRAWN_CANARY};

test('Linux-supplemental: existing 06/09/11/12/15 pairs still validate', () => {
  assert.deepEqual(validateRequest(fixture()), fixture());
  const url = {...fixture(), toolName: 'wisp_open_url', source: 'wisp-safe-action', arguments: {url: 'https://example.com/ok'}, operation: 'open-http-url', destination: 'https://example.com/ok', fields: [{label: 'URL', value: 'https://example.com/ok'}]};
  assert.deepEqual(validateRequest(url), url);
  const plugin = {...fixture(), toolName: 'wisp_plugin_check', source: 'wisp-local-plugin'};
  const compatible = {...fixture(), toolName: 'wisp_compatible_check', source: 'wisp-compatible-plugin'};
  assert.deepEqual(validateRequest(plugin), plugin);
  assert.deepEqual(validateRequest(compatible), compatible);
  const mcp = {...fixture(), toolName: 'mcp__wispdemo__record', source: 'wisp-mcp'};
  assert.deepEqual(validateRequest(mcp), mcp);
  const skill = {...fixture(), toolName: 'skill', source: 'wisp-skill', arguments: {name: 'wisp-local-time-briefing'}, operation: 'load-skill-instructions', destination: 'wisp-local-time-briefing', fields: [{label: 'Skill', value: 'Local time briefing'}]};
  assert.deepEqual(validateRequest(skill), skill);
  const ax = {...fixture(), toolName: 'wisp_ax_click_named', source: AX_SOURCE, arguments: {name: FIXTURE_BUTTON}, operation: 'press-named-control', destination: 'ax-fixture-control:Fixture Button', fields: [{label: 'Control', value: FIXTURE_BUTTON}]};
  assert.deepEqual(validateRequest(ax), ax);
});

test('Linux-supplemental: the wisp-visual tuple is accepted only with matching source/operation/args', () => {
  assert.deepEqual(validateRequest(visual()), visual());
  assert.throws(() => validateRequest({...visual(), source: 'wisp-ax'}));
  assert.throws(() => validateRequest({...visual(), source: 'wisp-safe-action'}));
  assert.throws(() => validateRequest({...visual(), source: 'wisp-direct'}));
  assert.throws(() => validateRequest({...visual(), operation: 'press-named-control'}));
  assert.throws(() => validateRequest({...visual(), arguments: {title: FIXTURE_TITLE, target: FIXTURE_BUTTON}}));
  assert.throws(() => validateRequest({...visual(), arguments: {title: 'Safari', target: DRAWN_CANARY}}));
  assert.throws(() => validateRequest({...visual(), arguments: {title: FIXTURE_TITLE, target: DRAWN_CANARY, extra: 'x'}}));
  assert.throws(() => validateRequest({...visual(), arguments: {title: FIXTURE_TITLE}}));
  assert.throws(() => validateRequest({...visual(), destination: 'other'}));
  assert.throws(() => validateRequest({...visual(), toolName: 'bash'}));
});

test('Linux-supplemental: visual-complete is a closed body-bridge op; open and ax stay distinct', () => {
  const complete = {op: 'visual-complete', completion: {version: 1, generation: 'g', visualRequestId: 'v', operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, outcome: 'applied', detail: 'Clicked Drawn Canary once.'}};
  assert.deepEqual(new Lines().push(Buffer.from(JSON.stringify(complete) + '\n')), [complete]);
  assert.throws(() => new Lines().push(Buffer.from(JSON.stringify({op: 'visual-complete', extra: 1, completion: complete.completion}) + '\n')));
  assert.throws(() => new Lines().push(Buffer.from('{"op":"visual-press"}\n')));
  assert.deepEqual(validateVisualComplete(complete.completion), complete.completion);
  assert.throws(() => validateVisualComplete({...complete.completion, outcome: 'always'}));
  assert.throws(() => validateVisualComplete({...complete.completion, outcome: 'untrusted'}));
  const axComplete = {op: 'ax-complete', completion: {version: 1, generation: 'g', axRequestId: 'a', operation: 'focus-fixture-window', destination: 'ax-fixture-window', outcome: 'applied', detail: 'Raised Wisp Accessibility Fixture.'}};
  assert.deepEqual(new Lines().push(Buffer.from(JSON.stringify(axComplete) + '\n')), [axComplete]);
  const openComplete = {op: 'open-complete', completion: {version: 1, generation: 'g', openRequestId: 'o', kind: 'url', destination: 'https://example.com/', outcome: 'opened'}};
  assert.deepEqual(new Lines().push(Buffer.from(JSON.stringify(openComplete) + '\n')), [openComplete]);
  assert.deepEqual(validateAxComplete(axComplete.completion), axComplete.completion);
});

test('Linux-supplemental: visual-request validates closed arguments', () => {
  const request = {
    version: 1, generation: 'g', visualRequestId: 'vis1', operation: VISUAL_OPERATION,
    destination: VISUAL_DESTINATION, sessionId: 's', callId: 'c', actionDigest: 'a'.repeat(64),
    arguments: args,
  };
  assert.deepEqual(validateVisualRequest(request), request);
  assert.throws(() => validateVisualRequest({...request, arguments: {title: FIXTURE_TITLE, target: FIXTURE_BUTTON}}));
  assert.throws(() => validateVisualRequest({...request, extra: 1}));
});

test('Linux-supplemental: deny/cancel/timeout/stale are 0/0/0/1 with zero raster/click', async () => {
  const driver = createRecordingVisualDriver();
  const channel = createNativeVisualChannel({driver, deadline: 20});
  assert.equal(channel.notifies.length, 0);
  const action = describeClickDrawn(args);
  assert.equal(channel.notifies.length, 0);
  assert.equal(driver.count, 0);
  const pending = channel.request({operation: action.operation, destination: action.destination, generation: 'g', visualRequestId: 'vis-1', arguments: args});
  assert.equal(channel.notifies.length, 1);
  await assert.rejects(pending, /WISP_VISUAL_TIMEOUT/);
  assert.equal(driver.count, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
  assert.throws(() => channel.complete({version: 1, generation: 'g', visualRequestId: 'vis-1', operation: action.operation, destination: action.destination, outcome: 'applied', detail: 'late'}));
  assert.equal(driver.count, 0);
  const second = channel.request({operation: action.operation, destination: action.destination, generation: 'g', visualRequestId: 'vis-2', arguments: args});
  channel.complete({version: 1, generation: 'g', visualRequestId: 'vis-2', operation: action.operation, destination: action.destination, outcome: 'applied', detail: 'Clicked Drawn Canary once.'});
  await second;
  assert.equal(driver.count, 1);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
  assert.throws(() => channel.complete({version: 1, generation: 'g', visualRequestId: 'vis-2', operation: action.operation, destination: action.destination, outcome: 'applied', detail: 'Clicked Drawn Canary once.'}));
  assert.equal(driver.count, 1);
});

test('Linux-supplemental: deny and cancel never notify native visual', () => {
  const notifies = [];
  const broker = createVisualBroker({notify: (method, params) => notifies.push({method, params})});
  for (const decision of ['deny', 'cancel']) {
    decideThenEffect({
      describe: describeClickDrawn,
      args,
      decision,
      effect: action => broker.request({operation: action.operation, destination: action.destination, descriptor: {generation: 'g', sessionId: 's', callId: 'c', actionDigest: 'a'.repeat(64)}, arguments: args}),
    });
  }
  assert.equal(notifies.length, 0);
});

test('Linux-supplemental: consume-then-complete allow-once notifies then completes once', async () => {
  const notifies = [];
  const broker = createVisualBroker({notify: (method, params) => notifies.push({method, params})});
  const pending = [];
  decideThenEffect({
    describe: describeClickDrawn,
    args,
    decision: 'allow-once',
    effect: action => {
      pending.push(broker.request({operation: action.operation, destination: action.destination, descriptor: {generation: 'g', sessionId: 's', callId: 'c', actionDigest: 'a'.repeat(64)}, arguments: args}));
    },
  });
  assert.equal(notifies.length, 1);
  assert.equal(notifies[0].method, 'wisp.visual.requested');
  assert.equal(notifies[0].params.operation, VISUAL_OPERATION);
  assert.equal(notifies[0].params.destination, VISUAL_DESTINATION);
  broker.complete({
    version: 1, generation: 'g', visualRequestId: notifies[0].params.visualRequestId,
    operation: VISUAL_OPERATION, destination: VISUAL_DESTINATION, outcome: 'applied', detail: 'Clicked Drawn Canary once.',
  });
  await pending[0];
});

test('Linux-supplemental: failed native complete does not increment a recording driver via the channel', async () => {
  const driver = createRecordingVisualDriver();
  const channel = createNativeVisualChannel({driver, deadline: 200});
  const action = describeClickDrawn(args);
  const pending = channel.request({operation: action.operation, destination: action.destination, generation: 'g', visualRequestId: 'vis-f', arguments: args});
  channel.complete({version: 1, generation: 'g', visualRequestId: 'vis-f', operation: action.operation, destination: action.destination, outcome: 'failed', detail: 'No Drawn Canary match.'});
  await assert.rejects(pending, /WISP_VISUAL_FAILED/);
  assert.equal(driver.count, 0);
  assert.equal(driver.rasters, 0);
  assert.equal(driver.mouseEvents, 0);
});

test('Linux-supplemental: 15 recording-AX still 0/0/0/1 and FIND_NAMES stay the three parked names', async () => {
  assert.deepEqual([...FIND_NAMES], [FIXTURE_BUTTON, FIXTURE_FIELD, FIXTURE_MARKER]);
  assert.throws(() => describeFindNamed({name: DRAWN_CANARY}));
  const counts = [];
  for (const decision of [null, 'deny', 'cancel', 'allow-once']) {
    const driver = createRecordingAxDriver();
    if (decision === null) describeClickNamed({name: FIXTURE_BUTTON});
    else {
      decideThenEffect({
        describe: describeClickNamed,
        args: {name: FIXTURE_BUTTON},
        decision,
        effect: action => driver.perform({operation: action.operation, destination: action.destination, arguments: {name: FIXTURE_BUTTON}}),
      });
    }
    counts.push(driver.count);
  }
  assert.deepEqual(counts, [0, 0, 0, 1]);
  const channel = createNativeAxChannel({driver: createRecordingAxDriver(), deadline: 20});
  const action = describeFocusWindow({title: FIXTURE_TITLE});
  const pending = channel.request({operation: action.operation, destination: action.destination, generation: 'g', axRequestId: 'ax-t', arguments: {title: FIXTURE_TITLE}});
  await assert.rejects(pending, /WISP_AX_TIMEOUT/);
});

test('Linux-supplemental: deny/cancel never increment a recording AX driver when visual is denied', () => {
  const ax = createRecordingAxDriver();
  const visualDriver = createRecordingVisualDriver();
  for (const decision of ['deny', 'cancel']) {
    decideThenEffect({
      describe: describeClickDrawn,
      args,
      decision,
      effect: action => visualDriver.perform({operation: action.operation, destination: action.destination, arguments: args}),
    });
  }
  assert.equal(visualDriver.count, 0);
  assert.equal(ax.count, 0);
});

test('Linux-supplemental: 09 recording-opener still 0/0/0/1 and file:/etc fail', () => {
  const opener = createRecordingOpener();
  assert.throws(() => describeOpenUrl({url: 'file:///etc/passwd'}));
  assert.throws(() => describeOpenUrl({url: 'javascript:alert(1)'}));
  assert.throws(() => describeOpenFile({path: '/etc/passwd'}));
  const counts = [];
  for (const decision of [null, 'deny', 'cancel', 'allow-once']) {
    const one = createRecordingOpener();
    if (decision === null) describeOpenUrl({url: 'https://example.com/ok'});
    else {
      decideThenEffect({
        describe: describeOpenUrl,
        args: {url: 'https://example.com/ok'},
        decision,
        effect: action => {
          const dest = revalidateGrantedOpen('url', action.destination, {url: 'https://example.com/ok'});
          one.open(dest);
        },
      });
    }
    counts.push(one.count);
  }
  assert.deepEqual(counts, [0, 0, 0, 1]);
  assert.equal(opener.count, 0);
});

test('Linux-supplemental: overlay still disables stock bash/fs/web/pwsh; prepare-product copies visual sources', () => {
  for (const id of ['tool-bash', 'tool-fs', 'tool-web', 'web-fetch-http', 'tool-pwsh']) assert.ok(DISABLED_STOCK_IDS.includes(id));
  const patch = readFileSync(new URL('../engine/product.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /- id: tool-bash\n {2}disabled: true/);
  assert.match(patch, /- id: tool-fs\n {2}disabled: true/);
  assert.match(patch, /- id: tool-web\n {2}disabled: true/);
  assert.match(patch, /- id: tool-pwsh\n {2}disabled: true/);
  assert.ok(productFiles.includes('visual-actions.mjs'));
  assert.ok(productFiles.includes('visual-action-tools.ts'));
  assert.ok(productFiles.includes('ax-actions.mjs'));
  assert.ok(productFiles.includes('safe-actions.mjs'));
});

test('Linux-supplemental: inventory helper default includes 09 three plus 15 six plus 16 one and excludes gated demos', () => {
  const names = expectedInventoryNames();
  for (const name of DIRECT_SAFE_ACTION_NAMES) assert.ok(names.includes(name));
  for (const name of DIRECT_AX_NAMES) assert.ok(names.includes(name));
  for (const name of DIRECT_VISUAL_NAMES) assert.ok(names.includes(name));
  assert.equal(names.includes('skill'), false);
  assert.equal(names.includes('wisp_compatible_check'), false);
  assert.equal(names.some(n => String(n).startsWith('mcp__')), false);
  const enabled = expectedInventoryNames({plugin: true, connection: true, skill: true});
  assert.ok(enabled.includes('skill'));
  assert.ok(enabled.includes('wisp_compatible_check'));
  assert.ok(enabled.includes('mcp__wispdemo__record'));
  assert.ok(enabled.includes(VISUAL_TOOL));
});

test('Linux-supplemental: visual request/ack events cannot enter TTS; ax and open remain distinct', () => {
  const mic = new RecognitionDouble();
  const speaker = new SynthesisDouble();
  const voice = new VoiceController({recognition: mic, synthesis: speaker});
  const gen = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const companion = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  voice.send = () => true;
  voice.ready = () => true;
  voice.localAvailable = () => true;
  voice.attach(gen, companion);
  voice.activate();
  const id = voice.state.operationID;
  mic.deliver(id, 'released');
  mic.deliver(id, 'final', 'Click the drawn canary');
  voice.receive({event: 'visual-request', utteranceId: id, generation: gen, companionId: companion, text: 'Drawn Canary'});
  voice.receive({event: 'visual-complete', utteranceId: id, generation: gen, companionId: companion, text: 'applied'});
  voice.receive({event: 'ax-request', utteranceId: id, generation: gen, companionId: companion, text: 'Wisp Accessibility Fixture'});
  voice.receive({event: 'open-request', utteranceId: id, generation: gen, companionId: companion, text: 'https://evil.example'});
  assert.deepEqual(speaker.spoken, []);
  voice.approval(true);
  voice.receive({event: 'voice-result', utteranceId: id, generation: gen, companionId: companion, text: 'Should not speak during approval'});
  assert.deepEqual(speaker.spoken, []);
});

test('Linux-supplemental: Swift visual driver rasters the owned window and uses NSEvent, not helpers', () => {
  const driver = readFileSync(fileURLToPath(new URL('../macos/Sources/WispBody/VisualClickDriver.swift', import.meta.url)), 'utf8');
  assert.match(driver, /bitmapImageRepForCachingDisplay/);
  assert.match(driver, /cacheDisplay/);
  assert.match(driver, /NSEvent/);
  assert.equal(/CGEventPost/.test(driver), false);
  assert.equal(/CGEventPostToPid/.test(driver), false);
  assert.equal(/CGEventTap/.test(driver), false);
  assert.equal(/CGRequestScreenCaptureAccess/.test(driver), false);
  assert.equal(/ScreenCaptureKit/.test(driver), false);
  assert.equal(/AXUIElement/.test(driver), false);
  assert.equal(/AXIsProcessTrustedWithOptions/.test(driver), false);
  assert.equal(/\/usr\/bin\/open/.test(driver), false);
  assert.equal(/xdg-open/.test(driver), false);
  assert.equal(/osascript/.test(driver), false);
  assert.equal(/cliclick/.test(driver), false);
  assert.equal(/posix_spawn/.test(driver), false);
  assert.equal(/SendInput/.test(driver), false);
  assert.equal(/pressDrawn\(/.test(driver), false);
  const fixture = readFileSync(fileURLToPath(new URL('../macos/Sources/WispBody/AccessibilityFixtureWindow.swift', import.meta.url)), 'utf8');
  assert.match(fixture, /Drawn Canary/);
  assert.match(fixture, /Drawn Count/);
  assert.match(fixture, /isAccessibilityElement/);
  assert.match(fixture, /190/);
  assert.match(fixture, /255/);
  assert.match(fixture, /final class DrawnCanaryView: NSView/);
  assert.equal(/final class DrawnCanaryView: NSButton/.test(fixture), false);
  assert.equal(/final class DrawnCanaryView: NSControl/.test(fixture), false);
  assert.equal(/pressDrawn\(/.test(fixture), false);
  assert.equal(/CGEvent/.test(fixture), false);
});
