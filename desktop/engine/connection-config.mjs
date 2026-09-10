import {createHash} from 'node:crypto';
import {openSync,readFileSync,fstatSync,closeSync,constants} from 'node:fs';
import {keys,stableStringify} from './plugin-config.mjs';

export const CONNECTION_CATALOG_ID='wisp-demo-connection';
export const MCP_INSERT_ID='wisp-mcp-connection';
export const MCP_SOURCE='wisp-mcp';
export const MCP_RAW_TOOL='record';
export const DEFAULT_SERVER_NAME='wispdemo';
const noteRe=/^[A-Za-z0-9_-]{1,40}$/;
const serverRe=/^[A-Za-z0-9_-]{1,32}$/;
const hex64=/^[a-f0-9]{64}$/;
const credentialRe=/^[A-Za-z0-9_-]{0,64}$/;

export function publicMcpToolName(serverName,rawName=MCP_RAW_TOOL){
 if(typeof serverName!=='string'||!serverRe.test(serverName)||typeof rawName!=='string'||!/^[A-Za-z0-9_-]{1,40}$/.test(rawName))throw Error('CONNECTION_INVALID');
 return `mcp__${serverName}__${rawName}`;
}
export function encodeConnectionConfiguration(c){return stableStringify({version:c.version,catalogId:c.catalogId,enabled:c.enabled,config:{serverName:c.config.serverName,note:c.config.note,credentialId:c.config.credentialId}});}
export function connectionRevision(c){return createHash('sha256').update(encodeConnectionConfiguration(c)).digest('hex');}
export function connectionConfigDigest(config){return createHash('sha256').update(stableStringify({serverName:config.serverName,note:config.note,credentialId:config.credentialId})).digest('hex');}
export function defaultConnectionConfiguration(){return {version:1,catalogId:CONNECTION_CATALOG_ID,enabled:false,config:{serverName:DEFAULT_SERVER_NAME,note:'',credentialId:''}};}
export function defaultConnectionSnapshot(){const configuration=defaultConnectionConfiguration();return {...configuration,revision:connectionRevision(configuration)};}
export function validateConnectionConfig(config){
 if(!keys(config,['serverName','note','credentialId'])||typeof config.serverName!=='string'||!serverRe.test(config.serverName)||typeof config.note!=='string'||(config.note!==''&&!noteRe.test(config.note))||typeof config.credentialId!=='string'||!credentialRe.test(config.credentialId))throw Error('CONNECTION_INVALID');
 return {serverName:config.serverName,note:config.note,credentialId:config.credentialId};
}
export function validateConnectionConfiguration(value){
 if(!keys(value,['version','catalogId','enabled','config'])||value.version!==1||value.catalogId!==CONNECTION_CATALOG_ID||typeof value.enabled!=='boolean')throw Error('CONNECTION_INVALID');
 return {version:1,catalogId:CONNECTION_CATALOG_ID,enabled:value.enabled===true,config:validateConnectionConfig(value.config)};
}
export function validateConnectionSnapshot(value){
 if(!keys(value,['version','catalogId','enabled','config','revision'])||typeof value.revision!=='string'||!hex64.test(value.revision))throw Error('CONNECTION_INVALID');
 const configuration=validateConnectionConfiguration({version:value.version,catalogId:value.catalogId,enabled:value.enabled,config:value.config});
 return {...configuration,revision:value.revision};
}
export function snapshotFromConnection(configuration){const c=validateConnectionConfiguration(configuration);return {...c,revision:connectionRevision(c)};}
export function toolsAdmittedByConnectionSnapshot(_snapshot){return [];}
export function overlayConnectionConfig(config){
 const c=validateConnectionConfig(config);
 return {serverName:c.serverName,note:c.note,credentialId:c.credentialId,transport:'stdio',failOnStartupError:true,reconnect:{enabled:false}};
}
export function validateConnectionInsertConfig(config){
 if(!keys(config,['serverName','note','credentialId','transport','failOnStartupError','reconnect']))throw Error('CONNECTION_INVALID');
 if(config.transport!=='stdio'||config.failOnStartupError!==true||!keys(config.reconnect,['enabled'])||config.reconnect.enabled!==false)throw Error('CONNECTION_INVALID');
 if('command' in config||'args' in config||'url' in config||'headers' in config||'env' in config||'npx' in config)throw Error('CONNECTION_INVALID');
 const base=validateConnectionConfig({serverName:config.serverName,note:config.note,credentialId:config.credentialId});
 return overlayConnectionConfig(base);
}
export function describeMcpRecord(args,destination,extra={}){
 if(!keys(args,['label'])||typeof args.label!=='string'||!noteRe.test(args.label))throw Error('WISP_FIXTURE_ARGUMENT');
 if(typeof destination!=='string'||!destination||destination.length>2048)throw Error('WISP_UNRENDERABLE');
 const publicName=typeof extra.publicName==='string'&&extra.publicName?extra.publicName:publicMcpToolName(DEFAULT_SERVER_NAME);
 const fields=[{label:'Record label',value:args.label},{label:'Public tool',value:publicName},{label:'Effect',value:'Append one harmless verification record. No user files, accounts or services are changed.'}];
 if(extra.note)fields.push({label:'Connection note',value:extra.note});
 return {operation:'append-test-record',destination,fields};
}
export function connectionInventory({snapshot,tools,transport='stdio'}){
 const snap=validateConnectionSnapshot(snapshot);
 if(!Array.isArray(tools)||tools.some(t=>typeof t!=='string'||!t)||transport!=='stdio'||tools.length!==new Set(tools).size)throw Error('WISP_INVENTORY');
 const publicName=publicMcpToolName(snap.config.serverName);
 const has=tools.includes(publicName);
 const extras=tools.filter(t=>t.startsWith('mcp__')&&t!==publicName);
 if(snap.enabled){
  if(!has||extras.length)throw Error('WISP_INVENTORY');
  return {tools:[...tools],transport:'stdio',connections:[{id:CONNECTION_CATALOG_ID,serverName:snap.config.serverName,revision:snap.revision,tools:[publicName],transport:'stdio',configDigest:connectionConfigDigest(snap.config)}]};
 }
 if(has||tools.some(t=>t.startsWith('mcp__')))throw Error('WISP_INVENTORY');
 return {tools:[...tools],transport:'stdio',connections:[]};
}
export const UNSUPPORTED_CONNECTIONS=[
 {id:'github',kind:'unsupported',title:'GitHub',status:'unavailable',detail:'Named SaaS connectors are examples, not a shipping bundle.'},
 {id:'google-drive',kind:'unsupported',title:'Google Drive',status:'unavailable',detail:'Named SaaS connectors are examples, not a shipping bundle.'},
 {id:'notion',kind:'unsupported',title:'Notion',status:'unavailable',detail:'Named SaaS connectors are examples, not a shipping bundle.'},
 {id:'calendar',kind:'unsupported',title:'Calendar',status:'unavailable',detail:'Named SaaS connectors are examples, not a shipping bundle.'},
 {id:'slack',kind:'unsupported',title:'Slack',status:'unavailable',detail:'Named SaaS connectors are examples, not a shipping bundle.'},
 {id:'remote-http-mcp',kind:'unsupported',title:'Remote or non-loopback HTTP MCP',status:'unavailable',detail:'Streamable HTTP and remote URLs stay unavailable in Settings.'},
 {id:'npx-npm-git-mcp',kind:'unsupported',title:'npx, npm or git MCP servers',status:'unavailable',detail:'User-chosen executables and registry installs stay unavailable.'},
 {id:'mcp-resources-prompts',kind:'unsupported',title:'MCP resources and prompts',status:'unavailable',detail:'The pinned bridge is tool-only. Resources and prompts stay unsupported.'},
 {id:'plugin-delivered-mcp',kind:'unsupported',title:'Plugin-delivered MCP',status:'unavailable',detail:'Plugin-delivered Connections remain unavailable; use Settings → Connections.'},
];
export function demonstrationConnectionStatus({snapshot,applying=false,active=false,engineUnavailable=false}){
 const snap=validateConnectionSnapshot(snapshot);
 if(applying)return 'applying';
 if(engineUnavailable)return snap.enabled?'unavailable':'not installed';
 if(!snap.enabled)return 'not installed';
 if(active)return 'active';
 return 'saved';
}
export function connectionCatalogRows(state={}){
 const snapshot=validateConnectionSnapshot(state.snapshot||defaultConnectionSnapshot());
 const demo=demonstrationConnectionStatus({snapshot,applying:!!state.applying,active:!!state.active,engineUnavailable:!!state.engineUnavailable});
 const manage=demo!=='incompatible'&&!state.applying;
 return [
  {id:CONNECTION_CATALOG_ID,kind:'demonstration',title:'Local stdio demonstration',status:demo,detail:'Registers one harmless ledger-append MCP tool. Wisp still asks before each action. Connection save is not a grant.',canManage:manage},
  {id:'wisp-advanced-mcp',kind:'advanced',title:'Advanced custom MCP (same class)',status:demo,detail:'Accepted mcp-client fields for this demonstration only. Transport stdio, command/args, failOnStartupError and reconnect are Wisp-fixed.',canManage:manage},
  ...UNSUPPORTED_CONNECTIONS.map(row=>({...row,canManage:false})),
 ];
}
export function readConnectionSnapshot(path){
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const st=fstatSync(fd);if(!st.isFile()||st.uid!==process.getuid()||st.nlink!==1||(st.mode&0o077)||st.size>4096)throw Error('CONNECTION_UNSAFE');
  const bytes=readFileSync(fd);if(bytes.length>4096)throw Error('CONNECTION_INVALID');
  return validateConnectionSnapshot(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
 }finally{closeSync(fd);}
}
export function resolveMcpAdapterEnv({credentialId='',secret='',sentinel}={}){
 const env={};
 if(typeof sentinel==='string'&&sentinel)env.WISP_CONNECTION_SENTINEL=sentinel;
 if(typeof credentialId==='string'&&credentialId&&typeof secret==='string'&&secret)env.WISP_CONNECTION_VALUE=secret;
 return env;
}
