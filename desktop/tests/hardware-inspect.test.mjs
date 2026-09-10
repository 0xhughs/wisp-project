import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 HARDWARE_VERSION,HARDWARE_MAX_BYTES,RECOMMENDED_LOCAL,FIT_COPY,
 collectLinuxHardware,validateHardwareSnapshot,finalizeSnapshot,recommend,
 validateRecommendation,assertNotDoubleCounted,modelMemoryParts,speechHeadroom,
} from '../engine/hardware-inspect.mjs';

function meminfo(totalKb,availableKb=totalKb){return `MemTotal:       ${totalKb} kB\nMemAvailable:   ${availableKb} kB\n`;}
function cpuinfo(name='Injected CPU',count=2){return Array.from({length:count},(_,i)=>`processor\t: ${i}\nmodel name\t: ${name}\n`).join('\n');}
function ioFixture({
 mem=meminfo(8_000_000,4_000_000),
 cpu=cpuinfo(),
 drm=null,
 drmCards=[],
 vram=null,
 cgroup=null,
 cgroupV1=null,
 root={bsize:4096,bavail:1000},
 home=null,
 ollama=null,
 files={},
}={}){
 const map={
  '/proc/meminfo':mem,
  '/proc/cpuinfo':cpu,
 };
 if(cgroup!=null)map['/sys/fs/cgroup/memory.max']=cgroup;
 if(cgroupV1!=null)map['/sys/fs/cgroup/memory/memory.limit_in_bytes']=cgroupV1;
 if(vram!=null)map['/sys/class/drm/card0/device/mem_info_vram_total']=vram;
 Object.assign(map,files);
 return {
  exists(path){if(path==='/sys/class/drm')return drm!==false&&drm!=null||drmCards.length>0;return Object.prototype.hasOwnProperty.call(map,path);},
  readFile(path){if(!Object.prototype.hasOwnProperty.call(map,path))return {error:'ENOENT'};return map[path];},
  readDir(path){if(path==='/sys/class/drm')return drmCards;throw Object.assign(new Error('ENOENT'),{code:'ENOENT'});},
  statfs(path){
   if(path==='/')return root;
   if(path==='/home/wisp'&&home)return home;
   if(path==='/models'&&ollama)return ollama;
   throw Object.assign(new Error('ENOENT'),{code:'ENOENT'});
  },
  env(){return ollama?{OLLAMA_MODELS:'/models'}:{};},
  platform:()=>'linux',
 };
}

test('schema unknown version, unknown keys and oversize fail closed',()=>{
 const snap=collectLinuxHardware({io:ioFixture()});
 assert.equal(snap.version,HARDWARE_VERSION);
 assert.equal(snap.speechHeadroom.numericReservationBytes,null);
 assert.equal(snap.speechHeadroom.reservation,'qualitative');
 assert.deepEqual(validateHardwareSnapshot(snap),snap);
 assert.throws(()=>validateHardwareSnapshot({...snap,version:2}));
 assert.throws(()=>validateHardwareSnapshot({...snap,extra:'x'}));
 assert.throws(()=>validateHardwareSnapshot({...snap,cpu:{...snap.cpu,bonus:1}}));
 const huge={...snap,sources:['x'.repeat(80)]};
 huge.sources=Array.from({length:40},()=>'proc-meminfo');
 assert.throws(()=>validateHardwareSnapshot(huge));
 const padded=JSON.parse(JSON.stringify(snap));
 padded.padding='n'.repeat(HARDWARE_MAX_BYTES);
 assert.throws(()=>validateHardwareSnapshot(padded));
 assert.throws(()=>finalizeSnapshot({...snap,speechHeadroom:{...speechHeadroom(),numericReservationBytes:0}}));
});

test('drm-less fixture matches this host: GPU and unified unavailable, never 0',()=>{
 const snap=collectLinuxHardware({io:ioFixture({drm:false,drmCards:[]})});
 assert.equal(snap.gpu.status,'unavailable');
 assert.equal(snap.gpu.reason,'no drm/sysfs GPU node');
 assert.equal(snap.gpu.vram.status,'unavailable');
 assert.equal(snap.gpu.vram.bytes,null);
 assert.notEqual(snap.gpu.vram.bytes,0);
 assert.equal(snap.memory.kind,'discrete');
 assert.equal(snap.memory.unifiedBytes,null);
 assert.equal(snap.memory.status,'available');
 assert.equal(snap.speechHeadroom.numericReservationBytes,null);
 assert.equal(snap.disk.status,'available');
});

test('cgroup tighter than MemTotal is preferred when injected; not a product GB cutoff',()=>{
 const memTotalKb=8_000_000;
 const tighter=3_000_000*1024;
 const snap=collectLinuxHardware({io:ioFixture({mem:meminfo(memTotalKb),cgroup:String(tighter)})});
 assert.equal(snap.memory.totalBytes,tighter);
 assert.ok(snap.memory.totalBytes<memTotalKb*1024);
 const unlimited=collectLinuxHardware({io:ioFixture({mem:meminfo(memTotalKb),cgroup:'max'})});
 assert.equal(unlimited.memory.totalBytes,memTotalKb*1024);
});

test('refuse summing unified memory with discrete VRAM',()=>{
 const base=collectLinuxHardware({io:ioFixture()});
 const unified=finalizeSnapshot({
  ...base,
  memory:{status:'available',kind:'unified',totalBytes:8_589_934_592,availableBytes:4_294_967_296,unifiedBytes:8_589_934_592,reason:null},
  gpu:{status:'available',name:'Apple M-series (fixture)',hasUnifiedMemory:true,workingSetHintBytes:6_000_000_000,vram:{status:'unavailable',bytes:null,reason:'unified memory already reported'},reason:null},
 });
 assert.equal(unified.memory.kind,'unified');
 assert.equal(modelMemoryParts(unified).vramBytes,null);
 assert.doesNotThrow(()=>assertNotDoubleCounted(unified));
 const summed={...unified,gpu:{...unified.gpu,vram:{status:'available',bytes:8_000_000_000,reason:null}}};
 delete summed.digest;
 assert.throws(()=>finalizeSnapshot(summed),/HARDWARE_DOUBLE_COUNT/);
});

test('live /proc shape without baking this VM kB as a product threshold',()=>{
 const snap=collectLinuxHardware();
 assert.equal(snap.version,1);
 assert.equal(snap.platform,'linux');
 assert.ok(Array.isArray(snap.sources)&&snap.sources.includes('proc-meminfo'));
 assert.equal(typeof snap.cpu.status,'string');
 if(snap.cpu.status==='available'){
  assert.equal(typeof snap.cpu.modelName,'string');
  assert.ok(Number.isInteger(snap.cpu.logicalCount)&&snap.cpu.logicalCount>=1);
 }
 if(snap.memory.status==='available'){
  assert.ok(Number.isInteger(snap.memory.totalBytes)&&snap.memory.totalBytes>0);
  assert.notEqual(snap.memory.totalBytes,0);
 }
 assert.equal(snap.memory.kind==='unified',false);
 assert.equal(snap.gpu.status,'unavailable');
 assert.match(snap.gpu.reason,/drm|sysfs/);
 assert.equal(snap.gpu.vram.bytes,null);
 assert.equal(snap.speechHeadroom.numericReservationBytes,null);
 assert.ok(snap.disk.status==='available'||snap.disk.status==='unavailable');
 if(snap.disk.status==='unavailable')assert.ok(snap.disk.reason);
 const rec=recommend({snapshot:snap,ollama:{status:'unreachable',models:[]}});
 assert.equal(validateRecommendation(rec).disk.status,snap.disk.status);
 assert.equal(rec.speechHeadroom.numericReservationBytes,null);
 assert.ok(rec.disk);
});

test('recommend always includes speechHeadroom, disk, Recommended qwen3:8b and unique Faster/Stronger by size',()=>{
 const snapshot=collectLinuxHardware({io:ioFixture({root:{bsize:4096,bavail:50_000_000}})});
 const ollama={status:'ok',version:'0.11.0',models:[
  {name:'qwen3:8b',size:5_228_000_000},
  {name:'tinyllama:latest',size:637_000_000},
  {name:'llama3:70b',size:39_000_000_000},
 ]};
 const rec=recommend({snapshot,ollama,cloudModel:'deepseek-v4-flash'});
 assert.equal(rec.fitCopy,FIT_COPY);
 assert.equal(rec.speechHeadroom.numericReservationBytes,null);
 assert.equal(rec.disk.status,'available');
 assert.ok(Number.isInteger(rec.disk.availableBytes));
 const by=Object.fromEntries(rec.choices.map(c=>[c.slot,c]));
 assert.equal(by.recommended.identifier,RECOMMENDED_LOCAL);
 assert.equal(by.faster.identifier,'tinyllama:latest');
 assert.equal(by.stronger.identifier,'llama3:70b');
 assert.equal(by.cloud.identifier,'deepseek-v4-flash');
 assert.equal(by.cloud.kind,'cloud');
 const ids=rec.choices.map(c=>c.identifier).filter(Boolean);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(by.faster.sizeBytes,637_000_000);
 assert.equal(by.stronger.sizeBytes,39_000_000_000);
 assert.equal(by.recommended.status,'fit-uncertain');
});

test('empty Ollama leaves Recommended not-installed and Faster/Stronger unavailable without pull',()=>{
 const snapshot=collectLinuxHardware({io:ioFixture()});
 const rec=recommend({snapshot,ollama:{status:'ok',version:'0.11.0',models:[]}});
 const by=Object.fromEntries(rec.choices.map(c=>[c.slot,c]));
 assert.equal(by.recommended.identifier,RECOMMENDED_LOCAL);
 assert.equal(by.recommended.status,'not-installed');
 assert.equal(by.faster.status,'unavailable');
 assert.equal(by.faster.reason,'no other installed local model to rank');
 assert.equal(by.stronger.status,'unavailable');
 assert.match(by.stronger.reason,/stronger/);
});

test('unreachable Ollama marks local rows ollama-unreachable',()=>{
 const snapshot=collectLinuxHardware({io:ioFixture()});
 const rec=recommend({snapshot,ollama:{status:'unreachable',models:[],reason:'down'}});
 for(const slot of ['faster','recommended','stronger'])assert.equal(rec.choices.find(c=>c.slot===slot).status==='ollama-unreachable'||rec.choices.find(c=>c.slot===slot).status==='unavailable',true);
 assert.equal(rec.choices.find(c=>c.slot==='recommended').status,'ollama-unreachable');
 assert.equal(rec.choices.find(c=>c.slot==='cloud').status,'available');
});

test('disk-may-be-insufficient uses measured size vs available bytes, not a GB cutoff',()=>{
 const snapshot=collectLinuxHardware({io:ioFixture({root:{bsize:4096,bavail:10}})});
 const rec=recommend({snapshot,ollama:{status:'ok',models:[{name:'qwen3:8b',size:5_000_000_000}]}});
 assert.equal(rec.choices.find(c=>c.slot==='recommended').status,'disk-may-be-insufficient');
});

test('hardware refresh source does not start capture, session/prompt, Test Connection or pull',()=>{
 const src=readFileSync(new URL('../macos/Sources/WispBody/CompanionController.swift',import.meta.url),'utf8');
 const fn=src.split('func refreshOnboarding')[1];
 assert.ok(fn,'refreshOnboarding is defined');
 const body=fn.split('func ')[0];
 assert.ok(!body.includes('testModelConnection'));
 assert.ok(!body.includes('wakeVoice'));
 assert.ok(!body.includes('session/prompt'));
 assert.ok(!body.includes('/api/pull'));
 assert.ok(!body.includes('ollama pull'));
 const models=readFileSync(new URL('../macos/Sources/WispBody/ModelsView.swift',import.meta.url),'utf8');
 assert.ok(!models.includes('No downloads or hardware recommendations are included'));
 assert.ok(models.includes('Hardware-aware onboarding'));
 assert.ok(src.includes('ModelsApply.isUnchanged'));
});
