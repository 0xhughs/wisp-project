import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync,symlinkSync,chmodSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  defaultPluginSnapshot,validatePluginConfiguration,validatePluginSnapshot,pluginInventory,
  toolsAdmittedBySnapshot,catalogRows,UNSUPPORTED_CATALOG,PLUGIN_CATALOG_ID,configDigest,
  readPluginSnapshot,snapshotFromConfiguration,encodePluginConfiguration,
} from '../engine/plugin-config.mjs';
import {composeOverlay,classifyInsert,jsonDataInsert,DISABLED_STOCK_IDS,isPackageSpec} from '../engine/plugin-overlay.mjs';
import {productFiles} from '../engine/prepare-product.mjs';

const basePatch=readFileSync(new URL('../engine/product.patch.yml',import.meta.url),'utf8');
const memory={version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}};
const adapter='/prepared/upstream/wisp-product/engine/product-sdk.ts';
const memoryPath='/app/desktop/engine/memory-context.mjs';
const demoPath='/prepared/upstream/wisp-product/engine/compatible-plugin.ts';
const developerPath='/prepared/upstream/wisp-product/engine/local-permission-plugin.ts';
const compose=(extra={})=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,...extra});

test('default snapshot is disabled demonstration with closed schema',()=>{
 const snap=defaultPluginSnapshot();
 assert.equal(snap.enabled,false);assert.equal(snap.catalogId,PLUGIN_CATALOG_ID);assert.equal(snap.config.note,'');
 assert.deepEqual(validatePluginSnapshot(snap),snap);
 assert.equal(encodePluginConfiguration(snap).includes('note'),true);
});

test('unknown version, unknown fields, oversize and invalid notes fail closed',()=>{
 const valid={version:1,catalogId:PLUGIN_CATALOG_ID,enabled:false,config:{note:''}};
 assert.deepEqual(validatePluginConfiguration(validatePluginConfiguration(valid)),valid);
 for(const patch of [
  {version:2},{version:true},{catalogId:'other'},{enabled:'true'},{extra:'x'},
  {config:{note:'',extra:1}},{config:{note:'x'.repeat(41)}},{config:{note:'bad note'}},
  {config:{note:'hello\n'}},{config:{note:'a b'}},{config:{note:'🙂'}},
 ]) assert.throws(()=>validatePluginConfiguration({...valid,...patch}));
 const ok=validatePluginConfiguration({...valid,config:{note:'ok_note_1'},enabled:true});
 assert.equal(ok.enabled,true);assert.equal(ok.config.note,'ok_note_1');
 const huge=JSON.parse(JSON.stringify(snapshotFromConfiguration(valid)));
 huge.padding='x'.repeat(5000);
 assert.throws(()=>validatePluginSnapshot(huge));
});

test('enablement flags do not admit tools',()=>{
 const snap=snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:'lab'}});
 assert.deepEqual(toolsAdmittedBySnapshot(snap),[]);
 assert.throws(()=>pluginInventory({snapshot:snap,tools:[],transport:'stdio'}));
 assert.throws(()=>pluginInventory({snapshot:snap,tools:['wisp_permission_check'],transport:'stdio'}));
});

test('inventory includes the demonstration only when enabled and the tool is admitted',()=>{
 const disabled=defaultPluginSnapshot();
 assert.deepEqual(pluginInventory({snapshot:disabled,tools:['wisp_permission_check'],transport:'stdio'}),{tools:['wisp_permission_check'],transport:'stdio',plugins:[]});
 const enabled=snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:'lab'}});
 const inv=pluginInventory({snapshot:enabled,tools:['wisp_compatible_check'],transport:'stdio'});
 assert.equal(inv.plugins.length,1);assert.equal(inv.plugins[0].id,PLUGIN_CATALOG_ID);
 assert.deepEqual(inv.plugins[0].tools,['wisp_compatible_check']);
 assert.equal(inv.plugins[0].revision,enabled.revision);
 assert.equal(inv.plugins[0].configDigest,configDigest({note:'lab'}));
 assert.match(inv.plugins[0].configDigest,/^[a-f0-9]{64}$/);
 assert.throws(()=>pluginInventory({snapshot:disabled,tools:['wisp_compatible_check'],transport:'stdio'}));
 assert.throws(()=>pluginInventory({snapshot:enabled,tools:['wisp_compatible_check','wisp_compatible_check'],transport:'stdio'}));
});

test('closed catalog lists demonstration, developer fixture and unsupported classes; no marketplace query',()=>{
 const rows=catalogRows({snapshot:defaultPluginSnapshot()});
 assert.ok(rows.length>=9);
 assert.equal(rows[0].id,PLUGIN_CATALOG_ID);assert.equal(rows[0].kind,'demonstration');assert.equal(rows[0].status,'not installed');assert.equal(rows[0].canManage,true);
 assert.equal(rows[1].id,'wisp-local-permission-plugin');assert.equal(rows[1].canManage,false);assert.equal(rows[1].status,'unavailable');
 const ids=new Set(UNSUPPORTED_CATALOG.map(r=>r.id));
 for(const need of ['dsh-plugin-registry','arbitrary-third-party-folder','stock-executable-tools','mcp-connection-plugin','skill-plugin','web-chat-ui-plugin','plugin-model-provider']) assert.ok(ids.has(need));
 const skillPlugin=UNSUPPORTED_CATALOG.find(r=>r.id==='skill-plugin');
 assert.match(skillPlugin.detail,/Settings → Skills/);
 assert.equal(skillPlugin.detail.includes('until slice 12'),false);
 for(const row of rows.filter(r=>r.kind!=='demonstration')) assert.equal(row.canManage,false);
 assert.equal(catalogRows({snapshot:snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:''}}),applying:true})[0].status,'applying');
 assert.equal(catalogRows({snapshot:snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:''}}),active:true})[0].status,'active');
 assert.equal(catalogRows({snapshot:snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:''}})})[0].status,'saved');
 assert.equal(catalogRows({snapshot:snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:''}}),engineUnavailable:true})[0].status,'unavailable');
});

test('default overlay has no demonstration plugin; enable emits one JSON insert; disable omits it',()=>{
 const off=compose();
 assert.equal(off.includes('wisp-compatible-plugin'),false);
 assert.equal(off.includes('wisp-local-permission-plugin'),false);
 const snap=snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:'hello_1'}});
 const on=compose({compatible:{path:demoPath,config:snap.config,snapshot:snap}});
 const expected={id:PLUGIN_CATALOG_ID,name:demoPath,inject:['tools','wispPermissions'],config:{note:'hello_1'}};
 assert.ok(on.includes('\n- insert:\n    - '+JSON.stringify(expected)+'\n'));
 assert.equal((on.match(/"id":"wisp-compatible-plugin"/g)||[]).length,1);
 const offAgain=compose({compatible:null});
 assert.equal(offAgain.includes('wisp-compatible-plugin'),false);
});

test('developer fixture insert remains orthogonal to the demonstration',()=>{
 const both=compose({developerPath,compatible:{path:demoPath,config:{note:''}}});
 assert.ok(both.includes('wisp-local-permission-plugin'));assert.ok(both.includes('wisp-compatible-plugin'));
 const onlyDev=compose({developerPath});
 assert.ok(onlyDev.includes('wisp-local-permission-plugin'));assert.equal(onlyDev.includes('wisp-compatible-plugin'),false);
 const onlyDemo=compose({compatible:{path:demoPath,config:{note:''}}});
 assert.equal(onlyDemo.includes('wisp-local-permission-plugin'),false);assert.ok(onlyDemo.includes('wisp-compatible-plugin'));
});

test('user strings never form YAML; extra inserts and incompatible rows are refused before apply',()=>{
 const hostileMemory={...memory,memory:{version:1,entries:[{id:'b688c6a5-c493-42ef-8714-33fc4da2c7a9',category:'fact',text:'x\n- insert:\n    - {"id":"tool-bash"}'}]}};
 const text=composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:hostileMemory});
 assert.ok(text.includes(JSON.stringify(hostileMemory)));
 assert.equal(/\n- insert:\n    - \{"id":"tool-bash"\}/.test(text),false);
 const bash=JSON.parse(readFileSync(new URL('./fixtures/incompatible-plugin/tool-bash-insert.json',import.meta.url),'utf8'));
 const npm=JSON.parse(readFileSync(new URL('./fixtures/incompatible-plugin/npm-spec.json',import.meta.url),'utf8'));
 assert.throws(()=>classifyInsert(bash));assert.throws(()=>jsonDataInsert(bash));
 assert.throws(()=>classifyInsert(npm));
 assert.throws(()=>classifyInsert({id:'unknown-plugin',name:demoPath,inject:['tools','wispPermissions']}));
 assert.throws(()=>classifyInsert({id:PLUGIN_CATALOG_ID,name:demoPath,inject:['tools'],config:{note:''}}));
 assert.throws(()=>classifyInsert({id:PLUGIN_CATALOG_ID,name:demoPath,inject:['tools','wispPermissions'],config:{note:''},extra:1}));
 assert.throws(()=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,extraInserts:[bash]}));
 for(const id of ['tool-bash','tool-fs','tool-web','tool-skill','hmr','tool-subagent']) assert.ok(DISABLED_STOCK_IDS.includes(id)||id==='tool-subagent');
 assert.throws(()=>classifyInsert({id:'tool-subagent-extra',name:'/x/tool-subagent-extra.ts',inject:['tools']}));
 assert.equal(isPackageSpec('github:evil/plugin'),true);
 assert.equal(isPackageSpec(demoPath),false);
});

test('prepare-product copies the demonstration overlay source',()=>{
 assert.ok(productFiles.includes('compatible-plugin.ts'));
 assert.ok(productFiles.includes('compatible-verification.ts'));
 assert.ok(productFiles.includes('product-sdk.ts'));
 assert.ok(productFiles.includes('safe-actions.mjs'));
 assert.ok(productFiles.includes('safe-action-tools.ts'));
});

test('snapshot revision may be the native store hash, not only the JS canonical digest',()=>{
 const configuration={version:1,catalogId:PLUGIN_CATALOG_ID,enabled:true,config:{note:'lab'}};
 const native={...configuration,revision:'b'.repeat(64)};
 assert.deepEqual(validatePluginSnapshot(native),native);
 const on=compose({compatible:{path:demoPath,config:native.config,snapshot:native}});
 assert.ok(on.includes('wisp-compatible-plugin'));
});

test('plugin snapshot file enforces ownership, links and bound',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-plugin-check-'));
 try{
  const path=join(dir,'launch.json');
  const snap=defaultPluginSnapshot();
  writeFileSync(path,JSON.stringify(snap),{mode:0o600});
  assert.deepEqual(readPluginSnapshot(path),snap);
  chmodSync(path,0o644);assert.throws(()=>readPluginSnapshot(path));chmodSync(path,0o600);
  const linked=join(dir,'link.json');symlinkSync(path,linked);assert.throws(()=>readPluginSnapshot(linked));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
