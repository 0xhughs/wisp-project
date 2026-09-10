// Linux-supplemental owned double of VoiceState, VoiceController, Wake/shortcut
// policy and Apply/Quit/home/engineStopped approval close. Not a speech engine.
// Does not replace SFSpeechRecognizer, AVSpeechSynthesizer, Carbon, or Harness.
import { randomUUID } from 'node:crypto';

export const VoiceActivation = {
  shortcutLabel: 'Option–Space',
  shortcutStatus(registered) {
    return `${this.shortcutLabel} · ${registered ? 'registered' : 'unavailable (conflict); use Wake'}`;
  },
  wakeAllowed(_shortcutRegistered) {
    return true;
  },
};

export class VoiceHotKeyEdge {
  held = false;
  handle(isPressed) {
    const activates = isPressed && !this.held;
    const edge = isPressed ? 'pressed' : 'released';
    this.held = isPressed;
    return {edge, activates};
  }
  reset() {
    this.held = false;
  }
}

export function validVoiceText(text) {
  if (typeof text !== 'string') return false;
  if (text.trim() === '') return false;
  if (text.length > 4000 || Buffer.byteLength(text) > 8000) return false;
  for (const code of text) {
    const value = code.codePointAt(0);
    if (value < 32 && value !== 9 && value !== 10 && value !== 13) return false;
  }
  return true;
}

export class VoiceState {
  phase = 'idle';
  operationID = null;
  muted = false;
  answerReady = false;
  activate({ready = false, repeatKey = false} = {}) {
    if (repeatKey || this.muted) return null;
    switch (this.phase) {
      case 'idle':
      case 'unavailable':
        if (!ready) {
          this.phase = 'unavailable';
          return null;
        }
        this.operationID = randomUUID();
        this.answerReady = false;
        this.phase = 'listening';
        break;
      case 'listening':
        this.phase = 'finalizing';
        break;
      case 'processing':
      case 'approval':
      case 'speaking':
      case 'finalizing':
        this.cancel();
        break;
      case 'muted':
      case 'releasing':
        return null;
    }
    return this.operationID;
  }
  finishing(id) {
    if (this.operationID === id && this.phase === 'listening') this.phase = 'finalizing';
  }
  recognized(text, id) {
    if (this.operationID !== id || this.muted || !['listening', 'finalizing'].includes(this.phase) || !validVoiceText(text)) return false;
    this.phase = 'processing';
    return true;
  }
  approval(id, pending) {
    if (this.operationID !== id || !['processing', 'approval'].includes(this.phase)) return;
    this.phase = pending ? 'approval' : 'processing';
  }
  answer(id) {
    if (this.operationID !== id || this.muted || this.phase !== 'processing' || this.answerReady) return false;
    this.answerReady = true;
    return true;
  }
  speechStarted(id) {
    if (this.operationID !== id || this.muted || this.phase !== 'processing' || !this.answerReady) return false;
    this.phase = 'speaking';
    return true;
  }
  cancel() {
    if (this.operationID != null) {
      this.phase = 'releasing';
      this.answerReady = false;
    }
  }
  setMuted(value) {
    this.muted = value;
    if (this.operationID != null) this.cancel();
    else this.phase = value ? 'muted' : 'idle';
  }
  released(id) {
    if (this.operationID !== id) return;
    this.operationID = null;
    this.answerReady = false;
    this.phase = this.muted ? 'muted' : 'idle';
  }
  fail(id) {
    if (id != null && this.operationID !== id) return;
    this.operationID = null;
    this.answerReady = false;
    this.phase = 'unavailable';
  }
}

export class RecognitionDouble {
  availability = null;
  events = {};
  current = null;
  captures = 0;
  start(_locale, id, event) {
    this.current = id;
    this.events[id] = event;
    this.captures += 1;
    event(id, {type: 'capturing'});
  }
  finish() {}
  cancel() {}
  deliver(id, type, value) {
    const event = this.events[id];
    if (!event) return;
    if (type === 'final') event(id, {type: 'final', text: value});
    else if (type === 'failed') event(id, {type: 'failed', message: value});
    else event(id, {type});
  }
}

export class SynthesisDouble {
  events = {};
  spoken = [];
  stops = 0;
  speak(text, id, event) {
    this.spoken.push(text);
    this.events[id] = event;
  }
  cancel() {
    this.stops += 1;
  }
  deliver(id, type) {
    this.events[id]?.(id, type);
  }
}

export class VoiceController {
  state = new VoiceState();
  configuration = {locale: 'en-US', muted: false};
  status = 'Activate Wake or the shortcut to speak. Audio stays on this Mac.';
  generation = '';
  companion = '';
  captureOwned = false;
  reasoningOwned = false;
  speechOwned = false;
  pendingReply = null;
  blocked = false;
  send = null;
  ready = null;
  localAvailable = () => true;
  closeOwnedApprovals = null;
  changed = null;
  constructor({recognition = new RecognitionDouble(), synthesis = new SynthesisDouble()} = {}) {
    this.recognition = recognition;
    this.synthesis = synthesis;
  }
  get available() {
    return !this.blocked && this.recognition.availability == null && this.localAvailable(this.configuration.locale) && this.ready?.() === true && this.generation !== '';
  }
  attach(generation, companion) {
    this.generation = generation;
    this.companion = companion;
    this.changed?.();
  }
  configure(value) {
    this.configuration = value;
    this.state.setMuted(!!value.muted);
    if (this.state.phase === 'releasing') {
      this.closeOwnedApprovals?.();
      this.releaseResources();
    }
    this.changed?.();
  }
  activate() {
    const previous = this.state.phase;
    const id = this.state.activate({ready: this.available});
    if (!id) {
      if (!this.state.muted && !this.available) {
        this.status = this.recognition.availability ?? (!this.localAvailable(this.configuration.locale) ? `On-device recognition is unavailable for ${this.configuration.locale}.` : this.readinessIssue ?? 'Attach a supported reasoning provider in Models before speaking.');
      }
      this.changed?.();
      return;
    }
    switch (this.state.phase) {
      case 'listening':
        this.captureOwned = true;
        this.status = 'Waiting for Wisp microphone and speech permissions, then listening.';
        this.recognition.start(this.configuration.locale, id, (operation, event) => this.recognitionEvent(operation, event));
        break;
      case 'finalizing':
        if (previous === 'listening') {
          this.status = 'Finishing this utterance…';
          this.recognition.finish();
        }
        break;
      case 'releasing':
        this.closeOwnedApprovals?.();
        this.releaseResources();
        break;
    }
    this.changed?.();
  }
  cancel() {
    this.state.cancel();
    this.closeOwnedApprovals?.();
    this.releaseResources();
    this.changed?.();
  }
  frame(op, id) {
    return {op, generation: this.generation, companionId: this.companion, utteranceId: id};
  }
  recognitionEvent(id, event) {
    if (this.state.operationID !== id) return;
    switch (event.type) {
      case 'finalizing':
        this.state.finishing(id);
        this.status = 'Finishing this utterance…';
        break;
      case 'capturing':
        this.status = 'Listening. Activate again to finish; Mute cancels.';
        break;
      case 'released':
        this.captureOwned = false;
        this.completeRelease(id);
        break;
      case 'final':
        if (!this.state.recognized(event.text, id)) return;
        {
          const message = this.frame('voice', id);
          message.text = event.text;
          if (this.send?.(message) !== true) {
            this.fail('The voice request could not be sent. Apply the selected model before retrying.');
            return;
          }
        }
        this.reasoningOwned = true;
        this.status = 'Wisp is thinking. Activate again to cancel.';
        break;
      case 'failed':
        this.captureOwned = false;
        this.fail(event.message);
        break;
    }
    this.changed?.();
  }
  receive(event) {
    if (event.generation !== this.generation || event.companionId !== this.companion || event.utteranceId !== this.state.operationID) return;
    const id = event.utteranceId;
    switch (event.event) {
      case 'voice-result':
        if (this.state.phase !== 'processing' || typeof event.text !== 'string' || !validVoiceText(event.text) || this.pendingReply != null) return;
        this.pendingReply = event.text;
        break;
      case 'voice-settled':
        this.reasoningOwned = false;
        if (this.state.phase === 'releasing') this.completeRelease(id);
        else if (event.cancelled === true) {
          this.pendingReply = null;
          this.state.released(id);
          this.status = 'Request cancelled. Activate to speak again.';
        } else if (this.pendingReply && this.state.answer(id)) {
          const text = this.pendingReply;
          this.pendingReply = null;
          this.speechOwned = true;
          this.status = 'Preparing the spoken reply…';
          this.synthesis.speak(text, id, (operation, speechEvent) => this.speechEvent(operation, speechEvent));
        } else this.fail('No committed spoken reply was available. Activate to try a new request.');
        break;
      case 'voice-failed':
        this.status = 'Reasoning failed. Waiting for its process to stop…';
        this.state.cancel();
        this.releaseResources();
        break;
    }
    this.changed?.();
  }
  speechEvent(id, event) {
    if (this.state.operationID !== id) return;
    if (event === 'started') {
      if (this.state.speechStarted(id)) this.status = 'Speaking. Activate again to stop.';
    } else if (event === 'finished' || event === 'cancelled') {
      this.speechOwned = false;
      this.state.released(id);
      this.status = this.state.muted ? 'Voice is muted.' : 'Ready for another explicit activation.';
    }
    this.changed?.();
  }
  approval(pending) {
    const id = this.state.operationID;
    if (!id) return;
    this.state.approval(id, pending);
    if (pending) {
      this.pendingReply = null;
      this.synthesis.cancel();
      this.status = 'Waiting for the native action decision.';
    }
    this.changed?.();
  }
  releaseResources() {
    const id = this.state.operationID;
    if (!id) return;
    this.pendingReply = null;
    this.status = 'Stopping and releasing this voice operation…';
    if (this.captureOwned) this.recognition.cancel();
    if (this.speechOwned) this.synthesis.cancel();
    if (this.reasoningOwned && this.send?.(this.frame('voice-cancel', id)) !== true) {
      this.status = 'Waiting for the reasoning process to stop.';
    }
    this.completeRelease(id);
  }
  completeRelease(id) {
    if (this.state.phase === 'releasing' && !this.captureOwned && !this.speechOwned && !this.reasoningOwned) {
      this.state.released(id);
      this.status = this.state.muted ? 'Voice is muted.' : 'Cancelled. Activate to speak again.';
    }
  }
  engineStopped() {
    this.generation = '';
    this.reasoningOwned = false;
    if (this.state.operationID) {
      const id = this.state.operationID;
      this.state.cancel();
      this.releaseResources();
      this.completeRelease(id);
    }
    this.changed?.();
  }
  fail(message) {
    this.pendingReply = null;
    this.status = message;
    this.state.fail();
    this.changed?.();
  }
}

export class OwnedApprovals {
  generation = '';
  companionID = '';
  requests = [];
  deciding = new Set();
  attach(generation, companionID) {
    this.invalidate();
    this.generation = generation;
    this.companionID = companionID;
  }
  invalidate() {
    this.requests = [];
    this.deciding = new Set();
    this.generation = '';
    this.companionID = '';
  }
  receive(request) {
    if (request.generation !== this.generation || request.companionID !== this.companionID) throw new Error('stale');
    if (this.requests.some((item) => item.requestID === request.requestID)) throw new Error('stale');
    this.requests.push(request);
  }
  decide(id, action) {
    if (!['allow-once', 'deny', 'cancel'].includes(action) || this.deciding.has(id)) return null;
    const request = this.requests.find((item) => item.requestID === id);
    if (!request) return null;
    if (action === 'cancel') this.requests.forEach((item) => this.deciding.add(item.requestID));
    else this.deciding.add(id);
    return {decision: action, requestId: id, generation: request.generation};
  }
  cancelAll() {
    const pending = this.requests.find((item) => !this.deciding.has(item.requestID));
    if (!pending) return null;
    return this.decide(pending.requestID, 'cancel');
  }
}

export class VoiceLifecycle {
  constructor({voice, approvals = new OwnedApprovals(), shortcutRegistered = true} = {}) {
    this.voice = voice;
    this.approvals = approvals;
    this.shortcutRegistered = shortcutRegistered;
    voice.closeOwnedApprovals = () => {
      this.approvals.cancelAll();
    };
  }
  wake() {
    if (!VoiceActivation.wakeAllowed(this.shortcutRegistered)) return;
    this.voice.activate();
  }
  apply() {
    this.voice.cancel();
    this.approvals.invalidate();
  }
  quit() {
    this.voice.cancel();
    this.approvals.invalidate();
    this.voice.engineStopped();
  }
  homeInvalidation() {
    this.voice.cancel();
    this.approvals.invalidate();
    this.voice.engineStopped();
  }
  engineStopped() {
    this.voice.engineStopped();
    this.approvals.invalidate();
  }
}
