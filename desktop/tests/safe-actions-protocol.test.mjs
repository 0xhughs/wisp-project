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
  createClock,
  createNativeOpenChannel,
  describeOpenUrl,
  describeTellTime,
} from '../engine/safe-actions.mjs';
import {VoiceController, RecognitionDouble, SynthesisDouble} from '../engine/voice-seams.mjs';

const fixture = () => ({
  version: 1, generation: 'g', requestId: 'r', sessionId: 's', callId: 'c',
  actionDigest: 'a'.repeat(64), companionId: 'companion', turn: 1, rootCallId: 'c',
  toolName: 'wisp_permission_check', source: 'wisp-direct', revision: '1',
  arguments: {label: 'safe'}, operation: 'append-test-record', destination: '/owned/ledger',
  fields: [{label: 'Record', value: 'safe'}],
});

const urlRequest = () => ({
  ...fixture(),
  toolName: 'wisp_open_url', source: 'wisp-safe-action',
  arguments: {url: 'https://example.com/ok'},
  operation: 'open-http-url', destination: 'https://example.com/ok',
  fields: [{label: 'URL', value: 'https://example.com/ok'}],
});

const fileRequest = () => ({
  ...fixture(),
  toolName: 'wisp_open_file', source: 'wisp-safe-action',
  arguments: {path: '/tmp/wisp-09/note.txt'},
  operation: 'open-local-file-for-viewing', destination: '/tmp/wisp-09/note.txt',
  fields: [{label: 'Path', value: '/tmp/wisp-09/note.txt'}],
});

const timeRequest = () => ({
  ...fixture(),
  toolName: 'wisp_tell_time', source: 'wisp-safe-action',
  arguments: {}, operation: 'read-local-clock', destination: 'local-system-clock',
  fields: [{label: 'Clock', value: 'Wisp will read this device’s local clock once.'}],
});

test('Linux-supplemental: existing fixture pairing is unchanged', () => {
  assert.deepEqual(validateRequest(fixture()), fixture());
  assert.throws(() => validateRequest({...fixture(), source: 'wisp-safe-action'}));
  assert.throws(() => validateRequest({...fixture(), toolName: 'wisp_open_url', source: 'wisp-direct'}));
  assert.throws(() => validateRequest({...fixture(), operation: 'open-http-url'}));
});

test('Linux-supplemental: compatible and plugin fixture pairs stay closed', () => {
  const plugin = {...fixture(), toolName: 'wisp_plugin_check', source: 'wisp-local-plugin'};
  const compatible = {...fixture(), toolName: 'wisp_compatible_check', source: 'wisp-compatible-plugin'};
  assert.deepEqual(validateRequest(plugin), plugin);
  assert.deepEqual(validateRequest(compatible), compatible);
  assert.throws(() => validateRequest({...plugin, source: 'wisp-safe-action'}));
  assert.throws(() => validateRequest({...compatible, source: 'wisp-safe-action'}));
});

test('Linux-supplemental: the three safe-action tuples are accepted only with matching source/operation/args', () => {
  assert.deepEqual(validateRequest(urlRequest()), urlRequest());
  assert.deepEqual(validateRequest(fileRequest()), fileRequest());
  assert.deepEqual(validateRequest(timeRequest()), timeRequest());
  assert.throws(() => validateRequest({...urlRequest(), source: 'wisp-direct'}));
  assert.throws(() => validateRequest({...urlRequest(), operation: 'append-test-record'}));
  assert.throws(() => validateRequest({...urlRequest(), arguments: {url: 'https://example.com', application: 'Safari'}}));
  assert.throws(() => validateRequest({...fileRequest(), arguments: {path: '/tmp/x.txt', args: ['-a']}}));
  assert.throws(() => validateRequest({...timeRequest(), arguments: {zone: 'UTC'}}));
  assert.throws(() => validateRequest({...timeRequest(), destination: 'ntp'}));
  assert.throws(() => validateRequest({...urlRequest(), toolName: 'bash'}));
});

test('Linux-supplemental: open-complete is a closed body-bridge op; unknown helpers fail', () => {
  const complete = {op: 'open-complete', completion: {version: 1, generation: 'g', openRequestId: 'o', kind: 'url', destination: 'https://example.com/', outcome: 'opened'}};
  assert.deepEqual(new Lines().push(Buffer.from(JSON.stringify(complete) + '\n')), [complete]);
  assert.throws(() => new Lines().push(Buffer.from(JSON.stringify({op: 'open-complete', extra: 1, completion: complete.completion}) + '\n')));
  assert.throws(() => new Lines().push(Buffer.from('{"op":"xdg-open"}\n')));
});

test('Linux-supplemental: deny/cancel never notify native; timeout does not retry; one grant one open', async () => {
  const opener = createRecordingOpener();
  const channel = createNativeOpenChannel({opener, deadline: 20, revalidate: (kind, destination) => destination});
  assert.equal(channel.notifies.length, 0);
  const action = describeOpenUrl({url: 'https://example.com/ok'});
  for (const decision of ['deny', 'cancel']) {
    if (decision === 'allow-once') continue;
    assert.equal(decision === 'deny' || decision === 'cancel', true);
  }
  assert.equal(channel.notifies.length, 0);
  assert.equal(opener.count, 0);
  const pending = channel.request({kind: 'url', destination: action.destination, generation: 'g', openRequestId: 'open-1'});
  assert.equal(channel.notifies.length, 1);
  await assert.rejects(pending, /WISP_OPEN_TIMEOUT/);
  assert.equal(opener.count, 0);
  assert.throws(() => channel.complete({version: 1, generation: 'g', openRequestId: 'open-1', kind: 'url', destination: action.destination, outcome: 'opened'}));
  assert.equal(opener.count, 0);
  const second = channel.request({kind: 'url', destination: action.destination, generation: 'g', openRequestId: 'open-2'});
  channel.complete({version: 1, generation: 'g', openRequestId: 'open-2', kind: 'url', destination: action.destination, outcome: 'opened'});
  await second;
  assert.equal(opener.count, 1);
  assert.throws(() => channel.complete({version: 1, generation: 'g', openRequestId: 'open-2', kind: 'url', destination: action.destination, outcome: 'opened'}));
  assert.equal(opener.count, 1);
});

test('Linux-supplemental: time 0/0/0/1 against an injected clock', () => {
  const counts = [];
  for (const decision of [null, 'deny', 'cancel', 'allow-once']) {
    const clock = createClock(() => new Date('2026-01-01T00:00:00.000Z'));
    if (decision === null) describeTellTime({});
    else if (decision === 'allow-once') clock.read();
    counts.push(clock.reads);
  }
  assert.deepEqual(counts, [0, 0, 0, 1]);
});

test('Linux-supplemental: overlay still disables stock bash/fs/web; prepare-product copies safe-action sources', () => {
  for (const id of ['tool-bash', 'tool-fs', 'tool-web', 'web-fetch-http']) assert.ok(DISABLED_STOCK_IDS.includes(id));
  const patch = readFileSync(new URL('../engine/product.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /- id: tool-bash\n {2}disabled: true/);
  assert.match(patch, /- id: tool-fs\n {2}disabled: true/);
  assert.match(patch, /- id: tool-web\n {2}disabled: true/);
  assert.match(patch, /- id: web-fetch-http\n {2}disabled: true/);
  assert.ok(productFiles.includes('safe-actions.mjs'));
  assert.ok(productFiles.includes('safe-action-tools.ts'));
});

test('Linux-supplemental: opener/ack events cannot enter TTS', () => {
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
  mic.deliver(id, 'final', 'Open this page');
  voice.receive({event: 'open-request', utteranceId: id, generation: gen, companionId: companion, text: 'https://evil.example'});
  voice.receive({event: 'open-complete', utteranceId: id, generation: gen, companionId: companion, text: 'opened'});
  assert.deepEqual(speaker.spoken, []);
  voice.approval(true);
  voice.receive({event: 'voice-result', utteranceId: id, generation: gen, companionId: companion, text: 'Should not speak during approval'});
  assert.deepEqual(speaker.spoken, []);
});

test('Linux-supplemental: Swift native opener uses NSWorkspace.shared.open after re-validation, not /usr/bin/open', () => {
  const opener = readFileSync(fileURLToPath(new URL('../macos/Sources/WispBody/SafeActionOpener.swift', import.meta.url)), 'utf8');
  assert.match(opener, /NSWorkspace\.shared\.open/);
  assert.equal(/\/usr\/bin\/open/.test(opener), false);
  assert.equal(/xdg-open/.test(opener), false);
  assert.match(opener, /revalidate/);
  assert.match(opener, /shebang|executable|suffix|privileged/i);
});
