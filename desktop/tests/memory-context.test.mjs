import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSnapshot,readSnapshot} from '../engine/memory-schema.mjs';
import {apply} from '../engine/memory-context.mjs';
import {mkdtempSync,writeFileSync,symlinkSync,linkSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const fixture=()=>({version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[{id:'b688c6a5-c493-42ef-8714-33fc4da2c7a9',category:'fact',text:'literal {{unknown}} 🦊\nمرحبا'}]}});
test('strict schema preserves literal text and refuses authority fields',()=>{
 assert.deepEqual(validateSnapshot(fixture()),fixture());
 for(const mutate of [s=>s.version=true,s=>s.memory.entries.push(s.memory.entries[0]),s=>s.memory.entries[0].text='x'.repeat(2001),s=>s.memory.path='../secret',s=>s.credentials='secret']){const s=fixture();mutate(s);assert.throws(()=>validateSnapshot(s));}
});
test('plugin registers knowledge through a variable without tools or complete override',()=>{
 let section,variable;apply({systemPrompt:{variable:(name,fn)=>{assert.equal(name,'wisp_memory');variable=fn},section:s=>section=s}},fixture());
 assert.equal(section.complete,undefined);assert.ok(section.text.includes('{{wisp_memory}}'));assert.ok(!section.text.includes('{{unknown}}'));assert.deepEqual(JSON.parse(variable()),fixture().memory);
});
test('startup file enforces ownership modes links and bound',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-memory-check-'));try{
 const path=join(dir,'snapshot');writeFileSync(path,JSON.stringify(fixture()),{mode:0o600});assert.deepEqual(readSnapshot(path),fixture());
 chmodSync(path,0o644);assert.throws(()=>readSnapshot(path));chmodSync(path,0o600);
 const linked=join(dir,'link');symlinkSync(path,linked);assert.throws(()=>readSnapshot(linked));rmSync(linked);linkSync(path,linked);assert.throws(()=>readSnapshot(path));
 }finally{rmSync(dir,{recursive:true});}
});
