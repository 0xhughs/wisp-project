// Linux-supplemental. Proves owned VoiceState/VoiceController/lifecycle
// seams without Carbon, AppKit, microphone, TTS, Keychain, or live models.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VoiceActivation,
  VoiceHotKeyEdge,
  VoiceController,
  VoiceLifecycle,
  OwnedApprovals,
  RecognitionDouble,
  SynthesisDouble,
} from '../engine/voice-seams.mjs';

const gen = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const companion = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const requestId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

function event(name, id, extra = {}) {
  return {event: name, utteranceId: id, generation: gen, companionId: companion, ...extra};
}

function readyController() {
  const mic = new RecognitionDouble();
  const speaker = new SynthesisDouble();
  const voice = new VoiceController({recognition: mic, synthesis: speaker});
  const frames = [];
  voice.send = (frame) => {
    frames.push(frame);
    return true;
  };
  voice.ready = () => true;
  voice.localAvailable = () => true;
  voice.attach(gen, companion);
  return {mic, speaker, voice, frames};
}

function submitRecognized(voice, mic, text = 'Hello') {
  voice.activate();
  const id = voice.state.operationID;
  mic.deliver(id, 'released');
  mic.deliver(id, 'final', text);
  return id;
}

test('Linux-supplemental: cancel during processing waits for settle, sends voice-cancel, and does not claim rollback', () => {
  const {mic, speaker, voice, frames} = readyController();
  const id = submitRecognized(voice, mic, 'Think about this');
  assert.equal(voice.state.phase, 'processing');
  assert.equal(frames.filter((f) => f.op === 'voice').length, 1);
  voice.activate();
  assert.equal(voice.state.phase, 'releasing');
  assert.equal(voice.state.operationID, id);
  assert.equal(frames.some((f) => f.op === 'voice-cancel' && f.utteranceId === id), true);
  assert.equal(voice.activate(), undefined);
  assert.equal(mic.captures, 1);
  assert.match(voice.status, /Stopping|Waiting/i);
  assert.equal(/rollback|rolled back|undone|reverted/i.test(voice.status), false);
  voice.receive(event('voice-result', id, {text: 'Committed answer'}));
  assert.deepEqual(speaker.spoken, []);
  assert.equal(voice.state.phase, 'releasing');
  voice.receive(event('voice-settled', id, {cancelled: false}));
  assert.equal(voice.state.phase, 'idle');
  assert.deepEqual(speaker.spoken, []);
  assert.equal(/rollback|rolled back/i.test(voice.status), false);
  mic.deliver(id, 'final', 'stale after cancel');
  speaker.deliver(id, 'started');
  assert.equal(voice.state.phase, 'idle');
  assert.deepEqual(speaker.spoken, []);
});

test('Linux-supplemental: pending native approval suppresses speech; Apply/Quit/home/engineStopped cannot revive grants or replies', () => {
  const {mic, speaker, voice} = readyController();
  const approvals = new OwnedApprovals();
  const lifecycle = new VoiceLifecycle({voice, approvals});
  approvals.attach(gen, companion);
  const id = submitRecognized(voice, mic, 'Append one verification record');
  approvals.receive({generation: gen, companionID: companion, requestID: requestId});
  voice.approval(true);
  assert.equal(voice.state.phase, 'approval');
  voice.receive(event('voice-result', id, {text: 'Not an approved answer'}));
  assert.deepEqual(speaker.spoken, []);
  assert.equal(voice.state.phase, 'approval');
  lifecycle.wake();
  assert.equal(voice.state.phase, 'releasing');
  assert.equal(approvals.decide(requestId, 'allow-once'), null);

  lifecycle.apply();
  assert.equal(voice.state.phase, 'releasing');
  assert.equal(approvals.decide(requestId, 'allow-once'), null);
  voice.receive(event('voice-result', id, {text: 'Reply after Apply'}));
  voice.receive(event('voice-settled', id, {cancelled: false}));
  assert.deepEqual(speaker.spoken, []);
  assert.equal(approvals.requests.length, 0);

  lifecycle.engineStopped();
  assert.equal(['idle', 'unavailable'].includes(voice.state.phase) || voice.state.operationID == null, true);
  voice.receive(event('voice-result', id, {text: 'Reply after engine stop'}));
  assert.deepEqual(speaker.spoken, []);
  assert.equal(approvals.decide(requestId, 'allow-once'), null);

  const quit = readyController();
  const quitApprovals = new OwnedApprovals();
  const quitLife = new VoiceLifecycle({voice: quit.voice, approvals: quitApprovals});
  quitApprovals.attach(gen, companion);
  const quitId = submitRecognized(quit.voice, quit.mic, 'Quit while waiting');
  quitApprovals.receive({generation: gen, companionID: companion, requestID: requestId});
  quit.voice.approval(true);
  quitLife.quit();
  assert.equal(quitApprovals.decide(requestId, 'allow-once'), null);
  quit.voice.receive(event('voice-result', quitId, {text: 'Reply after Quit'}));
  assert.deepEqual(quit.speaker.spoken, []);
  assert.equal(quit.voice.generation, '');

  const home = readyController();
  const homeApprovals = new OwnedApprovals();
  const homeLife = new VoiceLifecycle({voice: home.voice, approvals: homeApprovals});
  homeApprovals.attach(gen, companion);
  const homeId = submitRecognized(home.voice, home.mic, 'Home invalidated');
  homeApprovals.receive({generation: gen, companionID: companion, requestID: requestId});
  home.voice.approval(true);
  homeLife.homeInvalidation();
  assert.equal(homeApprovals.decide(requestId, 'deny'), null);
  home.voice.receive(event('voice-result', homeId, {text: 'Reply after home invalidation'}));
  assert.deepEqual(home.speaker.spoken, []);
});

test('Linux-supplemental: muted activation captures nothing; unmute never auto-listens', () => {
  const {mic, voice} = readyController();
  const config = {...voice.configuration, muted: true};
  voice.configure(config);
  assert.equal(voice.state.phase, 'muted');
  voice.activate();
  assert.equal(mic.captures, 0);
  assert.equal(voice.state.phase, 'muted');
  assert.equal(voice.state.operationID, null);
  config.muted = false;
  voice.configure(config);
  assert.equal(voice.state.phase, 'idle');
  assert.equal(mic.captures, 0);
  assert.equal(voice.state.muted, false);
});

test('Linux-supplemental: shortcut-registration unavailable still allows Wake on the same state machine', () => {
  const {mic, voice} = readyController();
  const lifecycle = new VoiceLifecycle({voice, shortcutRegistered: false});
  assert.equal(VoiceActivation.wakeAllowed(false), true);
  assert.match(VoiceActivation.shortcutStatus(false), /unavailable \(conflict\); use Wake/);
  assert.equal(lifecycle.shortcutRegistered, false);
  lifecycle.wake();
  assert.equal(mic.captures, 1);
  assert.equal(voice.state.phase, 'listening');
  const edge = new VoiceHotKeyEdge();
  const first = edge.handle(true);
  const repeat = edge.handle(true);
  const release = edge.handle(false);
  assert.deepEqual(first, {edge: 'pressed', activates: true});
  assert.deepEqual(repeat, {edge: 'pressed', activates: false});
  assert.deepEqual(release, {edge: 'released', activates: false});
});

test('Linux-supplemental: stale generation and utterance cannot speak', () => {
  const {mic, speaker, voice} = readyController();
  const id = submitRecognized(voice, mic, 'Current request');
  voice.receive(event('voice-result', 'dddddddd-dddd-4ddd-dddd-dddddddddddd', {text: 'Wrong utterance'}));
  assert.deepEqual(speaker.spoken, []);
  voice.engineStopped();
  voice.attach('eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', companion);
  voice.receive(event('voice-result', id, {text: 'Old generation reply'}));
  voice.receive(event('voice-settled', id, {cancelled: false}));
  assert.deepEqual(speaker.spoken, []);
  assert.notEqual(voice.state.phase, 'speaking');
});
