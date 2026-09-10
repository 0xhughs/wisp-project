import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,rmSync,mkdtempSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  SELECTABLE_IDS,DEFAULT_CATALOG_ID,UNSUPPORTED_SKINS_ID,PET_MAX_BYTES,
  defaultPetConfiguration,validatePetConfiguration,catalogRows,RASTER_SAMPLES,
  rasterSamples,writePetSnapshot,readPetSnapshot,bodyStatus,
} from '../engine/pet-config.mjs';
import {productFiles} from '../engine/prepare-product.mjs';

const WAVE1=['wisp-orb','wisp-fox','wisp-robot','wisp-bird','wisp-cat','wisp-owl','wisp-sprout','wisp-capsule'];

test('Linux-supplemental: closed enum is wave-1 eight ids in order; default is wisp-orb',()=>{
 assert.deepEqual([...SELECTABLE_IDS],WAVE1);
 assert.equal(DEFAULT_CATALOG_ID,'wisp-orb');
 const def=defaultPetConfiguration();
 assert.deepEqual(def,{version:1,catalogId:'wisp-orb'});
 assert.deepEqual(validatePetConfiguration(def),def);
 for(const id of SELECTABLE_IDS){
  assert.deepEqual(validatePetConfiguration({version:1,catalogId:id}),{version:1,catalogId:id});
 }
 assert.deepEqual(validatePetConfiguration({version:1,catalogId:'wisp-bird'}),{version:1,catalogId:'wisp-bird'});
});

test('Linux-supplemental: unknown version, extra keys, oversize, empty id, dragon, skins, tool-bash fail closed; bird accepted',()=>{
 const valid={version:1,catalogId:'wisp-orb'};
 assert.deepEqual(validatePetConfiguration(valid),valid);
 for(const patch of [
  {version:2},{version:true},{version:'1'},{catalogId:'wisp-dragon'},{catalogId:'official-skins'},
  {catalogId:'tool-bash'},{catalogId:''},{catalogId:'marketplace-fox'},{catalogId:1},
  {extra:'x'},{catalogId:'wisp-orb',padding:'x'},
 ]) assert.throws(()=>validatePetConfiguration({...valid,...patch}));
 assert.throws(()=>validatePetConfiguration({version:1,catalogId:'wisp-orb',note:'no'}));
 assert.throws(()=>validatePetConfiguration({catalogId:'wisp-orb'}));
 assert.throws(()=>validatePetConfiguration({version:1}));
 const huge={version:1,catalogId:'wisp-orb',padding:'x'.repeat(5000)};
 assert.throws(()=>validatePetConfiguration(huge));
 assert.ok(JSON.stringify(huge).length>PET_MAX_BYTES);
 assert.deepEqual(validatePetConfiguration({version:1,catalogId:'wisp-capsule'}),{version:1,catalogId:'wisp-capsule'});
});

test('Linux-supplemental: catalog rows are eight selectable plus unsupported skins; skins cannot be managed',()=>{
 const rows=catalogRows({savedId:'wisp-orb',currentId:'wisp-orb'});
 assert.equal(rows.length,9);
 assert.deepEqual(rows.map(r=>r.id),[...WAVE1,UNSUPPORTED_SKINS_ID]);
 assert.equal(rows[0].title,'Wisp orb');
 assert.equal(rows[1].title,'Fox');
 assert.equal(rows[2].title,'Robot');
 assert.equal(rows[3].title,'Bird');
 assert.equal(rows[4].title,'Cat');
 assert.equal(rows[5].title,'Owl');
 assert.equal(rows[6].title,'Sprout');
 assert.equal(rows[7].title,'Capsule');
 assert.equal(rows[8].title,'Additional official skins');
 assert.equal(rows[8].id,'official-skins');
 assert.equal(rows[8].canManage,false);
 assert.equal(rows[8].status,'unavailable');
 assert.equal(rows[8].kind,'unsupported');
 const remainder=rows[8].detail;
 assert.equal(/remain(s)? (later )?\(?slice 19\)/i.test(remainder)||/added zero skins/i.test(remainder),false);
 assert.match(remainder,/later|eventual/i);
 assert.match(remainder,/marketplace/i);
 assert.match(remainder,/queried/i);
 assert.equal(/marketplace was queried(?!)/i.test(remainder)&&remainder.toLowerCase().includes('were queried')===false&&!/no marketplace/i.test(remainder),false);
 assert.equal(remainder.toLowerCase().includes('no marketplace')||/not queried/i.test(remainder),true);
 for(const row of rows.slice(0,8)){
  assert.equal(row.canManage,true);
  assert.equal(row.kind,'body');
 }
 assert.equal(rows[0].status,'current');
 const foxSaved=catalogRows({savedId:'wisp-fox',currentId:'wisp-fox'});
 assert.equal(foxSaved[1].status,'current');
 assert.equal(foxSaved[1].canManage,true);
 const birdSaved=catalogRows({savedId:'wisp-bird',currentId:'wisp-bird'});
 assert.equal(birdSaved[3].status,'current');
 const applying=catalogRows({savedId:'wisp-orb',currentId:'wisp-orb',applying:true,applyingId:'wisp-fox'});
 assert.equal(applying[1].status,'applying');
 assert.equal(applying.every(r=>r.id===UNSUPPORTED_SKINS_ID||!r.canManage),true);
 assert.equal(catalogRows({savedId:'wisp-fox',currentId:'wisp-orb'})[1].status,'saved');
 assert.equal(bodyStatus({id:'official-skins'}),'unavailable');
 assert.equal(bodyStatus({id:'wisp-capsule',savedId:'wisp-capsule',currentId:'wisp-capsule'}),'current');
});

test('Linux-supplemental: raster sample table has distinct unique-opaque points and a gap sample per id',()=>{
 const unique=new Set();
 const gaps=new Set();
 const all=new Set();
 for(const id of SELECTABLE_IDS){
  const sample=rasterSamples(id);
  assert.deepEqual(sample,RASTER_SAMPLES[id]);
  assert.deepEqual(sample.corner,[0,0]);
  assert.equal(sample.gap.length,2);
  assert.equal(sample.uniqueOpaque.length,2);
  assert.equal(Number.isInteger(sample.gap[0])&&Number.isInteger(sample.gap[1]),true);
  assert.equal(Number.isInteger(sample.uniqueOpaque[0])&&Number.isInteger(sample.uniqueOpaque[1]),true);
  for(const n of [...sample.gap,...sample.uniqueOpaque]){
   assert.equal(n>=0&&n<160,true);
  }
  const g=sample.gap.join(',');
  const u=sample.uniqueOpaque.join(',');
  assert.equal(gaps.has(g),false,`gap collision ${g}`);
  assert.equal(unique.has(u),false,`unique-opaque collision ${u}`);
  assert.equal(all.has(g),false,`gap collides with another sample ${g}`);
  assert.equal(all.has(u),false,`uniqueOpaque collides with another sample ${u}`);
  gaps.add(g);unique.add(u);all.add(g);all.add(u);
  assert.notEqual(g,u);
  assert.notEqual(g,'0,0');
  assert.notEqual(u,'0,0');
 }
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].corner,[0,0]);
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].gap,[80,98]);
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].uniqueOpaque,[40,80]);
 assert.deepEqual(RASTER_SAMPLES['wisp-fox'].gap,[80,78]);
 assert.deepEqual(RASTER_SAMPLES['wisp-fox'].uniqueOpaque,[52,20]);
 assert.deepEqual(RASTER_SAMPLES['wisp-robot'].gap,[80,34]);
 assert.deepEqual(RASTER_SAMPLES['wisp-robot'].uniqueOpaque,[80,8]);
 assert.throws(()=>rasterSamples('wisp-dragon'));
 assert.throws(()=>rasterSamples('official-skins'));
 assert.deepEqual(rasterSamples('wisp-bird').corner,[0,0]);
});

test('Linux-supplemental: writing pets/config.json with a wave-1 id does not modify sibling memory, reasoning, voice, plugins, connections, or skills bytes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-pet-iso-'));
 try{
  const siblings={
   'memory.json':JSON.stringify({version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}}),
   'reasoning/config.json':JSON.stringify({version:1,provider:'ollama',model:'qwen3:8b',selected:'local'}),
   'voice/config.json':JSON.stringify({version:1,locale:'en-US',voice:'installed',rate:0.5,muted:false}),
   'plugins/config.json':JSON.stringify({version:1,catalogId:'wisp-compatible-plugin',enabled:false,config:{note:''}}),
   'connections/config.json':JSON.stringify({version:1,catalogId:'wisp-demo-connection',enabled:false,config:{serverName:'wispdemo',note:'',credentialId:''}}),
   'skills/config.json':JSON.stringify({version:1,catalogId:'wisp-local-time-briefing',enabled:false}),
  };
  mkdirSync(join(dir,'reasoning'),{recursive:true});
  mkdirSync(join(dir,'voice'),{recursive:true});
  mkdirSync(join(dir,'plugins'),{recursive:true});
  mkdirSync(join(dir,'connections'),{recursive:true});
  mkdirSync(join(dir,'skills'),{recursive:true});
  writeFileSync(join(dir,'memory.json'),siblings['memory.json'],{mode:0o600});
  writeFileSync(join(dir,'reasoning/config.json'),siblings['reasoning/config.json'],{mode:0o600});
  writeFileSync(join(dir,'voice/config.json'),siblings['voice/config.json'],{mode:0o600});
  writeFileSync(join(dir,'plugins/config.json'),siblings['plugins/config.json'],{mode:0o600});
  writeFileSync(join(dir,'connections/config.json'),siblings['connections/config.json'],{mode:0o600});
  writeFileSync(join(dir,'skills/config.json'),siblings['skills/config.json'],{mode:0o600});
  const before=Object.fromEntries(Object.keys(siblings).map(rel=>[rel,readFileSync(join(dir,rel))]));
  const written=writePetSnapshot(dir,{version:1,catalogId:'wisp-fox'});
  assert.deepEqual(written,{version:1,catalogId:'wisp-fox'});
  assert.deepEqual(JSON.parse(readFileSync(join(dir,'pets/config.json'),'utf8')),{version:1,catalogId:'wisp-fox'});
  chmodSync(join(dir,'pets/config.json'),0o600);
  assert.deepEqual(readPetSnapshot(join(dir,'pets/config.json')),{version:1,catalogId:'wisp-fox'});
  for(const rel of Object.keys(siblings)){
   assert.deepEqual(readFileSync(join(dir,rel)),before[rel],rel);
  }
  writePetSnapshot(dir,{version:1,catalogId:'wisp-robot'});
  for(const rel of Object.keys(siblings)){
   assert.deepEqual(readFileSync(join(dir,rel)),before[rel],rel);
  }
  assert.equal(JSON.parse(readFileSync(join(dir,'pets/config.json'),'utf8')).catalogId,'wisp-robot');
  writePetSnapshot(dir,{version:1,catalogId:'wisp-capsule'});
  for(const rel of Object.keys(siblings)){
   assert.deepEqual(readFileSync(join(dir,rel)),before[rel],rel);
  }
  assert.equal(JSON.parse(readFileSync(join(dir,'pets/config.json'),'utf8')).catalogId,'wisp-capsule');
  writePetSnapshot(dir,{version:1,catalogId:'wisp-orb'});
  for(const rel of Object.keys(siblings)){
   assert.deepEqual(readFileSync(join(dir,rel)),before[rel],rel);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: pet-config is not a product overlay file',()=>{
 assert.equal(productFiles.includes('pet-config.mjs'),false);
 assert.equal(productFiles.includes('product.patch.yml'),true);
});
