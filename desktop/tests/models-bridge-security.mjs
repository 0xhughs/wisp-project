import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,readdirSync,lstatSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),o=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[i*2],args[i*2+1]]));
const root=resolve(o['--scratch']);assert.ok(!existsSync(root));mkdirSync(root,{recursive:true,mode:0o700});writeFileSync(join(root,'.wisp-owned'),'bridge-security',{mode:0o600});
const meta=JSON.parse(readFileSync(join(o['--runtime-root'],'.wisp-spike.json'))),sentinel='wisp-response-echo-'+randomUUID();let calls=0;
const server=createServer(async(req,res)=>{for await(const _ of req){}calls++;res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:sentinel}}));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const memory=join(root,'snapshot.json');writeFileSync(memory,JSON.stringify({version:1,companionId:randomUUID(),revision:'a'.repeat(64),memory:{version:1,entries:[]}}),{mode:0o600});
const c={version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:`http://127.0.0.1:${server.address().port}/v1`,cloudModel:'deepseek-v4-flash',cloudKeyID:''};
async function run(name,frames) {
 const child=spawn(meta.node,[fileURLToPath(new URL('../engine/body-bridge.mjs',import.meta.url)),'--runtime-root',resolve(o['--runtime-root']),'--scratch',root,'--memory-file',memory,'--developer','false'],{stdio:['pipe','pipe','pipe'],env:{PATH:'/usr/bin:/bin',DEEPSEEK_API_KEY:'unrelated-ambient-sentinel'}});
 let output='',errors='',tail='';const events=[];child.stdin.on('error',()=>{});
 child.stdout.on('data',b=>{output+=b;tail+=b;const lines=tail.split('\n');tail=lines.pop();for(const line of lines){const e=JSON.parse(line);events.push(e);if(e.event==='ready')child.stdin.write('{"op":"test"}\n');}});child.stderr.on('data',b=>errors+=b);
 for(const frame of frames)child.stdin.write(JSON.stringify(frame)+'\n');
 const code=await new Promise((r,j)=>{const timer=setTimeout(()=>{child.kill();j(Error('bridge-timeout'))},60000);child.on('exit',code=>{clearTimeout(timer);r(code)})});
 assert.equal(code,1);assert.ok(events.some(e=>e.event==='stopped'&&e.noOrphan));assert.ok(!output.includes(sentinel)&&!errors.includes(sentinel));
 return {name,unavailable:events.some(e=>e.event==='unavailable'),productOutputSafe:true,events:events.map(e=>e.event)};
}
let results;
try {results=[await run('hostile-error',[{op:'configure',configuration:c}]),await run('duplicate-bootstrap',[{op:'configure',configuration:c},{op:'configure',configuration:c}]),await run('missing-cloud-key',[{op:'configure',configuration:{...c,selected:'deepseek'}}])];}finally{await new Promise(r=>server.close(r));}
function files(p){return readdirSync(p).flatMap(n=>{const f=join(p,n),s=lstatSync(f);return s.isSymbolicLink()?[]:s.isDirectory()?files(f):[f]});}
const leaks=files(root).filter(p=>readFileSync(p).includes(Buffer.from(sentinel)));assert.deepEqual(leaks,[]);assert.equal(calls,1);
const result={results,requests:calls,sentinelAbsentFromProductAndArtifacts:true,externalRequests:0};writeFileSync(join(root,'sanitized-results.json'),JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result,null,2));
