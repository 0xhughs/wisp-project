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
  SOURCE,
  FIXTURE_TITLE,
  FIXTURE_BUTTON,
  FIXTURE_FIELD,
  FIXTURE_MARKER,
  DIRECT_SAFE_ACTION_NAMES,
  DIRECT_AX_NAMES,
  expectedInventoryNames,
  createRecordingAxDriver,
  createNativeAxChannel,
  createAxBroker,
  describeFocusWindow,
  describeMoveWindow,
  describeReadFocused,
  describeClickNamed,
  describeTypeNamed,
  describeFindNamed,
  validateAxComplete,
  validateAxRequest,
} from '../engine/ax-actions.mjs';
import {VoiceController, RecognitionDouble, SynthesisDouble} from '../engine/voice-seams.mjs';

const fixture = () => ({
  version: 1, generation: 'g', requestId: 'r', sessionId: 's', callId: 'c',
  actionDigest: 'a'.repeat(64), companionId: 'companion', turn: 1, rootCallId: 'c',
  toolName: 'wisp_permission_check', source: 'wisp-direct', revision: '1',
  arguments: {label: 'safe'}, operation: 'append-test-record', destination: '/owned/ledger',
  fields: [{label: 'Record', value: 'safe'}],
});

const axFocus = () => ({
  ...fixture(),
  toolName: 'wisp_ax_focus_window', source: SOURCE,
  arguments: {title: FIXTURE_TITLE},
  operation: 'focus-fixture-window', destination: 'ax-fixture-window',
  fields: [{label: 'Window', value: FIXTURE_TITLE}],
});
const axMove = () => ({
  ...fixture(),
  toolName: 'wisp_ax_move_window', source: SOURCE,
  arguments: {title: FIXTURE_TITLE, dx: '4', dy: '-2'},
  operation: 'move-fixture-window', destination: 'ax-fixture-window',
  fields: [{label: 'Delta', value: 'dx 4, dy -2'}],
});
const axRead = () => ({
  ...fixture(),
  toolName: 'wisp_ax_read_focused', source: SOURCE,
  arguments: {}, operation: 'read-fixture-interface', destination: 'ax-fixture-focused',
  fields: [{label: 'Effect', value: 'Read a bounded snapshot of focus inside the Wisp Accessibility Fixture after Allow Once. Other applications are not reported.'}],
});
const axClick = () => ({
  ...fixture(),
  toolName: 'wisp_ax_click_named', source: SOURCE,
  arguments: {name: FIXTURE_BUTTON},
  operation: 'press-named-control', destination: 'ax-fixture-control:Fixture Button',
  fields: [{label: 'Control', value: FIXTURE_BUTTON}],
});
const axType = () => ({
  ...fixture(),
  toolName: 'wisp_ax_type_named', source: SOURCE,
  arguments: {name: FIXTURE_FIELD, text: 'hello'},
  operation: 'set-named-text', destination: 'ax-fixture-field:Fixture Field',
  fields: [{label: 'Text', value: 'hello'}],
});
const axFind = () => ({
  ...fixture(),
  toolName: 'wisp_ax_find_named', source: SOURCE,
  arguments: {name: FIXTURE_MARKER},
  operation: 'search-fixture-tree', destination: 'ax-fixture-search:Fixture Marker',
  fields: [{label: 'Name', value: FIXTURE_MARKER}],
});

test('Linux-supplemental: existing 06/09/11/12 pairs still validate', () => {
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
});

test('Linux-supplemental: the six wisp-ax tuples are accepted only with matching source/operation/args', () => {
  assert.deepEqual(validateRequest(axFocus()), axFocus());
  assert.deepEqual(validateRequest(axMove()), axMove());
  assert.deepEqual(validateRequest(axRead()), axRead());
  assert.deepEqual(validateRequest(axClick()), axClick());
  assert.deepEqual(validateRequest(axType()), axType());
  assert.deepEqual(validateRequest(axFind()), axFind());
  assert.throws(() => validateRequest({...axFocus(), source: 'wisp-safe-action'}));
  assert.throws(() => validateRequest({...axFocus(), source: 'wisp-direct'}));
  assert.throws(() => validateRequest({...axFocus(), operation: 'open-http-url'}));
  assert.throws(() => validateRequest({...axFocus(), arguments: {title: 'Safari'}}));
  assert.throws(() => validateRequest({...axFocus(), arguments: {title: FIXTURE_TITLE, extra: 'x'}}));
  assert.throws(() => validateRequest({...axMove(), arguments: {title: FIXTURE_TITLE, dx: '0', dy: '0'}}));
  assert.throws(() => validateRequest({...axMove(), arguments: {title: FIXTURE_TITLE, dx: '65', dy: '1'}}));
  assert.throws(() => validateRequest({...axClick(), arguments: {name: FIXTURE_FIELD}}));
  assert.throws(() => validateRequest({...axType(), arguments: {name: FIXTURE_FIELD, text: 'hello', extra: 'x'}}));
  assert.throws(() => validateRequest({...axType(), arguments: {name: FIXTURE_FIELD, text: 'a'.repeat(81)}}));
  assert.throws(() => validateRequest({...axFind(), arguments: {name: 'Safari'}}));
  assert.throws(() => validateRequest({...axRead(), arguments: {title: FIXTURE_TITLE}}));
  assert.throws(() => validateRequest({...axFocus(), toolName: 'bash'}));
  assert.throws(() => validateRequest({...axFocus(), destination: 'other-app'}));
});

test('Linux-supplemental: ax-complete is a closed body-bridge op; unknown helpers fail', () => {
  const complete = {op: 'ax-complete', completion: {version: 1, generation: 'g', axRequestId: 'a', operation: 'focus-fixture-window', destination: 'ax-fixture-window', outcome: 'applied', detail: 'Raised Wisp Accessibility Fixture.'}};
  assert.deepEqual(new Lines().push(Buffer.from(JSON.stringify(complete) + '\n')), [complete]);
  assert.throws(() => new Lines().push(Buffer.from(JSON.stringify({op: 'ax-complete', extra: 1, completion: complete.completion}) + '\n')));
  assert.throws(() => new Lines().push(Buffer.from('{"op":"ax-press"}\n')));
  assert.deepEqual(validateAxComplete(complete.completion), complete.completion);
  assert.throws(() => validateAxComplete({...complete.completion, outcome: 'always'}));
});

test('Linux-supplemental: ax-request validates closed arguments', () => {
  const request = {
    version: 1, generation: 'g', axRequestId: 'ax1', operation: 'focus-fixture-window',
    destination: 'ax-fixture-window', sessionId: 's', callId: 'c', actionDigest: 'a'.repeat(64),
    arguments: {title: FIXTURE_TITLE},
  };
  assert.deepEqual(validateAxRequest(request), request);
  assert.throws(() => validateAxRequest({...request, arguments: {title: 'Safari'}}));
  assert.throws(() => validateAxRequest({...request, extra: 1}));
});

test('Linux-supplemental: deny/cancel never notify native; timeout does not retry; one grant one AX', async () => {
  const driver = createRecordingAxDriver();
  const channel = createNativeAxChannel({driver, deadline: 20});
  assert.equal(channel.notifies.length, 0);
  const action = describeFocusWindow({title: FIXTURE_TITLE});
  assert.equal(channel.notifies.length, 0);
  assert.equal(driver.count, 0);
  const pending = channel.request({operation: action.operation, destination: action.destination, generation: 'g', axRequestId: 'ax-1', arguments: {title: FIXTURE_TITLE}});
  assert.equal(channel.notifies.length, 1);
  await assert.rejects(pending, /WISP_AX_TIMEOUT/);
  assert.equal(driver.count, 0);
  assert.throws(() => channel.complete({version: 1, generation: 'g', axRequestId: 'ax-1', operation: action.operation, destination: action.destination, outcome: 'applied', detail: 'late'}));
  assert.equal(driver.count, 0);
  const second = channel.request({operation: action.operation, destination: action.destination, generation: 'g', axRequestId: 'ax-2', arguments: {title: FIXTURE_TITLE}});
  channel.complete({version: 1, generation: 'g', axRequestId: 'ax-2', operation: action.operation, destination: action.destination, outcome: 'applied', detail: 'Raised Wisp Accessibility Fixture.'});
  await second;
  assert.equal(driver.count, 1);
  assert.throws(() => channel.complete({version: 1, generation: 'g', axRequestId: 'ax-2', operation: action.operation, destination: action.destination, outcome: 'applied', detail: 'Raised Wisp Accessibility Fixture.'}));
  assert.equal(driver.count, 1);
});

test('Linux-supplemental: deny and cancel never notify native AX', () => {
  const notifies = [];
  const broker = createAxBroker({notify: (method, params) => notifies.push({method, params})});
  for (const job of [
    {describe: describeFocusWindow, args: {title: FIXTURE_TITLE}},
    {describe: describeMoveWindow, args: {title: FIXTURE_TITLE, dx: '1', dy: '0'}},
    {describe: describeReadFocused, args: {}},
    {describe: describeClickNamed, args: {name: FIXTURE_BUTTON}},
    {describe: describeTypeNamed, args: {name: FIXTURE_FIELD, text: 'typed'}},
    {describe: describeFindNamed, args: {name: FIXTURE_MARKER}},
  ]) {
    for (const decision of ['deny', 'cancel']) {
      decideThenEffect({
        describe: job.describe,
        args: job.args,
        decision,
        effect: action => broker.request({operation: action.operation, destination: action.destination, descriptor: {generation: 'g', sessionId: 's', callId: 'c', actionDigest: 'a'.repeat(64)}, arguments: job.args}),
      });
    }
  }
  assert.equal(notifies.length, 0);
});

test('Linux-supplemental: untrusted complete does not increment the recording driver', async () => {
  const driver = createRecordingAxDriver();
  const channel = createNativeAxChannel({driver, deadline: 200});
  const action = describeClickNamed({name: FIXTURE_BUTTON});
  const pending = channel.request({operation: action.operation, destination: action.destination, generation: 'g', axRequestId: 'ax-u', arguments: {name: FIXTURE_BUTTON}});
  channel.complete({version: 1, generation: 'g', axRequestId: 'ax-u', operation: action.operation, destination: action.destination, outcome: 'untrusted', detail: 'Accessibility is not trusted.'});
  await assert.rejects(pending, /WISP_AX_UNTRUSTED/);
  assert.equal(driver.count, 0);
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

test('Linux-supplemental: overlay still disables stock bash/fs/web; prepare-product copies AX sources', () => {
  for (const id of ['tool-bash', 'tool-fs', 'tool-web', 'web-fetch-http']) assert.ok(DISABLED_STOCK_IDS.includes(id));
  const patch = readFileSync(new URL('../engine/product.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /- id: tool-bash\n {2}disabled: true/);
  assert.match(patch, /- id: tool-fs\n {2}disabled: true/);
  assert.match(patch, /- id: tool-web\n {2}disabled: true/);
  assert.ok(productFiles.includes('ax-actions.mjs'));
  assert.ok(productFiles.includes('ax-action-tools.ts'));
  assert.ok(productFiles.includes('safe-actions.mjs'));
});

test('Linux-supplemental: inventory helper default includes 09 three plus 15 six and excludes gated demos', () => {
  const names = expectedInventoryNames();
  for (const name of DIRECT_SAFE_ACTION_NAMES) assert.ok(names.includes(name));
  for (const name of DIRECT_AX_NAMES) assert.ok(names.includes(name));
  assert.equal(names.includes('skill'), false);
  assert.equal(names.includes('wisp_compatible_check'), false);
  assert.equal(names.some(n => String(n).startsWith('mcp__')), false);
  const enabled = expectedInventoryNames({plugin: true, connection: true, skill: true});
  assert.ok(enabled.includes('skill'));
  assert.ok(enabled.includes('wisp_compatible_check'));
  assert.ok(enabled.includes('mcp__wispdemo__record'));
  for (const name of DIRECT_AX_NAMES) assert.ok(enabled.includes(name));
});

test('Linux-supplemental: AX request/ack events cannot enter TTS; open-request remains distinct', () => {
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
  mic.deliver(id, 'final', 'Focus the fixture');
  voice.receive({event: 'ax-request', utteranceId: id, generation: gen, companionId: companion, text: 'Wisp Accessibility Fixture'});
  voice.receive({event: 'ax-complete', utteranceId: id, generation: gen, companionId: companion, text: 'applied'});
  voice.receive({event: 'open-request', utteranceId: id, generation: gen, companionId: companion, text: 'https://evil.example'});
  assert.deepEqual(speaker.spoken, []);
  voice.approval(true);
  voice.receive({event: 'voice-result', utteranceId: id, generation: gen, companionId: companion, text: 'Should not speak during approval'});
  assert.deepEqual(speaker.spoken, []);
});

test('Linux-supplemental: Swift AX driver uses structured AX after a trust check, not helper binaries', () => {
  const driver = readFileSync(fileURLToPath(new URL('../macos/Sources/WispBody/AccessibilityDriver.swift', import.meta.url)), 'utf8');
  assert.match(driver, /AXIsProcessTrusted/);
  assert.match(driver, /AXUIElement/);
  assert.equal(/\/usr\/bin\/open/.test(driver), false);
  assert.equal(/xdg-open/.test(driver), false);
  assert.equal(/osascript/.test(driver), false);
  assert.equal(/CGEvent/.test(driver), false);
  const fixture = readFileSync(fileURLToPath(new URL('../macos/Sources/WispBody/AccessibilityFixtureWindow.swift', import.meta.url)), 'utf8');
  assert.match(fixture, /Wisp Accessibility Fixture/);
  assert.match(fixture, /Fixture Button/);
  assert.match(fixture, /Fixture Field/);
  assert.match(fixture, /Fixture Marker/);
  assert.equal(/CGEvent/.test(fixture), false);
});
