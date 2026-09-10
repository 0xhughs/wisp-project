import {createHash} from 'node:crypto';
import {mkdirSync,openSync,readFileSync,writeFileSync,fstatSync,closeSync,constants} from 'node:fs';
import {join} from 'node:path';
import {keys,stableStringify} from './plugin-config.mjs';

export const SKILL_CATALOG_ID='wisp-local-time-briefing';
export const SKILL_NAME='wisp-local-time-briefing';
export const SKILL_INSERT_ID='wisp-skill-register';
export const SKILL_SOURCE='wisp-skill';
export const SKILL_MAX_BYTES=4096;
export const SKILL_INVOCATION=Object.freeze({modelInvocable:true,userInvocable:false});
const hex64=/^[a-f0-9]{64}$/;
const SKILL_NAME_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSkillName(name){return typeof name==='string'&&SKILL_NAME_RE.test(name);}
export function encodeSkillConfiguration(c){return stableStringify({version:c.version,catalogId:c.catalogId,enabled:c.enabled});}
export function skillRevision(c){return createHash('sha256').update(encodeSkillConfiguration(c)).digest('hex');}
export function skillConfigDigest(c){return createHash('sha256').update(stableStringify({catalogId:c.catalogId,name:SKILL_NAME,enabled:c.enabled})).digest('hex');}
export function defaultSkillConfiguration(){return {version:1,catalogId:SKILL_CATALOG_ID,enabled:false};}
export function defaultSkillSnapshot(){const configuration=defaultSkillConfiguration();return {...configuration,revision:skillRevision(configuration)};}
export function validateSkillConfiguration(value){
 if(value==null||typeof value!=='object'||Array.isArray(value))throw Error('SKILL_INVALID');
 if(JSON.stringify(value).length>SKILL_MAX_BYTES)throw Error('SKILL_INVALID');
 if(!keys(value,['version','catalogId','enabled'])||value.version!==1||value.catalogId!==SKILL_CATALOG_ID||typeof value.enabled!=='boolean')throw Error('SKILL_INVALID');
 return {version:1,catalogId:SKILL_CATALOG_ID,enabled:value.enabled===true};
}
export function validateSkillSnapshot(value){
 if(!keys(value,['version','catalogId','enabled','revision'])||typeof value.revision!=='string'||!hex64.test(value.revision))throw Error('SKILL_INVALID');
 const configuration=validateSkillConfiguration({version:value.version,catalogId:value.catalogId,enabled:value.enabled});
 return {...configuration,revision:value.revision};
}
export function snapshotFromSkill(configuration){const c=validateSkillConfiguration(configuration);return {...c,revision:skillRevision(c)};}
export function toolsAdmittedBySkillSnapshot(_snapshot){return [];}
export function skillInventory({snapshot,tools,transport='stdio'}){
 const snap=validateSkillSnapshot(snapshot);
 if(!Array.isArray(tools)||tools.some(t=>typeof t!=='string'||!t)||transport!=='stdio'||tools.length!==new Set(tools).size)throw Error('WISP_INVENTORY');
 const has=tools.includes('skill');
 if(snap.enabled){
  if(!has)throw Error('WISP_INVENTORY');
  return {tools:[...tools],transport:'stdio',skills:[{id:SKILL_CATALOG_ID,name:SKILL_NAME,revision:snap.revision,tools:['skill'],configDigest:skillConfigDigest(snap)}]};
 }
 if(has)throw Error('WISP_INVENTORY');
 return {tools:[...tools],transport:'stdio',skills:[]};
}
export const UNSUPPORTED_SKILLS=[
 {id:'meeting-prep-bundle',kind:'unsupported',title:'Meeting preparation',status:'unavailable',detail:'Calendar, attendees, documents, and summarize remain an illustrative example, not a shipping service bundle.'},
 {id:'skill-marketplace',kind:'unsupported',title:'Skill marketplace',status:'unavailable',detail:'Named marketplaces, dsh skill install, npm/git skill packs, and dsh-skill-badge stay unavailable. No marketplace was queried.'},
 {id:'ambient-skill-folders',kind:'unsupported',title:'Ambient skill folders',status:'unavailable',detail:'Project .dsh/skills, user ~/.dsh/skills, ~/.agents/skills, and arbitrary folders stay unavailable. Stock skill-filesystem stays disabled.'},
 {id:'learned-user-authored',kind:'unsupported',title:'Learned or user-authored skills',status:'unavailable',detail:'Learning or authoring a new skill from conversation, a skill editor, or a slash-command composer stays unavailable.'},
 {id:'skill-plugin',kind:'unsupported',title:'Cordis skill plugins',status:'unavailable',detail:'Cordis skill plugins remain unavailable in Settings → Plugins. Skills are managed in Settings → Skills.'},
 {id:'general-subagents',kind:'unsupported',title:'General sub-agents',status:'unavailable',detail:'Stock tool-subagent, tool-subagent-fork, tool-subagent-control, and tool-subagent-list-agents stay disabled. Internal delegated consequential child asks remain denied.'},
];
export function demonstrationSkillStatus({snapshot,applying=false,active=false,engineUnavailable=false}){
 const snap=validateSkillSnapshot(snapshot);
 if(applying)return 'applying';
 if(engineUnavailable)return snap.enabled?'unavailable':'not installed';
 if(!snap.enabled)return 'not installed';
 if(active)return 'active';
 return 'saved';
}
export function catalogRows(state={}){
 const snapshot=validateSkillSnapshot(state.snapshot||defaultSkillSnapshot());
 const demo=demonstrationSkillStatus({snapshot,applying:!!state.applying,active:!!state.active,engineUnavailable:!!state.engineUnavailable});
 return [
  {id:SKILL_CATALOG_ID,kind:'demonstration',title:'Local time briefing',status:demo,detail:'Wisp-authored in-repo skill. Instructs the same Wisp to call the already-admitted Direct tool wisp_tell_time exactly once and to wait for Wisp confirmation. Enable is not Allow Once.',canManage:demo!=='incompatible'&&!state.applying},
  ...UNSUPPORTED_SKILLS.map(row=>({...row,canManage:false})),
 ];
}
export function parseSkillMarkdown(text){
 if(typeof text!=='string'||!text)throw Error('SKILL_INVALID');
 const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!match)throw Error('SKILL_INVALID');
 const fields={};
 for(const line of match[1].split(/\r?\n/)){
  if(!line)continue;
  const kv=line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
  if(!kv)throw Error('SKILL_INVALID');
  fields[kv[1]]=kv[2].trim();
 }
 if(!keys(fields,['name','description'])||!isSkillName(fields.name)||!fields.description)throw Error('SKILL_INVALID');
 return {name:fields.name,description:fields.description,content:match[2]};
}
export function describeSkillLoad(args,extra={}){
 if(!keys(args,['name'])||args.name!==SKILL_NAME)throw Error('WISP_FIXTURE_ARGUMENT');
 const fields=[{label:'Skill',value:'Local time briefing'},{label:'Name',value:SKILL_NAME},{label:'Effect',value:'Load instruction markdown only. This does not run other tools, including wisp_tell_time.'}];
 if(extra.note)fields.push({label:'Note',value:extra.note});
 return {operation:'load-skill-instructions',destination:SKILL_NAME,fields};
}
export function writeSkillSnapshot(supportDir,configuration){
 const value=validateSkillConfiguration(configuration);
 const dir=join(supportDir,'skills');
 mkdirSync(dir,{recursive:true,mode:0o700});
 writeFileSync(join(dir,'config.json'),JSON.stringify(value),{mode:0o600});
 return value;
}
export function readSkillSnapshot(path){
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const st=fstatSync(fd);if(!st.isFile()||st.uid!==process.getuid()||st.nlink!==1||(st.mode&0o077)||st.size>SKILL_MAX_BYTES)throw Error('SKILL_UNSAFE');
  const bytes=readFileSync(fd);if(bytes.length>SKILL_MAX_BYTES)throw Error('SKILL_INVALID');
  const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&parsed.revision)return validateSkillSnapshot(parsed);
  return snapshotFromSkill(validateSkillConfiguration(parsed));
 }finally{closeSync(fd);}
}
