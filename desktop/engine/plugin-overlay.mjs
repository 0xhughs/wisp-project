import {basename} from 'node:path';
import {PLUGIN_CATALOG_ID,keys,validatePluginConfig,validatePluginSnapshot} from './plugin-config.mjs';
import {MCP_INSERT_ID,validateConnectionInsertConfig,validateConnectionSnapshot,overlayConnectionConfig} from './connection-config.mjs';

export const DISABLED_STOCK_IDS=Object.freeze([
 'sdk-jsonrpc-server','session-title-llm','session-telemetry-otel','hmr',
 'tool-bash','tool-pwsh','tool-jobs','tool-fs','tool-fs-search','tool-skill',
 'tool-subagent-control','tool-subagent-list-agents','tool-subagent','tool-subagent-fork',
 'tool-workflow','tool-todo','tool-goal','tool-ralph','tool-str-replace-editor','tool-web',
 'agent-instructions','skill-filesystem','command-feedback','goal-round-driver',
 'command-goal','plan-mode','command-compact','llm-deepseek','web-search-deepseek','web-fetch-http',
]);
const COVERED={
 'wisp-product-sdk':'product-sdk.ts',
 'wisp-memory':'memory-context.mjs',
 'wisp-local-permission-plugin':'local-permission-plugin.ts',
 [PLUGIN_CATALOG_ID]:'compatible-plugin.ts',
 [MCP_INSERT_ID]:'mcp-connection.ts',
};
const INJECT={
 'wisp-product-sdk':['sdkAppStartup','loader','agents','tools','approval','subagents'],
 'wisp-memory':['systemPrompt'],
 'wisp-local-permission-plugin':['tools','wispPermissions'],
 [PLUGIN_CATALOG_ID]:['tools','wispPermissions'],
 [MCP_INSERT_ID]:['tools','wispPermissions'],
};

export function isPackageSpec(name){
 if(typeof name!=='string'||!name)return true;
 if(/^(npm:|git\+|github:|https?:|file:|ssh:)/i.test(name))return true;
 if(name.startsWith('@'))return true;
 if(!name.startsWith('/'))return true;
 if(name.includes('..')||name.includes('\\')||/[?#*]/.test(name))return true;
 return false;
}
function sameInject(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&actual.every((v,i)=>v===expected[i]);}

/** Static eligibility. Never executes plugin apply(). */
export function classifyInsert(entry,{developer=false}={}){
 if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('PLUGIN_INCOMPATIBLE');
 const optional=entry.config===undefined?['id','name','inject']:['id','name','inject','config'];
 if(!keys(entry,optional)||typeof entry.id!=='string'||typeof entry.name!=='string'||!Array.isArray(entry.inject)||entry.inject.some(v=>typeof v!=='string'||!v))throw Error('PLUGIN_INCOMPATIBLE');
 if(DISABLED_STOCK_IDS.includes(entry.id)||entry.id.startsWith('tool-subagent'))throw Error('PLUGIN_INCOMPATIBLE');
 const allowed=developer?Object.keys(COVERED):Object.keys(COVERED).filter(id=>id!=='wisp-local-permission-plugin');
 if(!allowed.includes(entry.id))throw Error('PLUGIN_INCOMPATIBLE');
 if(isPackageSpec(entry.name)||basename(entry.name)!==COVERED[entry.id])throw Error('PLUGIN_INCOMPATIBLE');
 if(!sameInject(entry.inject,INJECT[entry.id]))throw Error('PLUGIN_INCOMPATIBLE');
 if(entry.inject.includes('tools')&&!entry.inject.includes('wispPermissions')&&entry.id!=='wisp-product-sdk')throw Error('PLUGIN_INCOMPATIBLE');
 if(entry.id===PLUGIN_CATALOG_ID){if(!entry.config)throw Error('PLUGIN_INCOMPATIBLE');validatePluginConfig(entry.config);}
 else if(entry.id===MCP_INSERT_ID){if(!entry.config)throw Error('PLUGIN_INCOMPATIBLE');validateConnectionInsertConfig(entry.config);}
 else if(entry.config!==undefined&&entry.id!=='wisp-memory'&&entry.id!=='wisp-product-sdk')throw Error('PLUGIN_INCOMPATIBLE');
 return {eligible:true,id:entry.id};
}

export function jsonDataInsert(entry,options){
 classifyInsert(entry,options);
 // User strings are JSON data, never YAML syntax.
 return '\n- insert:\n    - '+JSON.stringify(entry)+'\n';
}

export function composeOverlay({basePatch,adapterPath,memoryPath,memoryConfig,developerPath=null,compatible=null,mcp=null,extraInserts}={}){
 if(extraInserts!==undefined&&!(Array.isArray(extraInserts)&&extraInserts.length===0))throw Error('PLUGIN_INCOMPATIBLE');
 if(typeof basePatch!=='string'||!basePatch.includes('__WISP_PRODUCT_ADAPTER__')||basePatch.includes(PLUGIN_CATALOG_ID)||basePatch.includes(MCP_INSERT_ID))throw Error('PLUGIN_OVERLAY');
 if(typeof adapterPath!=='string'||isPackageSpec(adapterPath)||basename(adapterPath)!=='product-sdk.ts')throw Error('PLUGIN_OVERLAY');
 if(typeof memoryPath!=='string'||isPackageSpec(memoryPath)||basename(memoryPath)!=='memory-context.mjs')throw Error('PLUGIN_OVERLAY');
 let text=basePatch.replaceAll('__WISP_PRODUCT_ADAPTER__',JSON.stringify(adapterPath));
 text+=jsonDataInsert({id:'wisp-memory',name:memoryPath,inject:['systemPrompt'],config:memoryConfig},{developer:!!developerPath});
 if(developerPath){
  if(typeof developerPath!=='string'||isPackageSpec(developerPath)||basename(developerPath)!=='local-permission-plugin.ts')throw Error('PLUGIN_OVERLAY');
  text+=jsonDataInsert({id:'wisp-local-permission-plugin',name:developerPath,inject:['tools','wispPermissions']},{developer:true});
 }
 if(compatible){
  if(!keys(compatible,['path','config'])&&!keys(compatible,['path','config','snapshot']))throw Error('PLUGIN_INCOMPATIBLE');
  if(compatible.snapshot)validatePluginSnapshot(compatible.snapshot);
  const config=validatePluginConfig(compatible.config);
  if(typeof compatible.path!=='string')throw Error('PLUGIN_INCOMPATIBLE');
  text+=jsonDataInsert({id:PLUGIN_CATALOG_ID,name:compatible.path,inject:['tools','wispPermissions'],config},{developer:!!developerPath});
 }
 if(mcp){
  if(!keys(mcp,['path','config'])&&!keys(mcp,['path','config','snapshot']))throw Error('PLUGIN_INCOMPATIBLE');
  if(mcp.snapshot)validateConnectionSnapshot(mcp.snapshot);
  const config=overlayConnectionConfig(mcp.config);
  if(typeof mcp.path!=='string')throw Error('PLUGIN_INCOMPATIBLE');
  text+=jsonDataInsert({id:MCP_INSERT_ID,name:mcp.path,inject:['tools','wispPermissions'],config},{developer:!!developerPath});
 }
 if((text.match(/wisp-compatible-plugin/g)||[]).length!==(compatible?1:0))throw Error('PLUGIN_OVERLAY');
 if((text.match(/wisp-mcp-connection/g)||[]).length!==(mcp?1:0))throw Error('PLUGIN_OVERLAY');
 return text;
}
