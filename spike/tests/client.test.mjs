import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrame, completedTurn } from '../client.mjs';
test('fabricated transport frames: reject stdout pollution',()=>{assert.throws(()=>parseFrame('debug log'));assert.throws(()=>parseFrame('{}'));});
const ev=(seq,type,data)=>({method:'session.event',params:{sessionId:'s',event:{seq,type,data}}});
const frames=[ev(0,'turn/start',{turn:1}),ev(1,'user/message',{id:'m'}),ev(2,'assistant/message',{turn:1,message:{content:[{type:'text',text:'ok'}]}}),ev(3,'turn/end',{turn:1,reason:{kind:'completed'}}),{method:'session.status',params:{sessionId:'s',status:'idle'}}];
test('fabricated transport frames: pre-reply events correlate exact receipt',()=>assert.equal(completedTurn(frames,'s','m').text,'ok'));
test('ack/early idle/text alone are insufficient',()=>assert.equal(completedTurn(frames.slice(0,3),'s','m'),null));
test('aborted, gapped, wrong receipt and interrupted do not pass',()=>{assert.equal(completedTurn(frames,'s','other'),null);for(const mutate of [f=>f[3].params.event.data.reason.kind='aborted', f=>f[2].params.event.seq=8,f=>f[2].params.event.data.interrupted=true]) {const f=structuredClone(frames);mutate(f);assert.throws(()=>completedTurn(f,'s','m'));}});

import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zstdCompressSync } from 'node:zlib';
import { readDurableSession } from '../client.mjs';
test('audit reads all compressed frames in owned sessions, ignores dependency cycles',()=>{
 const home=mkdtempSync(join(tmpdir(),'wisp-audit-'));
 try {
  const dir=join(home,'sessions','project','s');mkdirSync(dir,{recursive:true});
  mkdirSync(join(home,'profiles'));symlinkSync(home,join(home,'profiles','cycle'));
  symlinkSync(home,join(home,'sessions','outside'));
  writeFileSync(join(dir,'session.v2.jsonl.zstd'),Buffer.concat([{type:'session',id:'s'}, {type:'turn/end',data:{turn:1}}].map(r=>zstdCompressSync(JSON.stringify(r)+'\n'))));
  assert.equal(readDurableSession(home,'s').records[1].type,'turn/end');
  assert.throws(()=>readDurableSession(home,'other'));
 }finally{rmSync(home,{recursive:true,force:true});}
});

import { loadAuthorizedRoute } from '../prepare.mjs';
test('missing or changed live metadata is a sanitized unavailable resource error',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-route-'));
 try{
  assert.throws(()=>loadAuthorizedRoute(join(dir,'absent')),/^Error: LIVE_RESOURCE_UNAVAILABLE$/);
  const file=join(dir,'route.json');writeFileSync(file,'{"baseURL":"http://unexpected.invalid","credential":"private test marker"}');
  assert.throws(()=>loadAuthorizedRoute(file),/^Error: LIVE_RESOURCE_UNAVAILABLE$/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('pre-turn or pre-end idle cannot complete a turn; post-end idle works before receipt reply',()=>{
 const oldIdle=frames.at(-1),turnEvents=frames.slice(0,-1);
 for(const premature of [[oldIdle,...turnEvents],[...turnEvents.slice(0,-1),oldIdle,turnEvents.at(-1)]]) {
  assert.equal(completedTurn(premature,'s','m'),null);
  assert.equal(completedTurn([...premature,{method:'session.status',params:{sessionId:'other',status:'idle'}}],'s','m'),null);
  assert.equal(completedTurn([...premature,oldIdle],'s','m').text,'ok');
 }
});
