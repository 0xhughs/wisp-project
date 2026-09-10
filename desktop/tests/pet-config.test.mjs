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

test('Linux-supplemental: closed enum is orb, fox, robot; default is wisp-orb',()=>{
 assert.deepEqual([...SELECTABLE_IDS],['wisp-orb','wisp-fox','wisp-robot']);
 assert.equal(DEFAULT_CATALOG_ID,'wisp-orb');
 const def=defaultPetConfiguration();
 assert.deepEqual(def,{version:1,catalogId:'wisp-orb'});
 assert.deepEqual(validatePetConfiguration(def),def);
 for(const id of SELECTABLE_IDS){
  assert.deepEqual(validatePetConfiguration({version:1,catalogId:id}),{version:1,catalogId:id});
 }
});

test('Linux-supplemental: unknown version, extra keys, oversize, empty id, bird, skins, tool-bash fail closed',()=>{
 const valid={version:1,catalogId:'wisp-orb'};
 assert.deepEqual(validatePetConfiguration(valid),valid);
 for(const patch of [
  {version:2},{version:true},{version:'1'},{catalogId:'wisp-bird'},{catalogId:'official-skins'},
  {catalogId:'tool-bash'},{catalogId:''},{catalogId:'marketplace-fox'},{catalogId:1},
  {extra:'x'},{catalogId:'wisp-orb',padding:'x'},
 ]) assert.throws(()=>validatePetConfiguration({...valid,...patch}));
 assert.throws(()=>validatePetConfiguration({version:1,catalogId:'wisp-orb',note:'no'}));
 assert.throws(()=>validatePetConfiguration({catalogId:'wisp-orb'}));
 assert.throws(()=>validatePetConfiguration({version:1}));
 const huge={version:1,catalogId:'wisp-orb',padding:'x'.repeat(5000)};
 assert.throws(()=>validatePetConfiguration(huge));
 assert.ok(JSON.stringify(huge).length>PET_MAX_BYTES);
});

test('Linux-supplemental: catalog rows are three selectable plus unsupported skins; skins cannot be managed',()=>{
 const rows=catalogRows({savedId:'wisp-orb',currentId:'wisp-orb'});
 assert.equal(rows.length,4);
 assert.deepEqual(rows.map(r=>r.id),['wisp-orb','wisp-fox','wisp-robot',UNSUPPORTED_SKINS_ID]);
 assert.equal(rows[0].title,'Wisp orb');
 assert.equal(rows[1].title,'Fox');
 assert.equal(rows[2].title,'Robot');
 assert.equal(rows[3].title,'Additional official skins');
 assert.equal(rows[3].id,'official-skins');
 assert.equal(rows[3].canManage,false);
 assert.equal(rows[3].status,'unavailable');
 assert.match(rows[3].detail,/slice 19|twenty|20/i);
 assert.equal(rows[3].detail.toLowerCase().includes('queried')||rows[3].detail.includes('marketplace')||rows[3].detail.includes('not queried'),true);
 for(const row of rows.slice(0,3)){
  assert.equal(row.canManage,true);
  assert.equal(row.kind,'body');
 }
 assert.equal(rows[0].status,'current');
 const foxSaved=catalogRows({savedId:'wisp-fox',currentId:'wisp-fox'});
 assert.equal(foxSaved[1].status,'current');
 assert.equal(foxSaved[1].canManage,true);
 const applying=catalogRows({savedId:'wisp-orb',currentId:'wisp-orb',applying:true,applyingId:'wisp-fox'});
 assert.equal(applying[1].status,'applying');
 assert.equal(applying.every(r=>r.id==='official-skins'||!r.canManage),true);
 assert.equal(catalogRows({savedId:'wisp-fox',currentId:'wisp-orb'})[1].status,'saved');
 assert.equal(bodyStatus({id:'official-skins'}),'unavailable');
});

test('Linux-supplemental: raster sample table has distinct unique-opaque points and a gap sample per id',()=>{
 const ids=['wisp-orb','wisp-fox','wisp-robot'];
 const unique=new Set();
 const gaps=new Set();
 for(const id of ids){
  const sample=rasterSamples(id);
  assert.deepEqual(sample,RASTER_SAMPLES[id]);
  assert.deepEqual(sample.corner,[0,0]);
  assert.equal(sample.gap.length,2);
  assert.equal(sample.uniqueOpaque.length,2);
  assert.equal(Number.isInteger(sample.gap[0])&&Number.isInteger(sample.gap[1]),true);
  assert.equal(Number.isInteger(sample.uniqueOpaque[0])&&Number.isInteger(sample.uniqueOpaque[1]),true);
  const g=sample.gap.join(',');
  const u=sample.uniqueOpaque.join(',');
  assert.equal(gaps.has(g),false,`gap collision ${g}`);
  assert.equal(unique.has(u),false,`unique-opaque collision ${u}`);
  gaps.add(g);unique.add(u);
  assert.notEqual(g,u);
  assert.notEqual(g,'0,0');
  assert.notEqual(u,'0,0');
 }
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].gap,[80,98]);
 assert.throws(()=>rasterSamples('wisp-bird'));
 assert.throws(()=>rasterSamples('official-skins'));
});

test('Linux-supplemental: writing pets/config.json does not modify sibling memory, reasoning, voice, plugins, or connections bytes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-pet-iso-'));
 try{
  const siblings={
   'memory.json':JSON.stringify({version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}}),
   'reasoning/config.json':JSON.stringify({version:1,provider:'ollama',model:'qwen3:8b',selected:'local'}),
   'voice/config.json':JSON.stringify({version:1,locale:'en-US',voice:'installed',rate:0.5,muted:false}),
   'plugins/config.json':JSON.stringify({version:1,catalogId:'wisp-compatible-plugin',enabled:false,config:{note:''}}),
   'connections/config.json':JSON.stringify({version:1,catalogId:'wisp-demo-connection',enabled:false,config:{serverName:'wispdemo',note:'',credentialId:''}}),
  };
  mkdirSync(join(dir,'reasoning'),{recursive:true});
  mkdirSync(join(dir,'voice'),{recursive:true});
  mkdirSync(join(dir,'plugins'),{recursive:true});
  mkdirSync(join(dir,'connections'),{recursive:true});
  writeFileSync(join(dir,'memory.json'),siblings['memory.json'],{mode:0o600});
  writeFileSync(join(dir,'reasoning/config.json'),siblings['reasoning/config.json'],{mode:0o600});
  writeFileSync(join(dir,'voice/config.json'),siblings['voice/config.json'],{mode:0o600});
  writeFileSync(join(dir,'plugins/config.json'),siblings['plugins/config.json'],{mode:0o600});
  writeFileSync(join(dir,'connections/config.json'),siblings['connections/config.json'],{mode:0o600});
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
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: pet-config is not a product overlay file',()=>{
 assert.equal(productFiles.includes('pet-config.mjs'),false);
 assert.equal(productFiles.includes('product.patch.yml'),true);
});
