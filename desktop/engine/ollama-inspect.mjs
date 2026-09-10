// Loopback-only Ollama inspect (GET /api/version and GET /api/tags). No chat, no pull from inspect.
import {openSync,readFileSync,writeFileSync,fstatSync,closeSync,constants,existsSync} from 'node:fs';
import {validateConfiguration} from './reasoning-config.mjs';

export const OLLAMA_MAX_BYTES=65536;
export const RESOURCE_PLAN_MAX_BYTES=4096;
export const RESOURCE_PLAN_PURPOSE='install-recommended-local-model';
export const RESOURCE_PLAN_DESTINATION='ollama-models-volume';
const PLAN_KEYS=['version','source','purpose','expectedBytes','sizeUnavailable','destinationKind','consent'];
const TAG=/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const keys=(o,n)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join()===n.sort().join();

export function ollamaOriginFromEndpoint(localEndpoint){
 const c=validateConfiguration({version:1,selected:'local',localModel:'qwen3:8b',localEndpoint,cloudModel:'deepseek-v4-flash',cloudKeyID:''});
 return c.localEndpoint.replace(/\/v1$/,'');
}

function boundedJson(buf,max=OLLAMA_MAX_BYTES){
 if(!Buffer.isBuffer(buf))buf=Buffer.from(buf);
 if(buf.length>max)throw Error('OLLAMA_OVERSIZE');
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buf));
}

export function decodeVersionPayload(body){
 const o=typeof body==='string'||Buffer.isBuffer(body)?boundedJson(body):body;
 if(!o||typeof o!=='object'||Array.isArray(o))throw Error('OLLAMA_INVALID');
 const version=typeof o.version==='string'&&o.version&&o.version.length<=64?o.version:null;
 return {version};
}

export function decodeTagsPayload(body){
 const o=typeof body==='string'||Buffer.isBuffer(body)?boundedJson(body):body;
 if(!o||typeof o!=='object'||Array.isArray(o))throw Error('OLLAMA_INVALID');
 const rows=Array.isArray(o.models)?o.models:[];
 const models=[];
 for(const row of rows){
  if(!row||typeof row!=='object'||typeof row.name!=='string'||!row.name||row.name.length>160)continue;
  const size=typeof row.size==='number'&&Number.isInteger(row.size)&&row.size>0?row.size:null;
  models.push({name:row.name,size});
 }
 return {models};
}

async function getJson(origin,path,{fetchImpl,timeoutMs,maxBytes,methods}){
 const url=origin+path;
 methods.push({method:'GET',url});
 const res=await fetchImpl(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
 if(!res.ok)throw Error('OLLAMA_UNREACHABLE');
 const buf=Buffer.from(await res.arrayBuffer());
 if(buf.length>maxBytes)throw Error('OLLAMA_OVERSIZE');
 return boundedJson(buf,maxBytes);
}

export async function inspectOllama({localEndpoint,fetchImpl=fetch,timeoutMs=2500,maxBytes=OLLAMA_MAX_BYTES}={}){
 const methods=[];
 try{
  const origin=ollamaOriginFromEndpoint(localEndpoint);
  const versionBody=await getJson(origin,'/api/version',{fetchImpl,timeoutMs,maxBytes,methods});
  const tagsBody=await getJson(origin,'/api/tags',{fetchImpl,timeoutMs,maxBytes,methods});
  const {version}=decodeVersionPayload(versionBody);
  const {models}=decodeTagsPayload(tagsBody);
  if(methods.some(m=>m.method!=='GET'||m.url.includes('/api/pull')))throw Error('OLLAMA_INVALID');
  return {status:'ok',version,models,reason:null,methods};
 }catch(e){
  if(e&&e.message==='MODELS_INVALID')throw e;
  if(e&&e.message==='OLLAMA_OVERSIZE')return {status:'invalid',version:null,models:[],reason:'Ollama response exceeded the inspect size cap.',methods};
  const reason=e&&e.name==='TimeoutError'?'Ollama did not respond before the inspect timeout.':'Ollama is not detected on the saved loopback address. It must already be installed and listening.';
  return {status:'unreachable',version:null,models:[],reason,methods};
 }
}

export function setupFeedback(report){
 if(!report||report.status!=='ok')return 'Ollama must already be installed and listening on the saved loopback address. Wisp only GETs /api/version and /api/tags for inspect.';
 return `Ollama ${report.version||'version unlisted'} on the saved loopback address. Inspect listed ${report.models.length} installed name(s).`;
}

export function validateResourcePlan(value){
 if(!keys(value,PLAN_KEYS)||value.version!==1||value.purpose!==RESOURCE_PLAN_PURPOSE||value.destinationKind!==RESOURCE_PLAN_DESTINATION||typeof value.consent!=='boolean'||typeof value.sizeUnavailable!=='boolean'||typeof value.source!=='string')throw Error('RESOURCE_PLAN_INVALID');
 let tag=value.source;
 if(tag.startsWith('ollama-library:'))tag=tag.slice('ollama-library:'.length);
 if(!TAG.test(tag)||tag.includes('..')||/[\x00-\x1f\x7f]/.test(value.source))throw Error('RESOURCE_PLAN_INVALID');
 if(value.sizeUnavailable){if(value.expectedBytes!==null)throw Error('RESOURCE_PLAN_INVALID');}
 else if(!Number.isInteger(value.expectedBytes)||value.expectedBytes<1)throw Error('RESOURCE_PLAN_INVALID');
 const encoded=JSON.stringify(value);
 if(Buffer.byteLength(encoded)>RESOURCE_PLAN_MAX_BYTES)throw Error('RESOURCE_PLAN_INVALID');
 return {version:1,source:value.source,purpose:RESOURCE_PLAN_PURPOSE,expectedBytes:value.expectedBytes,sizeUnavailable:value.sizeUnavailable,destinationKind:RESOURCE_PLAN_DESTINATION,consent:value.consent===true};
}

export function consentedPlan(plan){
 try{const p=validateResourcePlan(plan);return p.consent===true&&!!p.source;}catch{return false;}
}

export function assertPullAllowed(plan){
 if(!consentedPlan(plan))throw Error('RESOURCE_PLAN_REQUIRED');
 return validateResourcePlan(plan);
}

export async function requestPull({plan,localEndpoint,fetchImpl=fetch,timeoutMs=2500}={}){
 const allowed=assertPullAllowed(plan);
 const origin=ollamaOriginFromEndpoint(localEndpoint);
 let tag=allowed.source;
 if(tag.startsWith('ollama-library:'))tag=tag.slice('ollama-library:'.length);
 const res=await fetchImpl(origin+'/api/pull',{method:'POST',redirect:'error',headers:{'content-type':'application/json'},body:JSON.stringify({name:tag,stream:false}),signal:AbortSignal.timeout(timeoutMs)});
 return {ok:!!res&&res.ok===true,status:res&&res.status};
}

export function readResourcePlan(path){
 if(!existsSync(path))return null;
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const st=fstatSync(fd);if(!st.isFile()||st.uid!==process.getuid()||st.nlink!==1||(st.mode&0o077)||st.size>RESOURCE_PLAN_MAX_BYTES)throw Error('RESOURCE_PLAN_UNSAFE');
  const bytes=readFileSync(fd);if(bytes.length>RESOURCE_PLAN_MAX_BYTES)throw Error('RESOURCE_PLAN_INVALID');
  return validateResourcePlan(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
 }finally{closeSync(fd);}
}

export function writeResourcePlan(path,plan){
 const encoded=JSON.stringify(validateResourcePlan(plan));
 writeFileSync(path,encoded,{mode:0o600,flag:'w'});
 return readResourcePlan(path);
}
