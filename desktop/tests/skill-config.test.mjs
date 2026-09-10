import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync,mkdtempSync,chmodSync,symlinkSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  SKILL_CATALOG_ID,SKILL_NAME,SKILL_INSERT_ID,SKILL_SOURCE,SKILL_MAX_BYTES,SKILL_INVOCATION,
  defaultSkillConfiguration,defaultSkillSnapshot,validateSkillConfiguration,validateSkillSnapshot,
  snapshotFromSkill,skillInventory,toolsAdmittedBySkillSnapshot,catalogRows,UNSUPPORTED_SKILLS,
  skillConfigDigest,encodeSkillConfiguration,readSkillSnapshot,writeSkillSnapshot,parseSkillMarkdown,
  describeSkillLoad,isSkillName,
} from '../engine/skill-config.mjs';
import {composeOverlay,classifyInsert,jsonDataInsert,DISABLED_STOCK_IDS,isPackageSpec} from '../engine/plugin-overlay.mjs';
import {UNSUPPORTED_CATALOG} from '../engine/plugin-config.mjs';
import {productFiles} from '../engine/prepare-product.mjs';
import {wrapSkillExecute} from '../engine/skill-wrap.mjs';
import {validateRequest} from '../engine/permission-protocol.mjs';
import {VoiceController,RecognitionDouble,SynthesisDouble} from '../engine/voice-seams.mjs';

const basePatch=readFileSync(new URL('../engine/product.patch.yml',import.meta.url),'utf8');
const memory={version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}};
const adapter='/prepared/upstream/wisp-product/engine/product-sdk.ts';
const memoryPath='/app/desktop/engine/memory-context.mjs';
const skillPath='/prepared/upstream/wisp-product/engine/skill-register.ts';
const demoPath='/prepared/upstream/wisp-product/engine/compatible-plugin.ts';
const mcpPath='/prepared/upstream/wisp-product/engine/mcp-connection.ts';
const compose=(extra={})=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,...extra});
const skillMd=readFileSync(new URL('../engine/skills/wisp-local-time-briefing/SKILL.md',import.meta.url),'utf8');
const enabledSnap=()=>snapshotFromSkill({version:1,catalogId:SKILL_CATALOG_ID,enabled:true});
const skillRequest=()=>({version:1,generation:'g',requestId:'r',sessionId:'s',callId:'c',actionDigest:'a'.repeat(64),companionId:'companion',turn:1,rootCallId:'c',toolName:'skill',source:'wisp-skill',revision:'1',arguments:{name:'wisp-local-time-briefing'},operation:'load-skill-instructions',destination:'wisp-local-time-briefing',fields:[{label:'Skill',value:'Local time briefing'}]});
const fixtureRequest=()=>({version:1,generation:'g',requestId:'r',sessionId:'s',callId:'c',actionDigest:'a'.repeat(64),companionId:'companion',turn:1,rootCallId:'c',toolName:'wisp_permission_check',source:'wisp-direct',revision:'1',arguments:{label:'safe'},operation:'append-test-record',destination:'/owned/ledger',fields:[{label:'Record',value:'safe'}]});

test('Linux-supplemental: closed enum is wisp-local-time-briefing; default enabled false',()=>{
 assert.equal(SKILL_CATALOG_ID,'wisp-local-time-briefing');
 assert.equal(SKILL_NAME,'wisp-local-time-briefing');
 assert.equal(isSkillName(SKILL_NAME),true);
 const def=defaultSkillConfiguration();
 assert.deepEqual(def,{version:1,catalogId:'wisp-local-time-briefing',enabled:false});
 assert.equal(defaultSkillSnapshot().enabled,false);
 assert.equal(defaultSkillSnapshot().catalogId,SKILL_CATALOG_ID);
 assert.deepEqual(validateSkillConfiguration(def),def);
 assert.deepEqual(validateSkillSnapshot(defaultSkillSnapshot()),defaultSkillSnapshot());
 assert.equal(encodeSkillConfiguration(def).includes('catalogId'),true);
});

test('Linux-supplemental: unknown version, extra keys, oversize, empty id, meeting-prep, marketplace, tool-bash fail closed',()=>{
 const valid={version:1,catalogId:SKILL_CATALOG_ID,enabled:false};
 assert.deepEqual(validateSkillConfiguration(valid),valid);
 for(const patch of [
  {version:2},{version:true},{version:'1'},{catalogId:'meeting-prep-bundle'},{catalogId:'skill-marketplace'},
  {catalogId:'dsh-skill-badge'},{catalogId:'tool-bash'},{catalogId:''},{catalogId:'marketplace-skill'},{catalogId:1},
  {enabled:'true'},{enabled:1},{extra:'x'},{catalogId:SKILL_CATALOG_ID,padding:'x'},
 ]) assert.throws(()=>validateSkillConfiguration({...valid,...patch}));
 assert.throws(()=>validateSkillConfiguration({version:1,catalogId:SKILL_CATALOG_ID}));
 assert.throws(()=>validateSkillConfiguration({version:1,enabled:false}));
 assert.throws(()=>validateSkillConfiguration({catalogId:SKILL_CATALOG_ID,enabled:false}));
 const huge={version:1,catalogId:SKILL_CATALOG_ID,enabled:false,padding:'x'.repeat(5000)};
 assert.throws(()=>validateSkillConfiguration(huge));
 assert.ok(JSON.stringify(huge).length>SKILL_MAX_BYTES);
 const ok=validateSkillConfiguration({...valid,enabled:true});
 assert.equal(ok.enabled,true);
 const snapHuge=JSON.parse(JSON.stringify(snapshotFromSkill(valid)));
 snapHuge.padding='x'.repeat(5000);
 assert.throws(()=>validateSkillSnapshot(snapHuge));
});

test('Linux-supplemental: catalog rows are one selectable plus unsupported meeting-prep, marketplace, ambient, learned, skill-plugin, subagents',()=>{
 const rows=catalogRows({snapshot:defaultSkillSnapshot()});
 assert.equal(rows[0].id,SKILL_CATALOG_ID);
 assert.equal(rows[0].title,'Local time briefing');
 assert.equal(rows[0].kind,'demonstration');
 assert.equal(rows[0].status,'not installed');
 assert.equal(rows[0].canManage,true);
 const ids=new Set(UNSUPPORTED_SKILLS.map(r=>r.id));
 for(const need of ['meeting-prep-bundle','skill-marketplace','ambient-skill-folders','learned-user-authored','skill-plugin','general-subagents']) assert.ok(ids.has(need));
 for(const row of rows.filter(r=>r.kind!=='demonstration')) assert.equal(row.canManage,false);
 assert.equal(rows.find(r=>r.id==='meeting-prep-bundle').status,'unavailable');
 assert.equal(rows.find(r=>r.id==='skill-marketplace').status,'unavailable');
 assert.equal(rows.find(r=>r.id==='ambient-skill-folders').status,'unavailable');
 assert.equal(rows.find(r=>r.id==='learned-user-authored').status,'unavailable');
 assert.equal(rows.find(r=>r.id==='skill-plugin').status,'unavailable');
 assert.equal(rows.find(r=>r.id==='general-subagents').status,'unavailable');
 assert.equal(catalogRows({snapshot:enabledSnap(),applying:true})[0].status,'applying');
 assert.equal(catalogRows({snapshot:enabledSnap(),active:true})[0].status,'active');
 assert.equal(catalogRows({snapshot:enabledSnap()})[0].status,'saved');
 assert.equal(catalogRows({snapshot:enabledSnap(),engineUnavailable:true})[0].status,'unavailable');
 assert.match(rows.find(r=>r.id==='skill-marketplace').detail,/marketplace|not queried/i);
});

test('Linux-supplemental: SKILL.md name is kebab-case and user-invocable false',()=>{
 const parsed=parseSkillMarkdown(skillMd);
 assert.equal(parsed.name,'wisp-local-time-briefing');
 assert.equal(isSkillName(parsed.name),true);
 assert.match(parsed.name,/^[a-z0-9]+(?:-[a-z0-9]+)+$/);
 assert.equal(typeof parsed.description,'string');
 assert.ok(parsed.description.length>0);
 assert.match(parsed.content,/same Wisp/i);
 assert.match(parsed.content,/wisp_tell_time/);
 assert.match(parsed.content,/exactly once/i);
 assert.equal(SKILL_INVOCATION.modelInvocable,true);
 assert.equal(SKILL_INVOCATION.userInvocable,false);
 assert.equal(SKILL_SOURCE,'wisp-skill');
});

test('Linux-supplemental: writing skills/config.json does not modify sibling memory, reasoning, voice, plugins, connections, or pets bytes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-skill-iso-'));
 try{
  const siblings={
   'memory.json':JSON.stringify({version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}}),
   'reasoning/config.json':JSON.stringify({version:1,provider:'ollama',model:'qwen3:8b',selected:'local'}),
   'voice/config.json':JSON.stringify({version:1,locale:'en-US',voice:'installed',rate:0.5,muted:false}),
   'plugins/config.json':JSON.stringify({version:1,catalogId:'wisp-compatible-plugin',enabled:false,config:{note:''}}),
   'connections/config.json':JSON.stringify({version:1,catalogId:'wisp-demo-connection',enabled:false,config:{serverName:'wispdemo',note:'',credentialId:''}}),
   'pets/config.json':JSON.stringify({version:1,catalogId:'wisp-orb'}),
  };
  mkdirSync(join(dir,'reasoning'),{recursive:true});
  mkdirSync(join(dir,'voice'),{recursive:true});
  mkdirSync(join(dir,'plugins'),{recursive:true});
  mkdirSync(join(dir,'connections'),{recursive:true});
  mkdirSync(join(dir,'pets'),{recursive:true});
  for(const rel of Object.keys(siblings)) writeFileSync(join(dir,rel),siblings[rel],{mode:0o600});
  const before=Object.fromEntries(Object.keys(siblings).map(rel=>[rel,readFileSync(join(dir,rel))]));
  const written=writeSkillSnapshot(dir,{version:1,catalogId:SKILL_CATALOG_ID,enabled:true});
  assert.deepEqual(written,{version:1,catalogId:SKILL_CATALOG_ID,enabled:true});
  assert.deepEqual(JSON.parse(readFileSync(join(dir,'skills/config.json'),'utf8')),{version:1,catalogId:SKILL_CATALOG_ID,enabled:true});
  chmodSync(join(dir,'skills/config.json'),0o600);
  assert.deepEqual(readSkillSnapshot(join(dir,'skills/config.json')),snapshotFromSkill(written));
  for(const rel of Object.keys(siblings)) assert.deepEqual(readFileSync(join(dir,rel)),before[rel],rel);
  writeSkillSnapshot(dir,{version:1,catalogId:SKILL_CATALOG_ID,enabled:false});
  for(const rel of Object.keys(siblings)) assert.deepEqual(readFileSync(join(dir,rel)),before[rel],rel);
  assert.equal(JSON.parse(readFileSync(join(dir,'skills/config.json'),'utf8')).enabled,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: default overlay keeps tool-skill disabled and does not insert the register plugin',()=>{
 const off=compose();
 assert.match(off,/- id: tool-skill\n {2}disabled: true/);
 assert.equal(off.includes('\n- id: tool-skill\n  disabled: false\n'),false);
 assert.equal(off.includes('wisp-skill-register'),false);
 assert.equal(off.includes('wisp-local-time-briefing'),false);
 assert.match(off,/- id: skill-filesystem\n {2}disabled: true/);
 assert.match(off,/- id: tool-subagent\n {2}disabled: true/);
 assert.match(off,/- id: tool-bash\n {2}disabled: true/);
 const disabledSnap=defaultSkillSnapshot();
 const stillOff=compose({skill:{path:skillPath,snapshot:disabledSnap}});
 assert.equal(stillOff.includes('wisp-skill-register'),false);
 assert.equal(stillOff.includes('\n- id: tool-skill\n  disabled: false\n'),false);
});

test('Linux-supplemental: enabled composition contains an id-patch tool-skill disabled false and one register insert',()=>{
 const snap=enabledSnap();
 const on=compose({skill:{path:skillPath,snapshot:snap}});
 assert.ok(on.includes('\n- id: tool-skill\n  disabled: false\n'));
 const expected={id:SKILL_INSERT_ID,name:skillPath,inject:['skills']};
 assert.ok(on.includes('\n- insert:\n    - '+JSON.stringify(expected)+'\n'));
 assert.equal((on.match(/"id":"wisp-skill-register"/g)||[]).length,1);
 assert.equal(on.includes('"id":"tool-skill"'),false);
 assert.match(on,/- id: skill-filesystem\n {2}disabled: true/);
 assert.equal(compose({skill:null}).includes('wisp-skill-register'),false);
});

test('Linux-supplemental: classifyInsert still throws for tool-skill / skill-filesystem / tool-subagent inserts and extraInserts',()=>{
 assert.throws(()=>classifyInsert({id:'tool-skill',name:skillPath,inject:['skills']}));
 assert.throws(()=>classifyInsert({id:'skill-filesystem',name:'/x/skill-filesystem.ts',inject:['skills']}));
 assert.throws(()=>classifyInsert({id:'tool-subagent',name:'/x/tool-subagent.ts',inject:['tools']}));
 assert.throws(()=>classifyInsert({id:'tool-subagent-fork',name:'/x/tool-subagent-fork.ts',inject:['tools']}));
 assert.throws(()=>jsonDataInsert({id:'tool-skill',name:skillPath,inject:['agents','tools','skills']}));
 assert.throws(()=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,extraInserts:[{id:'tool-skill',name:skillPath,inject:['skills']}]}));
 assert.throws(()=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,skill:{path:skillPath,snapshot:enabledSnap()},extraInserts:[{id:SKILL_INSERT_ID,name:skillPath,inject:['skills']}]}));
 assert.ok(DISABLED_STOCK_IDS.includes('tool-skill'));
 assert.ok(DISABLED_STOCK_IDS.includes('skill-filesystem'));
 assert.ok(DISABLED_STOCK_IDS.includes('tool-subagent'));
 assert.ok(DISABLED_STOCK_IDS.includes('tool-bash'));
 assert.ok(DISABLED_STOCK_IDS.includes('tool-fs'));
 assert.ok(DISABLED_STOCK_IDS.includes('tool-web'));
 assert.equal(isPackageSpec(skillPath),false);
 const allowed=classifyInsert({id:SKILL_INSERT_ID,name:skillPath,inject:['skills']});
 assert.equal(allowed.id,SKILL_INSERT_ID);
 assert.throws(()=>classifyInsert({id:SKILL_INSERT_ID,name:skillPath,inject:['tools','wispPermissions']}));
 assert.throws(()=>classifyInsert({id:SKILL_INSERT_ID,name:skillPath,inject:['skills','tools']}));
});

test('Linux-supplemental: permission-protocol accepts skill / wisp-skill / load-skill-instructions / {name} and rejects other names and extra keys',()=>{
 assert.deepEqual(validateRequest(skillRequest()),skillRequest());
 assert.throws(()=>validateRequest({...skillRequest(),source:'wisp-direct'}));
 assert.throws(()=>validateRequest({...skillRequest(),source:'wisp-safe-action'}));
 assert.throws(()=>validateRequest({...skillRequest(),operation:'read-local-clock'}));
 assert.throws(()=>validateRequest({...skillRequest(),arguments:{name:'meeting-prep-bundle'}}));
 assert.throws(()=>validateRequest({...skillRequest(),arguments:{name:'wisp-local-time-briefing',extra:'x'}}));
 assert.throws(()=>validateRequest({...skillRequest(),arguments:{}}));
 assert.throws(()=>validateRequest({...skillRequest(),toolName:'skill_load'}));
 const time={...fixtureRequest(),toolName:'wisp_tell_time',source:'wisp-safe-action',arguments:{},operation:'read-local-clock',destination:'local-system-clock',fields:[{label:'Clock',value:'local'}]};
 assert.deepEqual(validateRequest(time),time);
 assert.deepEqual(validateRequest(fixtureRequest()),fixtureRequest());
 const url={...fixtureRequest(),toolName:'wisp_open_url',source:'wisp-safe-action',arguments:{url:'https://example.com/ok'},operation:'open-http-url',destination:'https://example.com/ok',fields:[{label:'URL',value:'https://example.com/ok'}]};
 assert.deepEqual(validateRequest(url),url);
});

test('Linux-supplemental: inventory helper disabled has no skill tool and empty skills; enabled requires skill present',()=>{
 const disabled=defaultSkillSnapshot();
 const direct=['wisp_open_url','wisp_open_file','wisp_tell_time'];
 assert.deepEqual(skillInventory({snapshot:disabled,tools:direct,transport:'stdio'}),{tools:direct,transport:'stdio',skills:[]});
 assert.throws(()=>skillInventory({snapshot:disabled,tools:[...direct,'skill'],transport:'stdio'}));
 assert.deepEqual(toolsAdmittedBySkillSnapshot(enabledSnap()),[]);
 assert.throws(()=>skillInventory({snapshot:enabledSnap(),tools:direct,transport:'stdio'}));
 const inv=skillInventory({snapshot:enabledSnap(),tools:[...direct,'skill'],transport:'stdio'});
 assert.equal(inv.skills.length,1);
 assert.equal(inv.skills[0].id,SKILL_CATALOG_ID);
 assert.equal(inv.skills[0].name,SKILL_NAME);
 assert.deepEqual(inv.skills[0].tools,['skill']);
 assert.equal(inv.skills[0].revision,enabledSnap().revision);
 assert.equal(inv.skills[0].configDigest,skillConfigDigest(enabledSnap()));
 assert.match(inv.skills[0].configDigest,/^[a-f0-9]{64}$/);
});

test('Linux-supplemental: wrap execute mutates the same object; consume runs before pin execute; deny is zero clock',()=>{
 let clock=0;
 const tool={name:'skill',execute:()=>{clock+=1;return '# instructions';}};
 const same=wrapSkillExecute(tool,()=>{});
 assert.equal(same,tool);
 assert.equal(tool.execute({name:'wisp-local-time-briefing'},{token:Symbol('g')}),'# instructions');
 assert.equal(clock,1);
 clock=0;
 const gated={name:'skill',execute:()=>{clock+=1;return 'secret-body';}};
 wrapSkillExecute(gated,()=>{throw Error('WISP_NO_GRANT');});
 assert.throws(()=>gated.execute({name:'wisp-local-time-briefing'},{}),/WISP_NO_GRANT/);
 assert.equal(clock,0);
 const action=describeSkillLoad({name:'wisp-local-time-briefing'});
 assert.equal(action.operation,'load-skill-instructions');
 assert.equal(action.destination,'wisp-local-time-briefing');
 assert.throws(()=>describeSkillLoad({name:'meeting-prep-bundle'}));
 assert.throws(()=>describeSkillLoad({name:'wisp-local-time-briefing',extra:1}));
});

test('Linux-supplemental: plugin/connection inserts remain orthogonal; skill-plugin Plugins row points at Settings → Skills',()=>{
 const both=compose({
  compatible:{path:demoPath,config:{note:''}},
  mcp:{path:mcpPath,config:{serverName:'wispdemo',note:'',credentialId:''}},
  skill:{path:skillPath,snapshot:enabledSnap()},
 });
 assert.ok(both.includes('wisp-compatible-plugin'));
 assert.ok(both.includes('wisp-mcp-connection'));
 assert.ok(both.includes('wisp-skill-register'));
 assert.ok(both.includes('\n- id: tool-skill\n  disabled: false\n'));
 const skillPlugin=UNSUPPORTED_CATALOG.find(r=>r.id==='skill-plugin');
 assert.ok(skillPlugin);
 assert.match(skillPlugin.detail,/Settings → Skills/);
 assert.equal(skillPlugin.detail.includes('until slice 12'),false);
 assert.equal(skillPlugin.canManage,undefined);
});

test('Linux-supplemental: skill catalog text and skill names cannot enter TTS as assistant replies',()=>{
 const mic=new RecognitionDouble();
 const speaker=new SynthesisDouble();
 const voice=new VoiceController({recognition:mic,synthesis:speaker});
 const gen='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 const companion='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
 voice.send=()=>true;voice.ready=()=>true;voice.localAvailable=()=>true;
 voice.attach(gen,companion);
 voice.activate();
 const id=voice.state.operationID;
 mic.deliver(id,'released');
 mic.deliver(id,'final','Brief me on local time');
 voice.receive({event:'ready',utteranceId:id,generation:gen,companionId:companion,text:'<available_skills> wisp-local-time-briefing',skills:[{id:SKILL_CATALOG_ID,name:SKILL_NAME}]});
 voice.receive({event:'wisp.inventory',utteranceId:id,generation:gen,companionId:companion,text:'skill wisp-local-time-briefing'});
 voice.approval(true);
 voice.receive({event:'voice-result',utteranceId:id,generation:gen,companionId:companion,text:'Should not speak during approval'});
 assert.deepEqual(speaker.spoken,[]);
});

test('Linux-supplemental: prepare-product copies skill overlay sources; snapshot file enforces ownership',()=>{
 assert.ok(productFiles.includes('skill-config.mjs'));
 assert.ok(productFiles.includes('skill-register.ts'));
 assert.ok(productFiles.includes('skill-wrap.mjs'));
 assert.ok(productFiles.includes('skills/wisp-local-time-briefing/SKILL.md'));
 const dir=mkdtempSync(join(tmpdir(),'wisp-skill-check-'));
 try{
  const path=join(dir,'launch.json');
  const snap=defaultSkillSnapshot();
  writeFileSync(path,JSON.stringify(snap),{mode:0o600});
  assert.deepEqual(readSkillSnapshot(path),snap);
  chmodSync(path,0o644);assert.throws(()=>readSkillSnapshot(path));chmodSync(path,0o600);
  const linked=join(dir,'link.json');symlinkSync(path,linked);assert.throws(()=>readSkillSnapshot(linked));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
