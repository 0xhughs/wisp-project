import { completedTurn } from '../../spike/client.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validVoiceText(text) {
  return typeof text==='string' && text.trim().length>0 && text.length<=4000 && Buffer.byteLength(text)<=8000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text) && !/[\uD800-\uDFFF]/u.test(text);
}
export function validateVoice(value) {
  const keys=value?.op==='voice'?'companionId,generation,op,text,utteranceId':'companionId,generation,op,utteranceId';
  if(!value||!['voice','voice-cancel'].includes(value.op)||Object.keys(value).sort().join()!==keys||![value.generation,value.utteranceId,value.companionId].every(v=>typeof v==='string'&&uuid.test(v))||value.op==='voice'&&!validVoiceText(value.text)||Buffer.byteLength(JSON.stringify(value))>12000)throw Error('VOICE_FRAME');
  return value;
}
// The SDK emits attempts separately. Only the final committed assistant message,
// after the matching completed turn and idle, can supply speech content.
export function voiceCompletion(frames,sessionId,messageId) {
  const end=frames.find(f=>f.method==='session.event'&&f.params.sessionId===sessionId&&f.params.event.type==='turn/end');
  if(!end)return null;
  const kind=end.params.event.data.reason.kind;
  if(!['completed','aborted'].includes(kind))throw Error('VOICE_FAILED_TURN');
  const result=completedTurn(frames,sessionId,messageId,kind);
  if(!result)return null;
  if(kind==='aborted')return {...result,text:''};
  const final=frames.filter(f=>f.method==='session.event'&&f.params.sessionId===sessionId).map(f=>f.params.event).findLast(e=>e.type==='assistant/message'&&e.data.turn===result.turn&&!e.data.interrupted);
  const text=final?.data.message.content.filter(c=>c.type==='text'&&typeof c.text==='string').map(c=>c.text).join('\n').trim();
  if(!validVoiceText(text))throw Error('VOICE_ANSWER_UNAVAILABLE');
  return {...result,text};
}

// Reasoning route is owned by the attached bridge configuration, never the frame.
export function assertVoiceOwner(message,owner) {
  if(!owner.ready||owner.ending||!['local','deepseek'].includes(owner.selected)||message.generation!==owner.generation||message.companionId!==owner.companionId)throw Error('VOICE_OWNER');
}
