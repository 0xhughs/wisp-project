import test from 'node:test';
import assert from 'node:assert/strict';
import { Lines, denyApproval } from '../engine/body-bridge.mjs';
test('fragmented and coalesced bounded owned-pipe messages',()=>{
 const lines=new Lines(); assert.deepEqual(lines.push(Buffer.from('{"op":"sm')),[]);
 assert.deepEqual(lines.push(Buffer.from('oke"}\n{"op":"stop"}\n')),[{op:'smoke'},{op:'stop'}]);
});
test('unknown, malformed, oversized and extra fields fail closed',()=>{
 for(const s of ['{','{"op":"shell"}\n','{"op":"smoke","prompt":"x"}\n','x'.repeat(16385)]) assert.throws(()=>new Lines().push(Buffer.from(s==='{'?'{\n':s)));
});
test('unexpected approval produces scoped denial, never allowance',()=>{
 const d={requestId:'r',sessionId:'s',callId:'c',actionDigest:'d'};
 assert.deepEqual(denyApproval(d),{...d,decision:'deny'}); assert.throws(()=>denyApproval({}));
});
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
async function failedProcess(input) {
 const child=spawn(process.execPath,[fileURLToPath(new URL('../engine/body-bridge.mjs',import.meta.url)),'--runtime-root','/wisp-deliberately-absent'],{stdio:['pipe','pipe','pipe']});
 let text=''; child.stdout.on('data',b=>text+=b);child.stderr.resume();child.stdin.on('error',()=>{});
 child.stdin.end(input);
 const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('cleanup timeout'))},3000);child.on('exit',code=>{clearTimeout(timer);resolve(code)})});
 return {result,frames:text.trim().split('\n').filter(Boolean).map(JSON.parse)};
}
test('real adapter subprocess exits on invalid runtime and duplicate shutdown input',async()=>{
 const {result,frames}=await failedProcess('{"op":"stop"}\n{"op":"stop"}\n');
 assert.equal(result,1);assert.equal(frames.filter(f=>f.event==='stopped').length,1);assert.ok(frames.find(f=>f.event==='unavailable'));
});
test('real adapter subprocess EOF cannot leave a child after failed startup',async()=>{
 const {result,frames}=await failedProcess('');assert.equal(result,1);assert.ok(frames.find(f=>f.event==='stopped'&&f.noOrphan));
});
