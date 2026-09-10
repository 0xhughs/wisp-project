import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVoice, voiceCompletion, assertVoiceOwner } from '../engine/voice-protocol.mjs';
import { Lines } from '../engine/body-bridge.mjs';
const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const frame={op:'voice',generation:id,utteranceId:id,companionId:id,text:'Hello é'};
test('strict bounded voice schema and split UTF8 survives every boundary',()=>{
  const bytes=Buffer.from(JSON.stringify(frame)+'\n');
  for(let i=1;i<bytes.length;i++){const decoder=new Lines();assert.deepEqual([...decoder.push(bytes.subarray(0,i)),...decoder.push(bytes.subarray(i))],[frame]);}
  assert.deepEqual(validateVoice(frame),frame);
  for(const mutation of [{sessionId:'foreign'},{text:''},{text:'a'.repeat(4001)},{text:'\ud800'},{generation:'x'},{text:'\0'}])assert.throws(()=>validateVoice({...frame,...mutation}));
  assert.throws(()=>new Lines().push(Buffer.from([0xc3,0x28,10])));
});
const event=(seq,type,data)=>({method:'session.event',params:{sessionId:'owned',event:{seq,type,data}}});
const complete=(kind='completed')=>[
 event(1,'turn/start',{turn:1}),event(2,'user/message',{id:'receipt'}),
 event(3,'assistant/message',{turn:1,interrupted:true,message:{content:[{type:'text',text:'abandoned'}]}}),
 event(4,'assistant/message',{turn:1,message:{content:[{type:'reasoning',text:'private'},{type:'tool_use',input:'raw'},{type:'text',text:'Final answer'}]}}),
 event(5,'turn/end',{turn:1,reason:{kind}}),{method:'session.status',params:{sessionId:'owned',status:'idle'}}];
test('committed correlated final only; aborted turn never speaks',()=>{
 assert.equal(voiceCompletion(complete(),'owned','receipt').text,'Final answer');
 assert.equal(voiceCompletion(complete('aborted'),'owned','receipt').text,'');
 assert.equal(voiceCompletion(complete(),'foreign','receipt'),null);
 assert.equal(voiceCompletion(complete().slice(0,-1),'owned','receipt'),null);
 assert.equal(voiceCompletion(complete(),'owned','wrong'),null);
 const failed=complete('error');assert.throws(()=>voiceCompletion(failed,'owned','receipt'));
});

test('local and DeepSeek owners admitted; unknown, unattached and stale routes rejected without inference',()=>{
 const owner={ready:true,ending:false,selected:'local',generation:id,companionId:id};
 for(const selected of ['local','deepseek']) {
  assert.doesNotThrow(()=>assertVoiceOwner(frame,{...owner,selected}));
  assert.doesNotThrow(()=>assertVoiceOwner({...frame,op:'voice-cancel'},{...owner,selected}));
  for(const mutation of [{ready:false},{ending:true},{selected:'unknown'},{selected:undefined},{generation:'foreign'},{companionId:'foreign'}])assert.throws(()=>assertVoiceOwner(frame,{...owner,selected,...mutation}));
 }
});
