import {createHash} from 'node:crypto';
import {openSync,readFileSync,fstatSync,closeSync,constants} from 'node:fs';

export const PLUGIN_CATALOG_ID='wisp-compatible-plugin';
const noteRe=/^[A-Za-z0-9_-]{1,40}$/;
const hex64=/^[a-f0-9]{64}$/;
export function keys(value,names){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join()===names.sort().join();}
function sortKeys(value){if(Array.isArray(value))return value.map(sortKeys);if(value&&typeof value==='object'){const out={};for(const k of Object.keys(value).sort())out[k]=sortKeys(value[k]);return out;}return value;}
export function stableStringify(value){return JSON.stringify(sortKeys(value));}
export function encodePluginConfiguration(c){return stableStringify({version:c.version,catalogId:c.catalogId,enabled:c.enabled,config:{note:c.config.note}});}
export function pluginRevision(c){return createHash('sha256').update(encodePluginConfiguration(c)).digest('hex');}
export function configDigest(config){return createHash('sha256').update(stableStringify({note:config.note})).digest('hex');}
export function defaultPluginConfiguration(){return {version:1,catalogId:PLUGIN_CATALOG_ID,enabled:false,config:{note:''}};}
export function defaultPluginSnapshot(){const configuration=defaultPluginConfiguration();return {...configuration,revision:pluginRevision(configuration)};}
export function validatePluginConfig(config){
 if(!keys(config,['note'])||typeof config.note!=='string'||(config.note!==''&&!noteRe.test(config.note)))throw Error('PLUGIN_INVALID');
 return {note:config.note};
}
export function validatePluginConfiguration(value){
 if(!keys(value,['version','catalogId','enabled','config'])||value.version!==1||value.catalogId!==PLUGIN_CATALOG_ID||typeof value.enabled!=='boolean')throw Error('PLUGIN_INVALID');
 const config=validatePluginConfig(value.config);
 return {version:1,catalogId:PLUGIN_CATALOG_ID,enabled:value.enabled===true,config};
}
export function validatePluginSnapshot(value){
 // Revision is the durable-file digest (native SHA-256 of config.json, or JS pluginRevision).
 // Do not require it to equal pluginRevision(configuration): launch.json carries the store hash.
 if(!keys(value,['version','catalogId','enabled','config','revision'])||typeof value.revision!=='string'||!hex64.test(value.revision))throw Error('PLUGIN_INVALID');
 const configuration=validatePluginConfiguration({version:value.version,catalogId:value.catalogId,enabled:value.enabled,config:value.config});
 return {...configuration,revision:value.revision};
}
export function snapshotFromConfiguration(configuration){const c=validatePluginConfiguration(configuration);return {...c,revision:pluginRevision(c)};}
/** Snapshots never admit tools. Only a loaded plugin apply() may call admit. */
export function toolsAdmittedBySnapshot(_snapshot){return [];}
export function pluginInventory({snapshot,tools,transport='stdio'}){
 const snap=validatePluginSnapshot(snapshot);
 if(!Array.isArray(tools)||tools.some(t=>typeof t!=='string'||!t)||transport!=='stdio'||tools.length!==new Set(tools).size)throw Error('WISP_INVENTORY');
 const has=tools.includes('wisp_compatible_check');
 if(snap.enabled){if(!has)throw Error('WISP_INVENTORY');return {tools:[...tools],transport:'stdio',plugins:[{id:PLUGIN_CATALOG_ID,revision:snap.revision,tools:['wisp_compatible_check'],configDigest:configDigest(snap.config)}]};}
 if(has)throw Error('WISP_INVENTORY');
 return {tools:[...tools],transport:'stdio',plugins:[]};
}
export const UNSUPPORTED_CATALOG=[
 {id:'dsh-plugin-registry',kind:'unsupported',title:'Registry and marketplace install',status:'unavailable',detail:'Named marketplaces and dsh plugin pnpm, npm or git installs are unavailable.'},
 {id:'arbitrary-third-party-folder',kind:'unsupported',title:'Arbitrary third-party folder',status:'unavailable',detail:'Loading an arbitrary JavaScript folder is unavailable.'},
 {id:'stock-executable-tools',kind:'unsupported',title:'Stock executable tools',status:'incompatible',detail:'Shell, filesystem, web, job and related stock tools stay disabled.'},
 {id:'mcp-connection-plugin',kind:'unsupported',title:'MCP and Connections plugins',status:'unavailable',detail:'Connections and custom MCP stay unavailable until slice 11.'},
 {id:'skill-plugin',kind:'unsupported',title:'Skills plugins',status:'unavailable',detail:'Skills stay unavailable until slice 12.'},
 {id:'web-chat-ui-plugin',kind:'unsupported',title:'Web and chat UI plugins',status:'unavailable',detail:'Harness web and chat UI is not a Wisp surface.'},
 {id:'plugin-model-provider',kind:'unsupported',title:'Plugin-supplied models and providers',status:'incompatible',detail:'Models remains the sole owner of reasoning keys and provider choice.'},
];
export function demonstrationStatus({snapshot,applying=false,active=false,engineUnavailable=false}){
 const snap=validatePluginSnapshot(snapshot);
 if(applying)return 'applying';
 if(engineUnavailable)return snap.enabled?'unavailable':'not installed';
 if(!snap.enabled)return 'not installed';
 if(active)return 'active';
 return 'saved';
}
export function catalogRows(state={}){
 const snapshot=validatePluginSnapshot(state.snapshot||defaultPluginSnapshot());
 const demo=demonstrationStatus({snapshot,applying:!!state.applying,active:!!state.active,engineUnavailable:!!state.engineUnavailable});
 const developerActive=!!state.developer&&!!state.developerActive;
 return [
  {id:PLUGIN_CATALOG_ID,kind:'demonstration',title:'Compatible demonstration plugin',status:demo,detail:'Registers one harmless ledger-append tool. Wisp still asks before each action.',canManage:demo!=='incompatible'&&!state.applying},
  {id:'wisp-local-permission-plugin',kind:'developerFixture',title:'Developer permission fixture',status:developerActive?'active':'unavailable',detail:'Not a Plugins catalog install target. Visible only as a developer verification plugin.',canManage:false},
  ...UNSUPPORTED_CATALOG.map(row=>({...row,canManage:false})),
 ];
}
export function readPluginSnapshot(path){
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const st=fstatSync(fd);if(!st.isFile()||st.uid!==process.getuid()||st.nlink!==1||(st.mode&0o077)||st.size>4096)throw Error('PLUGIN_UNSAFE');
  const bytes=readFileSync(fd);if(bytes.length>4096)throw Error('PLUGIN_INVALID');
  return validatePluginSnapshot(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
 }finally{closeSync(fd);}
}
