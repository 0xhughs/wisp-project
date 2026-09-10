// Test-only loopback fixture: never alters product endpoint policy or sends external traffic.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync,readFileSync,readdirSync,lstatSync,existsSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Client,completedTurn} from '../../spike/client.mjs';
import {environment,PIN} from '../../spike/prepare.mjs';
import {profileFor} from '../engine/reasoning-config.mjs';
const args=process.argv.slice(2),o=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[i*2],args[i*2+1]]));
const root=resolve(o['--scratch']),runtime=realpathSync(o['--runtime-root']);assert.ok(!existsSync(root));mkdirSync(root,{recursive:true,mode:0o700});
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));assert.equal(meta.pin,PIN);
const sentinel='wisp-disposable-wire-'+randomUUID(),requests=[];let scenario='success';
const server=createServer(async(req,res)=>{
 let raw='';for await(const bytes of req){raw+=bytes;if(raw.length>1000000){req.destroy();return;}}
 const body=JSON.parse(raw);requests.push({model:body.model,cap:body.max_tokens,auth:req.headers.authorization===`Bearer ${sentinel}`,url:req.url});
 if(scenario==='failure'){res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:sentinel,type:'authentication_error'}}));return;}
 res.writeHead(200,{'content-type':'text/event-stream'});
 for(const c of [{delta:{role:'assistant',content:'Hello Wisp.'},finish_reason:null},{delta:{},finish_reason:'stop'}])res.write('data: '+JSON.stringify({id:'fixture',object:'chat.completion.chunk',created:1,model:body.model,choices:[{index:0,...c}]})+'\n\n');res.end('data: [DONE]\n\n');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results={};
async function run(name,withKey=true) {
 const home=join(root,name);mkdirSync(home,{mode:0o700});for(const d of ['workspace','dsh-home','tmp'])mkdirSync(join(home,d),{mode:0o700});
 const c={version:1,selected:'deepseek',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:randomUUID()};
 const route=profileFor(c);route.profile.baseURL=`http://127.0.0.1:${server.address().port}/v1`;
 writeFileSync(join(home,'dsh-home/settings.yaml'),JSON.stringify({'llm-pi-ai':{providers:{deepseek:route.profile}}}),{mode:0o600});
 const patch=join(home,'fixture.patch.yml');writeFileSync(patch,readFileSync(new URL('../engine/product.patch.yml',import.meta.url),'utf8').replace('__WISP_PRODUCT_ADAPTER__',JSON.stringify(join(runtime,'upstream/wisp-product/engine/product-sdk.ts'))),{mode:0o600});
 const env={...environment(home,meta.pnpm),TSX_TSCONFIG_PATH:join(runtime,'upstream/tsconfig.json'),WISP_COMPANION_ID:randomUUID(),WISP_ENGINE_GENERATION:randomUUID(),DEEPSEEK_API_KEY:'unrelated-ambient-canary'};
 if(withKey)env.WISP_REASONING_CLOUD_KEY=sentinel;
 const client=new Client(meta.node,['--import',meta.tsx,join(runtime,'upstream/apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch],{cwd:join(home,'workspace'),env});
 try {
  await client.request('initialize',{cwd:join(home,'workspace'),provider:'deepseek',model:c.cloudModel});
  const sessionId='wisp-'+randomUUID(),start=client.frames.length;
  const receipt=await client.request('session/prompt',{sessionId,contentBlocks:[{type:'text',text:'Reply with a short greeting. Do not use tools.'}]});
  if(name==='success')await client.wait(f=>completedTurn(f.slice(start),sessionId,receipt.messageId));
  else await client.wait(f=>f.some(x=>x.method==='session.event'&&x.params.event.type==='turn/end'));
 } finally { await client.shutdown().catch(()=>client.force()); }
 results[name]={requests:requests.length,orphanFree:true,framesContainSentinel:JSON.stringify(client.frames).includes(sentinel),stderrContainsSentinel:client.stderr.includes(sentinel)};
}
try {await run('success');scenario='failure';await run('failure');await run('missing',false);}finally{await new Promise(resolve=>server.close(resolve));}
function files(path){return readdirSync(path).flatMap(n=>{const p=join(path,n);const st=lstatSync(p);return st.isSymbolicLink()?[]:st.isDirectory()?files(p):[p]});}
const leaked=files(root).filter(p=>readFileSync(p).includes(Buffer.from(sentinel))).map(p=>p.slice(root.length+1));
results.wire={requests:requests.length,authMatches:requests.every(r=>r.auth),caps:requests.map(r=>r.cap),models:requests.map(r=>r.model),missingReferenceNoAmbientFallback:results.missing.requests===results.failure.requests};results.artifactSentinelPaths=leaked;
writeFileSync(join(root,'sanitized-results.json'),JSON.stringify(results,null,2),{mode:0o600});
console.log(JSON.stringify(results,null,2));
assert.equal(requests.length,2);assert.ok(results.wire.authMatches);assert.ok(requests.every(r=>r.cap===1024&&r.model==='deepseek-v4-flash'));assert.ok(results.wire.missingReferenceNoAmbientFallback);assert.deepEqual(leaked,[]);
