import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectOllama,ollamaOriginFromEndpoint,requestPull,assertPullAllowed,validateResourcePlan,readResourcePlan,writeResourcePlan,setupFeedback} from '../engine/ollama-inspect.mjs';
import {collectLinuxHardware,recommend,RECOMMENDED_LOCAL} from '../engine/hardware-inspect.mjs';

function plan(consent=true){
 return {version:1,source:'ollama-library:qwen3:8b',purpose:'install-recommended-local-model',expectedBytes:5_228_000_000,sizeUnavailable:false,destinationKind:'ollama-models-volume',consent};
}

async function withFixture({version='0.11.0',models=[{name:'qwen3:8b',size:5_228_000_000},{name:'tinyllama:latest',size:637_000_000}],oversize=false}={},fn){
 const hits=[];
 const server=createServer((req,res)=>{
  hits.push({method:req.method,url:req.url});
  if(req.method==='POST'&&req.url==='/api/pull'){res.writeHead(200,{'content-type':'application/json'});res.end('{"status":"fixture"}');return;}
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(req.url==='/api/version'){
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({version,extra:'ignored'}));
   return;
  }
  if(req.url==='/api/tags'){
   const payload=oversize?{models,pad:'x'.repeat(70_000)}:{models,extra:'ignored'};
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify(payload));
   return;
  }
  res.writeHead(404);res.end();
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 assert.notEqual(port,11434);
 try{await fn({port,hits,endpoint:`http://127.0.0.1:${port}/v1`});}
 finally{await new Promise(r=>server.close(r));}
}

test('loopback enforcement rejects non-loopback before any HTTP',async()=>{
 let called=0;
 const fetchImpl=async()=>{called+=1;throw new Error('must-not-fetch');};
 await assert.rejects(()=>inspectOllama({localEndpoint:'http://192.0.2.8:11434/v1',fetchImpl}),/MODELS_INVALID/);
 await assert.rejects(()=>inspectOllama({localEndpoint:'https://127.0.0.1:11434/v1',fetchImpl}),/MODELS_INVALID/);
 await assert.rejects(()=>inspectOllama({localEndpoint:'http://example.com:11434/v1',fetchImpl}),/MODELS_INVALID/);
 assert.equal(called,0);
 assert.equal(ollamaOriginFromEndpoint('http://127.0.0.1:11434/v1'),'http://127.0.0.1:11434');
 assert.equal(ollamaOriginFromEndpoint('http://localhost:1234/v1'),'http://localhost:1234');
 assert.equal(ollamaOriginFromEndpoint('http://[::1]:11434/v1'),'http://[::1]:11434');
});

test('GET-only inspect maps fixture tags with sizes and never POSTs pull',async()=>{
 await withFixture({},async({endpoint,hits})=>{
  const report=await inspectOllama({localEndpoint:endpoint,timeoutMs:1500});
  assert.equal(report.status,'ok');
  assert.equal(report.version,'0.11.0');
  assert.equal(report.models.find(m=>m.name==='qwen3:8b').size,5_228_000_000);
  assert.ok(hits.every(h=>h.method==='GET'));
  assert.ok(hits.some(h=>h.url==='/api/version'));
  assert.ok(hits.some(h=>h.url==='/api/tags'));
  assert.ok(!hits.some(h=>h.url==='/api/pull'));
  assert.match(setupFeedback(report),/Ollama/);
  const snapshot=collectLinuxHardware({io:{
   exists:()=>false,readFile:(p)=>p==='/proc/meminfo'?'MemTotal: 8000000 kB\nMemAvailable: 4000000 kB\n':p==='/proc/cpuinfo'?'processor\t: 0\nmodel name\t: Fixture\n':{error:'ENOENT'},
   readDir:()=>[],statfs:()=>({bsize:4096,bavail:2000}),env:()=>({}),platform:()=>'linux',
  }});
  const rec=recommend({snapshot,ollama:report});
  assert.equal(rec.choices.find(c=>c.slot==='recommended').identifier,RECOMMENDED_LOCAL);
  assert.ok(!hits.some(h=>h.method==='POST'));
 });
});

test('inspect does not HTTP to 11434 when the fixture uses an ephemeral loopback port',async()=>{
 await withFixture({},async({port,endpoint})=>{
  assert.notEqual(port,11434);
  const report=await inspectOllama({localEndpoint:endpoint,timeoutMs:1500});
  assert.equal(report.status,'ok');
 });
});

test('empty fixture tag list is inspect-ok with no models',async()=>{
 await withFixture({models:[]},async({endpoint,hits})=>{
  const report=await inspectOllama({localEndpoint:endpoint});
  assert.equal(report.status,'ok');
  assert.deepEqual(report.models,[]);
  assert.ok(!hits.some(h=>h.url==='/api/pull'));
 });
});

test('unreachable Ollama on a closed loopback port does not use 11434',async()=>{
 const server=createServer(()=>{});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 await new Promise(r=>server.close(r));
 assert.notEqual(port,11434);
 const report=await inspectOllama({localEndpoint:`http://127.0.0.1:${port}/v1`,timeoutMs:800});
 assert.equal(report.status,'unreachable');
 assert.ok(report.reason);
 assert.ok(!report.reason.includes('11434')||port===11434);
});

test('oversize tags fail closed without recommending a pull',async()=>{
 await withFixture({oversize:true},async({endpoint,hits})=>{
  const report=await inspectOllama({localEndpoint:endpoint,maxBytes:65536});
  assert.equal(report.status,'invalid');
  assert.ok(!hits.some(h=>h.url==='/api/pull'));
 });
});

test('RESOURCE_PLAN_REQUIRED without consent; inspect still GET-only',async()=>{
 assert.throws(()=>assertPullAllowed(null),/RESOURCE_PLAN_REQUIRED/);
 assert.throws(()=>assertPullAllowed(plan(false)),/RESOURCE_PLAN_REQUIRED/);
 assert.throws(()=>validateResourcePlan({...plan(),version:2}));
 assert.throws(()=>validateResourcePlan({...plan(),extra:'x'}));
 await withFixture({},async({endpoint,hits})=>{
  await assert.rejects(()=>requestPull({plan:plan(false),localEndpoint:endpoint}),/RESOURCE_PLAN_REQUIRED/);
  assert.equal(hits.length,0);
  await inspectOllama({localEndpoint:endpoint});
  assert.ok(!hits.some(h=>h.url==='/api/pull'));
 });
});

test('consented resource plan may POST /api/pull only to the loopback fixture',async()=>{
 await withFixture({},async({endpoint,hits,port})=>{
  assert.notEqual(port,11434);
  const allowed=assertPullAllowed(plan(true));
  assert.equal(allowed.source,'ollama-library:qwen3:8b');
  const result=await requestPull({plan:plan(true),localEndpoint:endpoint});
  assert.equal(result.ok,true);
  assert.ok(hits.some(h=>h.method==='POST'&&h.url==='/api/pull'));
  assert.ok(hits.every(h=>!String(h.url).includes('ollama.com')));
 });
});

test('resource-plan file is owner-only, no-follow, never a memory.json snapshot',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-08-plan-'));
 try{
  const path=join(dir,'resource-plan.json');
  const saved=writeResourcePlan(path,plan(true));
  assert.equal(saved.consent,true);
  assert.deepEqual(readResourcePlan(path),saved);
  const canary=join(dir,'outside.json');
  writeFileSync(canary,JSON.stringify(plan(true)),{mode:0o600});
  rmSync(path);
  symlinkSync(canary,path);
  assert.throws(()=>readResourcePlan(path),/RESOURCE_PLAN_UNSAFE|ELOOP/);
  rmSync(path);
  writeResourcePlan(path,plan(true));
  chmodSync(path,0o644);
  assert.throws(()=>readResourcePlan(path),/RESOURCE_PLAN_UNSAFE/);
  assert.ok(!path.includes('memory.json'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
