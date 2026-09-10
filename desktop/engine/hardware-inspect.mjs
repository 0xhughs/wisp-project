// Closed version-1 hardware snapshot and Faster/Recommended/Stronger ranking.
// No GB/VRAM/latency thresholds. Missing readings are unavailable+reason, never 0-as-present.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,statfsSync} from 'node:fs';

export const HARDWARE_VERSION=1;
export const HARDWARE_MAX_BYTES=16384;
export const RECOMMENDED_LOCAL='qwen3:8b';
export const SPEECH_HEADROOM_NOTE='Wisp does not treat all reported memory as model budget. Concurrent on-device recognition and text-to-speech remain a workload.';
export const FIT_COPY='Fit is not a guarantee that the model runs comfortably. Wisp does not invent GB, VRAM or latency cutoffs.';
const SNAPSHOT_KEYS=['version','platform','cpu','memory','gpu','disk','speechHeadroom','sources','digest'];
const CPU_KEYS=['status','modelName','logicalCount','reason'];
const MEMORY_KEYS=['status','kind','totalBytes','availableBytes','unifiedBytes','reason'];
const GPU_KEYS=['status','name','hasUnifiedMemory','workingSetHintBytes','vram','reason'];
const VRAM_KEYS=['status','bytes','reason'];
const DISK_KEYS=['status','availableBytes','rootAvailableBytes','homeAvailableBytes','reason'];
const HEADROOM_KEYS=['reservation','numericReservationBytes','concurrentRecognitionAndTts','note'];
const REC_KEYS=['version','snapshotDigest','speechHeadroom','disk','ollamaStatus','fitCopy','choices'];
const CHOICE_KEYS=['slot','identifier','kind','status','reason','sizeBytes'];
const STATUSES=['available','unavailable'];
const KINDS=['discrete','unified','unknown'];
const LOCAL_STATUSES=['installed','not-installed','ollama-unreachable','hardware-incomplete','fit-uncertain','disk-may-be-insufficient','unavailable'];
const SLOTS=['faster','recommended','stronger','cloud'];
export const keys=(o,n)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join()===n.sort().join();
const intOrNull=v=>v===null?null:Number.isInteger(v)?v:NaN;
function sortKeys(value){if(Array.isArray(value))return value.map(sortKeys);if(value&&typeof value==='object'){const out={};for(const k of Object.keys(value).sort())out[k]=sortKeys(value[k]);return out;}return value;}
export function stableStringify(value){return JSON.stringify(sortKeys(value));}
function fail(code='HARDWARE_INVALID'){throw Error(code);}
function statusPair(status,reason){if(!STATUSES.includes(status))fail();if(status==='unavailable'){if(typeof reason!=='string'||!reason)fail();}else if(reason!==null)fail();}
function bounded(raw){
 const text=typeof raw==='string'?raw:stableStringify(raw);
 if(typeof text!=='string'||Buffer.byteLength(text)>HARDWARE_MAX_BYTES)fail();
 return typeof raw==='string'?JSON.parse(raw):raw;
}
export function speechHeadroom(){
 return {reservation:'qualitative',numericReservationBytes:null,concurrentRecognitionAndTts:true,note:SPEECH_HEADROOM_NOTE};
}
function validateHeadroom(h){
 if(!keys(h,HEADROOM_KEYS)||h.reservation!=='qualitative'||h.numericReservationBytes!==null||h.concurrentRecognitionAndTts!==true||typeof h.note!=='string'||!h.note)fail();
 return {reservation:'qualitative',numericReservationBytes:null,concurrentRecognitionAndTts:true,note:h.note};
}
function validateCpu(c){
 if(!keys(c,CPU_KEYS))fail();statusPair(c.status,c.reason);
 const logical=intOrNull(c.logicalCount);if(Number.isNaN(logical))fail();
 if(c.status==='available'){if(typeof c.modelName!=='string'||!c.modelName||logical===null||logical<1)fail();}
 else if(c.modelName!==null||c.logicalCount!==null)fail();
 return {status:c.status,modelName:c.modelName,logicalCount:c.logicalCount,reason:c.reason};
}
function validateVram(v){
 if(!keys(v,VRAM_KEYS))fail();statusPair(v.status,v.reason);
 const bytes=intOrNull(v.bytes);if(Number.isNaN(bytes))fail();
 if(v.status==='available'){if(bytes===null||bytes<1)fail();}else if(v.bytes!==null)fail();
 return {status:v.status,bytes:v.bytes,reason:v.reason};
}
function validateGpu(g){
 if(!keys(g,GPU_KEYS))fail();statusPair(g.status,g.reason);const vram=validateVram(g.vram);
 if(g.hasUnifiedMemory!==null&&typeof g.hasUnifiedMemory!=='boolean')fail();
 const hint=intOrNull(g.workingSetHintBytes);if(Number.isNaN(hint))fail();
 if(g.status==='available'){if(typeof g.name!=='string'||!g.name)fail();}
 else if(g.name!==null)fail();
 if(g.hasUnifiedMemory===true&&vram.status==='available')throw Error('HARDWARE_DOUBLE_COUNT');
 return {status:g.status,name:g.name,hasUnifiedMemory:g.hasUnifiedMemory,workingSetHintBytes:g.workingSetHintBytes,vram,reason:g.reason};
}
function validateMemory(m){
 if(!keys(m,MEMORY_KEYS)||!KINDS.includes(m.kind))fail();statusPair(m.status,m.reason);
 const total=intOrNull(m.totalBytes),avail=intOrNull(m.availableBytes),uni=intOrNull(m.unifiedBytes);
 if(Number.isNaN(total)||Number.isNaN(avail)||Number.isNaN(uni))fail();
 if(m.status==='available'){if(total===null||total<1)fail();if(m.kind==='unified'&&(uni===null||uni!==total))fail();if(m.kind!=='unified'&&uni!==null)fail();}
 else if(m.totalBytes!==null||m.availableBytes!==null||m.unifiedBytes!==null)fail();
 return {status:m.status,kind:m.kind,totalBytes:m.totalBytes,availableBytes:m.availableBytes,unifiedBytes:m.unifiedBytes,reason:m.reason};
}
function validateDisk(d){
 if(!keys(d,DISK_KEYS))fail();statusPair(d.status,d.reason);
 const a=intOrNull(d.availableBytes),r=intOrNull(d.rootAvailableBytes),h=intOrNull(d.homeAvailableBytes);
 if(Number.isNaN(a)||Number.isNaN(r)||Number.isNaN(h))fail();
 if(d.status==='available'){if(a===null||a<0)fail();}
 else if(d.availableBytes!==null)fail();
 return {status:d.status,availableBytes:d.availableBytes,rootAvailableBytes:d.rootAvailableBytes,homeAvailableBytes:d.homeAvailableBytes,reason:d.reason};
}
export function digestOf(body){
 const {digest:_omit,...rest}=body;
 return createHash('sha256').update(stableStringify(rest)).digest('hex');
}
export function validateHardwareSnapshot(value){
 const o=bounded(value);
 if(!keys(o,SNAPSHOT_KEYS)||o.version!==HARDWARE_VERSION||!['linux','macos','unknown'].includes(o.platform))fail();
 if(!Array.isArray(o.sources)||o.sources.some(s=>typeof s!=='string'||!s||s.includes('\0')||s.length>80)||o.sources.length>32)fail();
 const cpu=validateCpu(o.cpu),memory=validateMemory(o.memory),gpu=validateGpu(o.gpu),disk=validateDisk(o.disk),speech=validateHeadroom(o.speechHeadroom);
 if(memory.kind==='unified'&&memory.status==='available'&&gpu.vram.status==='available')throw Error('HARDWARE_DOUBLE_COUNT');
 const snapshot={version:HARDWARE_VERSION,platform:o.platform,cpu,memory,gpu,disk,speechHeadroom:speech,sources:[...o.sources],digest:o.digest};
 const digest=digestOf(snapshot);
 if(typeof o.digest!=='string'||!/^[a-f0-9]{64}$/.test(o.digest)||o.digest!==digest)fail();
 return snapshot;
}
export function finalizeSnapshot(body){
 const without={...body,speechHeadroom:validateHeadroom(body.speechHeadroom||speechHeadroom())};
 delete without.digest;
 const digest=digestOf(without);
 return validateHardwareSnapshot({...without,digest});
}
export function assertNotDoubleCounted(snapshot){
 const s=validateHardwareSnapshot(snapshot);
 if(s.memory.kind==='unified'&&s.gpu.vram.status==='available')throw Error('HARDWARE_DOUBLE_COUNT');
 return s;
}
export function modelMemoryParts(snapshot){
 const s=assertNotDoubleCounted(snapshot);
 return {kind:s.memory.kind,totalBytes:s.memory.totalBytes,unifiedBytes:s.memory.unifiedBytes,vramBytes:s.gpu.vram.bytes};
}
function unavailable(reason){return {status:'unavailable',reason};}
function readText(io,path){
 try{
  const v=io.readFile(path);
  if(v&&typeof v==='object'&&v.error)return {error:String(v.error)};
  if(typeof v!=='string')return {error:'unreadable'};
  return {text:v};
 }catch(e){return {error:e.code||e.message||'unreadable'};}
}
function meminfoKb(text,key){
 const m=text.match(new RegExp('^'+key+':\\s+([0-9]+)\\s+kB','m'));
 return m?Number(m[1]):null;
}
function parseCgroupLimit(text){
 const t=String(text).trim();
 if(t===''||t==='max')return null;
 if(!/^[0-9]+$/.test(t))return null;
 try{const n=BigInt(t);if(n>1n<<60n)return null;const num=Number(n);return Number.isSafeInteger(num)?num:null;}catch{return null;}
}
function parseCpu(text){
 const names=[...text.matchAll(/^model name\s*:\s*(.+)$/gm)].map(m=>m[1].trim()).filter(Boolean);
 const count=[...text.matchAll(/^processor\s*:/gm)].length;
 if(!names.length&&!count)return {status:'unavailable',modelName:null,logicalCount:null,reason:'cpuinfo missing model name and processor records'};
 return {status:'available',modelName:names[0]||'unknown',logicalCount:count||1,reason:null};
}
function diskFromStat(io,path){
 try{
  const s=io.statfs(path);
  if(!s||!Number.isInteger(s.bavail)||!Number.isInteger(s.bsize)||s.bsize<1||s.bavail<0)return {error:'statfs shape'};
  return {bytes:s.bavail*s.bsize};
 }catch(e){return {error:e.code||e.message||'statfs'};}
}
function collectGpu(io){
 const dir='/sys/class/drm';
 if(!io.exists(dir))return {status:'unavailable',name:null,hasUnifiedMemory:null,workingSetHintBytes:null,vram:{status:'unavailable',bytes:null,reason:'no drm/sysfs GPU node'},reason:'no drm/sysfs GPU node'};
 let names=[];
 try{names=io.readDir(dir).filter(n=>/^card[0-9]+$/.test(n));}catch{return {status:'unavailable',name:null,hasUnifiedMemory:null,workingSetHintBytes:null,vram:{status:'unavailable',bytes:null,reason:'drm sysfs unreadable'},reason:'drm sysfs unreadable'};}
 if(!names.length)return {status:'unavailable',name:null,hasUnifiedMemory:null,workingSetHintBytes:null,vram:{status:'unavailable',bytes:null,reason:'no drm/sysfs GPU node'},reason:'no drm/sysfs GPU node'};
 const vramPath=`${dir}/${names[0]}/device/mem_info_vram_total`;
 const vramFile=readText(io,vramPath);
 if(vramFile.text){
  const n=Number(vramFile.text.trim());
  if(Number.isInteger(n)&&n>0)return {status:'available',name:names[0],hasUnifiedMemory:null,workingSetHintBytes:null,vram:{status:'available',bytes:n,reason:null},reason:null};
 }
 return {status:'available',name:names[0],hasUnifiedMemory:null,workingSetHintBytes:null,vram:{status:'unavailable',bytes:null,reason:'vendor VRAM sysfs missing or unreadable'},reason:null};
}
export const defaultLinuxIO={
 exists:path=>existsSync(path),
 readFile(path){try{return readFileSync(path,'utf8');}catch(e){return {error:e.code||'unreadable'};}},
 readDir(path){return readdirSync(path);},
 statfs(path){return statfsSync(path);},
 env:()=>process.env,
 platform:()=>process.platform,
};
export function collectLinuxHardware({io=defaultLinuxIO,homePath=null,ollamaModelsPath=null}={}){
 const sources=[],platform=io.platform()==='linux'?'linux':io.platform()==='darwin'?'macos':'unknown';
 const mem=readText(io,'/proc/meminfo');if(mem.text)sources.push('proc-meminfo');
 const cpuFile=readText(io,'/proc/cpuinfo');if(cpuFile.text)sources.push('proc-cpuinfo');
 const cpu=cpuFile.text?parseCpu(cpuFile.text):{status:'unavailable',modelName:null,logicalCount:null,reason:cpuFile.error==='ENOENT'?'cpuinfo missing':`cpuinfo ${cpuFile.error||'unreadable'}`};
 let memory={status:'unavailable',kind:'unknown',totalBytes:null,availableBytes:null,unifiedBytes:null,reason:'meminfo missing MemTotal'};
 if(mem.text){
  const totalKb=meminfoKb(mem.text,'MemTotal');
  const availKb=meminfoKb(mem.text,'MemAvailable');
  if(totalKb&&totalKb>0){
   let totalBytes=totalKb*1024;
   const cgroup=readText(io,'/sys/fs/cgroup/memory.max');
   let cgroupBytes=cgroup.text?parseCgroupLimit(cgroup.text):null;
   if(cgroup.text)sources.push('cgroup-memory-max');
   if(cgroupBytes==null){
    const v1=readText(io,'/sys/fs/cgroup/memory/memory.limit_in_bytes');
    if(v1.text){cgroupBytes=parseCgroupLimit(v1.text);if(v1.text)sources.push('cgroup-memory-limit');}
   }
   if(cgroupBytes!=null&&cgroupBytes>0&&cgroupBytes<totalBytes)totalBytes=cgroupBytes;
   memory={status:'available',kind:'discrete',totalBytes,availableBytes:availKb!=null&&availKb>=0?availKb*1024:null,unifiedBytes:null,reason:null};
  }else memory={status:'unavailable',kind:'unknown',totalBytes:null,availableBytes:null,unifiedBytes:null,reason:'meminfo missing MemTotal'};
 }else memory={status:'unavailable',kind:'unknown',totalBytes:null,availableBytes:null,unifiedBytes:null,reason:mem.error==='ENOENT'?'meminfo missing':`meminfo ${mem.error||'unreadable'}`};
 const gpu=collectGpu(io);if(gpu.reason==='no drm/sysfs GPU node'||gpu.status==='available')sources.push(gpu.status==='available'?'sysfs-drm':'sysfs-drm-absent');
 const ollamaPath=ollamaModelsPath??(typeof io.env==='function'?io.env().OLLAMA_MODELS:null);
 const rootDisk=diskFromStat(io,'/');if(!rootDisk.error)sources.push('statfs-root');
 const homeDisk=homePath?diskFromStat(io,homePath):{error:'no-home'};
 if(homePath&&!homeDisk.error)sources.push('statfs-home-volume');
 const ollamaDisk=typeof ollamaPath==='string'&&ollamaPath?diskFromStat(io,ollamaPath):{error:'no-ollama-volume'};
 if(typeof ollamaPath==='string'&&ollamaPath&&!ollamaDisk.error)sources.push('statfs-ollama-models-volume');
 const rootAvailableBytes=rootDisk.bytes??null;
 const homeAvailableBytes=homeDisk.bytes??null;
 const ollamaAvailableBytes=ollamaDisk.bytes??null;
 const availableBytes=ollamaAvailableBytes??homeAvailableBytes??rootAvailableBytes;
 const disk=availableBytes==null
  ?{status:'unavailable',availableBytes:null,rootAvailableBytes:rootAvailableBytes,homeAvailableBytes:homeAvailableBytes,reason:rootDisk.error?`statfs / ${rootDisk.error}`:'disk capacity unavailable'}
  :{status:'available',availableBytes,rootAvailableBytes,homeAvailableBytes,reason:null};
 return finalizeSnapshot({
  version:HARDWARE_VERSION,platform,cpu,memory,gpu,disk,speechHeadroom:speechHeadroom(),sources,
 });
}
function recommendationDisk(snapshot){
 return {status:snapshot.disk.status,availableBytes:snapshot.disk.availableBytes,reason:snapshot.disk.reason};
}
function graphicsIncomplete(snapshot){
 if(snapshot.memory.kind==='unified'&&snapshot.memory.status==='available')return false;
 if(snapshot.gpu.status==='available'&&snapshot.gpu.vram.status==='available')return false;
 return true;
}
function localRowStatus({inTags,sizeBytes,snapshot,ollamaStatus}){
 if(ollamaStatus==='unreachable'||ollamaStatus==='not-detected')return {status:'ollama-unreachable',reason:'Ollama is not detected on the saved loopback address. It must already be installed and listening.'};
 if(!inTags)return {status:'not-installed',reason:'This local identifier is not in the inspected Ollama tag list. Wisp will not pull it without a consented resource plan.'};
 if(snapshot.memory.status==='unavailable')return {status:'hardware-incomplete',reason:snapshot.memory.reason||'memory reading unavailable'};
 if(sizeBytes!=null&&snapshot.disk.status==='available'&&snapshot.disk.availableBytes!=null&&sizeBytes>snapshot.disk.availableBytes){
  return {status:'disk-may-be-insufficient',reason:'Ollama-reported size exceeds the inspected available disk bytes.'};
 }
 const missing=[];
 if(snapshot.memory.status==='unavailable')missing.push('memory');
 if(snapshot.disk.status==='unavailable')missing.push('disk');
 if(graphicsIncomplete(snapshot))missing.push('GPU');
 if(sizeBytes==null)missing.push('Ollama size');
 if(missing.length)return {status:'fit-uncertain',reason:`Inspection found this installed model; ${missing.join(', ')} is missing so fit is not a guarantee.`};
 return {status:'installed',reason:null};
}
function choice(slot,identifier,kind,status,reason,sizeBytes){
 return {slot,identifier,kind,status,reason,sizeBytes};
}
export function recommend({snapshot,ollama,cloudModel='deepseek-v4-flash'}){
 const hw=validateHardwareSnapshot(snapshot);
 if(typeof cloudModel!=='string'||!cloudModel)fail();
 const ollamaStatus=ollama&&typeof ollama.status==='string'?ollama.status:'unreachable';
 const models=Array.isArray(ollama?.models)?ollama.models:[];
 const ranked=models.filter(m=>m&&typeof m.name==='string'&&m.name&&typeof m.size==='number'&&Number.isInteger(m.size)&&m.size>0)
  .filter((m,i,all)=>all.findIndex(x=>x.name===m.name)===i);
 const recommendedTag=ranked.find(m=>m.name===RECOMMENDED_LOCAL)||models.find(m=>m&&m.name===RECOMMENDED_LOCAL);
 const inRecommended=models.some(m=>m&&m.name===RECOMMENDED_LOCAL);
 const recommendedSize=recommendedTag&&typeof recommendedTag.size==='number'&&Number.isInteger(recommendedTag.size)?recommendedTag.size:null;
 const recStatus=localRowStatus({inTags:inRecommended,sizeBytes:recommendedSize,snapshot:hw,ollamaStatus});
 const others=ranked.filter(m=>m.name!==RECOMMENDED_LOCAL).sort((a,b)=>a.size-b.size||a.name.localeCompare(b.name));
 const fasterTag=others[0]||null;
 const strongerPool=others.filter(m=>!fasterTag||m.name!==fasterTag.name).sort((a,b)=>b.size-a.size||b.name.localeCompare(a.name));
 const strongerTag=strongerPool[0]||null;
 const down=ollamaStatus==='unreachable'||ollamaStatus==='not-detected';
 const downReason='Ollama is not detected on the saved loopback address. It must already be installed and listening.';
 const faster=fasterTag
  ?(()=>{const st=localRowStatus({inTags:true,sizeBytes:fasterTag.size,snapshot:hw,ollamaStatus});return choice('faster',fasterTag.name,'local',st.status,st.reason,fasterTag.size);})()
  :choice('faster','','local','unavailable',down?downReason:'no other installed local model to rank',null);
 const stronger=strongerTag
  ?(()=>{const st=localRowStatus({inTags:true,sizeBytes:strongerTag.size,snapshot:hw,ollamaStatus});return choice('stronger',strongerTag.name,'local',st.status,st.reason,strongerTag.size);})()
  :choice('stronger','','local','unavailable',down?downReason:'no other installed local model to rank as stronger',null);
 if(faster.identifier&&faster.identifier===RECOMMENDED_LOCAL)fail();
 if(stronger.identifier&&(stronger.identifier===RECOMMENDED_LOCAL||stronger.identifier===faster.identifier))fail();
 const recommended=choice('recommended',RECOMMENDED_LOCAL,'local',recStatus.status,recStatus.reason,recommendedSize);
 const cloud=choice('cloud',cloudModel,'cloud','available','Optional DeepSeek cloud. Apply uses the existing Models route and Keychain. This does not test the connection or spend the reserved greeting.',null);
 const record={version:1,snapshotDigest:hw.digest,speechHeadroom:hw.speechHeadroom,disk:recommendationDisk(hw),ollamaStatus,fitCopy:FIT_COPY,choices:[faster,recommended,stronger,cloud]};
 return validateRecommendation(record);
}
export function validateRecommendation(value){
 const o=bounded(value);
 if(!keys(o,REC_KEYS)||o.version!==1||typeof o.snapshotDigest!=='string'||!/^[a-f0-9]{64}$/.test(o.snapshotDigest)||typeof o.ollamaStatus!=='string'||o.fitCopy!==FIT_COPY)fail();
 const speech=validateHeadroom(o.speechHeadroom);
 if(!keys(o.disk,['status','availableBytes','reason']))fail();
 statusPair(o.disk.status,o.disk.reason);
 const diskBytes=intOrNull(o.disk.availableBytes);if(Number.isNaN(diskBytes))fail();
 if(o.disk.status==='available'){if(diskBytes===null||diskBytes<0)fail();}else if(o.disk.availableBytes!==null)fail();
 if(!Array.isArray(o.choices)||o.choices.length!==4)fail();
 const slots=o.choices.map(c=>c.slot);
 if(SLOTS.some((s,i)=>slots[i]!==s))fail();
 const choices=o.choices.map(c=>{
  if(!keys(c,CHOICE_KEYS)||!['local','cloud'].includes(c.kind)||typeof c.identifier!=='string')fail();
  if(c.kind==='local'&&!LOCAL_STATUSES.includes(c.status))fail();
  if(c.kind==='cloud'&&c.status!=='available')fail();
  const size=intOrNull(c.sizeBytes);if(Number.isNaN(size))fail();
  if(c.reason!==null&&typeof c.reason!=='string')fail();
  if(c.slot==='recommended'&&c.identifier!==RECOMMENDED_LOCAL)fail();
  return {slot:c.slot,identifier:c.identifier,kind:c.kind,status:c.status,reason:c.reason,sizeBytes:c.sizeBytes};
 });
 const ids=choices.filter(c=>c.identifier).map(c=>c.identifier);
 if(new Set(ids).size!==ids.length)fail();
 return {version:1,snapshotDigest:o.snapshotDigest,speechHeadroom:speech,disk:{status:o.disk.status,availableBytes:o.disk.availableBytes,reason:o.disk.reason},ollamaStatus:o.ollamaStatus,fitCopy:o.fitCopy,choices};
}
export function choiceBySlot(record,slot){return validateRecommendation(record).choices.find(c=>c.slot===slot);}
