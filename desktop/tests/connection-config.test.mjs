import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync,mkdtempSync,chmodSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  defaultConnectionSnapshot,validateConnectionConfiguration,validateConnectionSnapshot,
  snapshotFromConnection,connectionInventory,toolsAdmittedByConnectionSnapshot,
  connectionCatalogRows,UNSUPPORTED_CONNECTIONS,CONNECTION_CATALOG_ID,MCP_INSERT_ID,
  connectionConfigDigest,overlayConnectionConfig,validateConnectionInsertConfig,
  publicMcpToolName,describeMcpRecord,readConnectionSnapshot,DEFAULT_SERVER_NAME,
  resolveMcpAdapterEnv,encodeConnectionConfiguration,
} from '../engine/connection-config.mjs';
import {composeOverlay,classifyInsert,jsonDataInsert,DISABLED_STOCK_IDS,isPackageSpec} from '../engine/plugin-overlay.mjs';
import {UNSUPPORTED_CATALOG,PLUGIN_CATALOG_ID,snapshotFromConfiguration} from '../engine/plugin-config.mjs';
import {productFiles} from '../engine/prepare-product.mjs';
import {wrapMcpExecute,mcpInventoryValid,sealMcpInventory} from '../engine/mcp-wrap.mjs';
import {McpStdioClient,rpcCount,ledgerLines} from '../engine/mcp-stdio.mjs';
import {writeConnectionSecretStore,readConnectionSecret} from '../engine/connection-secrets.mjs';
import {validateRequest} from '../engine/permission-protocol.mjs';
import {VoiceController,RecognitionDouble,SynthesisDouble} from '../engine/voice-seams.mjs';

const basePatch=readFileSync(new URL('../engine/product.patch.yml',import.meta.url),'utf8');
const memory={version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}};
const adapter='/prepared/upstream/wisp-product/engine/product-sdk.ts';
const memoryPath='/app/desktop/engine/memory-context.mjs';
const demoPath='/prepared/upstream/wisp-product/engine/compatible-plugin.ts';
const mcpPath='/prepared/upstream/wisp-product/engine/mcp-connection.ts';
const developerPath='/prepared/upstream/wisp-product/engine/local-permission-plugin.ts';
const fixture=fileURLToPath(new URL('../engine/mcp-demo-fixture.mjs',import.meta.url));
const compose=(extra={})=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,...extra});
const enabledSnap=()=>snapshotFromConnection({version:1,catalogId:CONNECTION_CATALOG_ID,enabled:true,config:{serverName:DEFAULT_SERVER_NAME,note:'lab_1',credentialId:''}});
const mcpRequest=()=>({version:1,generation:'g',requestId:'r',sessionId:'s',callId:'c',actionDigest:'a'.repeat(64),companionId:'companion',turn:1,rootCallId:'c',toolName:'mcp__wispdemo__record',source:'wisp-mcp',revision:'1',arguments:{label:'safe'},operation:'append-test-record',destination:'/owned/mcp-ledger',fields:[{label:'Record',value:'safe'}]});
const fixtureRequest=()=>({version:1,generation:'g',requestId:'r',sessionId:'s',callId:'c',actionDigest:'a'.repeat(64),companionId:'companion',turn:1,rootCallId:'c',toolName:'wisp_permission_check',source:'wisp-direct',revision:'1',arguments:{label:'safe'},operation:'append-test-record',destination:'/owned/ledger',fields:[{label:'Record',value:'safe'}]});

test('Linux-supplemental: default connection snapshot is disabled demonstration with closed schema',()=>{
 const snap=defaultConnectionSnapshot();
 assert.equal(snap.enabled,false);assert.equal(snap.catalogId,CONNECTION_CATALOG_ID);
 assert.equal(snap.config.serverName,DEFAULT_SERVER_NAME);assert.equal(snap.config.note,'');assert.equal(snap.config.credentialId,'');
 assert.deepEqual(validateConnectionSnapshot(snap),snap);
 assert.equal(encodeConnectionConfiguration(snap).includes('serverName'),true);
});

test('Linux-supplemental: unknown version, oversize, invalid note and serverName fail closed',()=>{
 const valid={version:1,catalogId:CONNECTION_CATALOG_ID,enabled:false,config:{serverName:'wispdemo',note:'',credentialId:''}};
 assert.deepEqual(validateConnectionConfiguration(validateConnectionConfiguration(valid)),valid);
 for(const patch of [
  {version:2},{version:true},{catalogId:'other'},{enabled:'true'},{extra:'x'},
  {config:{serverName:'wispdemo',note:'',credentialId:'',extra:1}},
  {config:{serverName:'wispdemo',note:'x'.repeat(41),credentialId:''}},
  {config:{serverName:'bad name',note:'',credentialId:''}},
  {config:{serverName:'',note:'',credentialId:''}},
  {config:{serverName:'wispdemo',note:'hello\n',credentialId:''}},
  {config:{serverName:'npx',note:'',credentialId:'bad id!'}},
 ]) assert.throws(()=>validateConnectionConfiguration({...valid,...patch}));
 const ok=validateConnectionConfiguration({...valid,config:{serverName:'custom_1',note:'ok_note_1',credentialId:'cred_1'},enabled:true});
 assert.equal(ok.enabled,true);assert.equal(ok.config.serverName,'custom_1');
 const huge=JSON.parse(JSON.stringify(snapshotFromConnection(valid)));
 huge.padding='x'.repeat(5000);
 assert.throws(()=>validateConnectionSnapshot(huge));
});

test('Linux-supplemental: enablement flags do not admit MCP tools',()=>{
 const snap=enabledSnap();
 assert.deepEqual(toolsAdmittedByConnectionSnapshot(snap),[]);
 assert.throws(()=>connectionInventory({snapshot:snap,tools:[],transport:'stdio'}));
 assert.throws(()=>connectionInventory({snapshot:snap,tools:['wisp_open_url'],transport:'stdio'}));
});

test('Linux-supplemental: inventory includes mcp__wispdemo__record only when enabled and admitted',()=>{
 const disabled=defaultConnectionSnapshot();
 assert.deepEqual(connectionInventory({snapshot:disabled,tools:['wisp_open_url'],transport:'stdio'}),{tools:['wisp_open_url'],transport:'stdio',connections:[]});
 const enabled=enabledSnap();
 const inv=connectionInventory({snapshot:enabled,tools:['mcp__wispdemo__record'],transport:'stdio'});
 assert.equal(inv.connections.length,1);assert.equal(inv.connections[0].id,CONNECTION_CATALOG_ID);
 assert.equal(inv.connections[0].serverName,'wispdemo');
 assert.deepEqual(inv.connections[0].tools,['mcp__wispdemo__record']);
 assert.equal(inv.connections[0].transport,'stdio');
 assert.equal(inv.connections[0].configDigest,connectionConfigDigest(enabled.config));
 assert.match(inv.connections[0].configDigest,/^[a-f0-9]{64}$/);
 assert.throws(()=>connectionInventory({snapshot:disabled,tools:['mcp__wispdemo__record'],transport:'stdio'}));
 assert.throws(()=>connectionInventory({snapshot:enabled,tools:['mcp__wispdemo__record','mcp__wispdemo__extra'],transport:'stdio'}));
});

test('Linux-supplemental: closed catalog lists demonstration, advanced same-class editor and unavailable examples',()=>{
 const rows=connectionCatalogRows({snapshot:defaultConnectionSnapshot()});
 assert.ok(rows.length>=11);
 assert.equal(rows[0].id,CONNECTION_CATALOG_ID);assert.equal(rows[0].kind,'demonstration');assert.equal(rows[0].status,'not installed');assert.equal(rows[0].canManage,true);
 assert.equal(rows[1].kind,'advanced');assert.equal(rows[1].canManage,true);
 const ids=new Set(UNSUPPORTED_CONNECTIONS.map(r=>r.id));
 for(const need of ['github','google-drive','notion','calendar','slack','remote-http-mcp','npx-npm-git-mcp','mcp-resources-prompts','plugin-delivered-mcp']) assert.ok(ids.has(need));
 for(const row of rows.filter(r=>r.kind==='unsupported')) assert.equal(row.canManage,false);
 assert.equal(connectionCatalogRows({snapshot:enabledSnap(),applying:true})[0].status,'applying');
 assert.equal(connectionCatalogRows({snapshot:enabledSnap(),active:true})[0].status,'active');
 assert.equal(connectionCatalogRows({snapshot:enabledSnap()})[0].status,'saved');
 assert.equal(connectionCatalogRows({snapshot:enabledSnap(),engineUnavailable:true})[0].status,'unavailable');
});

test('Linux-supplemental: default overlay has no MCP insert; enable emits Wisp-fixed stdio insert; disable omits it',()=>{
 const off=compose();
 assert.equal(off.includes('wisp-mcp-connection'),false);
 assert.equal(off.includes('mcp__'),false);
 assert.equal(off.includes('npx'),false);
 const snap=enabledSnap();
 const on=compose({mcp:{path:mcpPath,config:snap.config,snapshot:snap}});
 const expected={id:MCP_INSERT_ID,name:mcpPath,inject:['tools','wispPermissions'],config:overlayConnectionConfig(snap.config)};
 assert.ok(on.includes('\n- insert:\n    - '+JSON.stringify(expected)+'\n'));
 assert.equal(expected.config.transport,'stdio');
 assert.equal(expected.config.failOnStartupError,true);
 assert.deepEqual(expected.config.reconnect,{enabled:false});
 assert.equal('command' in expected.config,false);
 assert.equal((on.match(/"id":"wisp-mcp-connection"/g)||[]).length,1);
 assert.equal(compose({mcp:null}).includes('wisp-mcp-connection'),false);
});

test('Linux-supplemental: compatible-plugin insert remains orthogonal to the MCP insert',()=>{
 const both=compose({compatible:{path:demoPath,config:{note:''}},mcp:{path:mcpPath,config:enabledSnap().config}});
 assert.ok(both.includes('wisp-compatible-plugin'));assert.ok(both.includes('wisp-mcp-connection'));
 const onlyPlugin=compose({compatible:{path:demoPath,config:{note:''}}});
 assert.ok(onlyPlugin.includes('wisp-compatible-plugin'));assert.equal(onlyPlugin.includes('wisp-mcp-connection'),false);
 const onlyMcp=compose({mcp:{path:mcpPath,config:enabledSnap().config}});
 assert.equal(onlyMcp.includes('wisp-compatible-plugin'),false);assert.ok(onlyMcp.includes('wisp-mcp-connection'));
});

test('Linux-supplemental: user strings never form YAML; npx, remote URL, extra inserts and mcp-connection-plugin are refused',()=>{
 const hostile={...memory,memory:{version:1,entries:[{id:'b688c6a5-c493-42ef-8714-33fc4da2c7a9',category:'fact',text:'x\n- insert:\n    - {"id":"tool-bash"}'}]}};
 const text=composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:hostile});
 assert.ok(text.includes(JSON.stringify(hostile)));
 assert.equal(/\n- insert:\n    - \{"id":"tool-bash"\}/.test(text),false);
 const noteSnap=snapshotFromConnection({version:1,catalogId:CONNECTION_CATALOG_ID,enabled:true,config:{serverName:'wispdemo',note:'looks_like_yaml',credentialId:''}});
 const withNote=compose({mcp:{path:mcpPath,config:noteSnap.config}});
 assert.ok(withNote.includes(JSON.stringify(overlayConnectionConfig(noteSnap.config))));
 assert.throws(()=>validateConnectionInsertConfig({...overlayConnectionConfig(noteSnap.config),command:'npx'}));
 assert.throws(()=>validateConnectionInsertConfig({...overlayConnectionConfig(noteSnap.config),url:'https://evil.example/mcp'}));
 assert.throws(()=>classifyInsert({id:'mcp-connection-plugin',name:mcpPath,inject:['tools','wispPermissions']}));
 assert.throws(()=>classifyInsert({id:MCP_INSERT_ID,name:'@deepseek-ai/dsh-mcp-client',inject:['tools','wispPermissions'],config:overlayConnectionConfig(noteSnap.config)}));
 const npm=JSON.parse(readFileSync(new URL('./fixtures/incompatible-plugin/npm-spec.json',import.meta.url),'utf8'));
 assert.throws(()=>classifyInsert(npm));
 assert.equal(isPackageSpec('@marketplace/plugin'),true);
 const bash=JSON.parse(readFileSync(new URL('./fixtures/incompatible-plugin/tool-bash-insert.json',import.meta.url),'utf8'));
 assert.throws(()=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,extraInserts:[bash]}));
 for(const id of ['tool-bash','tool-fs','tool-web']) assert.ok(DISABLED_STOCK_IDS.includes(id));
 const row=UNSUPPORTED_CATALOG.find(r=>r.id==='mcp-connection-plugin');
 assert.match(row.detail,/Settings → Connections/);
 assert.equal(row.detail.includes('until slice 11'),false);
});

test('Linux-supplemental: overlay YAML contains no sentinels when a secret is bound in adapter env',()=>{
 const sentinel='wisp-test-sentinel-A-not-for-diagnostics';
 const snap=enabledSnap();
 const overlay=compose({mcp:{path:mcpPath,config:snap.config,snapshot:snap}});
 assert.equal(overlay.includes(sentinel),false);
 assert.equal(overlay.includes('BEGIN'),false);
 const envA=resolveMcpAdapterEnv({credentialId:'credA',secret:sentinel,sentinel});
 const envB=resolveMcpAdapterEnv({credentialId:'credB',secret:''});
 assert.equal(envA.WISP_CONNECTION_SENTINEL,sentinel);
 assert.equal(envA.WISP_CONNECTION_VALUE,sentinel);
 assert.equal(envB.WISP_CONNECTION_SENTINEL,undefined);
 assert.equal(envB.WISP_CONNECTION_VALUE,undefined);
 assert.equal(JSON.stringify(envB).includes(sentinel),false);
});

test('Linux-supplemental: isolated secret store does not leak into overlay or connection B',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-conn-secret-'));
 try{
  const path=join(dir,'secrets.json');
  const sentinel='super-secret-connection-A';
  writeConnectionSecretStore(path,[{id:'credA',value:sentinel}]);
  assert.equal(readConnectionSecret(path,'credA'),sentinel);
  assert.equal(readConnectionSecret(path,'credB'),'');
  const overlay=compose({mcp:{path:mcpPath,config:{serverName:'wispdemo',note:'',credentialId:'credA'}}});
  assert.equal(overlay.includes(sentinel),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: permission-protocol accepts mcp__wispdemo__record / wisp-mcp without breaking 06/09 pairs',()=>{
 assert.deepEqual(validateRequest(mcpRequest()),mcpRequest());
 assert.throws(()=>validateRequest({...mcpRequest(),source:'wisp-direct'}));
 assert.throws(()=>validateRequest({...mcpRequest(),source:'wisp-safe-action'}));
 assert.throws(()=>validateRequest({...mcpRequest(),toolName:'mcp__other__delete'}));
 assert.throws(()=>validateRequest({...mcpRequest(),arguments:{label:'safe',extra:'x'}}));
 assert.deepEqual(validateRequest(fixtureRequest()),fixtureRequest());
 const url={...fixtureRequest(),toolName:'wisp_open_url',source:'wisp-safe-action',arguments:{url:'https://example.com/ok'},operation:'open-http-url',destination:'https://example.com/ok',fields:[{label:'URL',value:'https://example.com/ok'}]};
 assert.deepEqual(validateRequest(url),url);
 assert.throws(()=>validateRequest({...mcpRequest(),source:'wisp-compatible-plugin'}));
});

test('Linux-supplemental: wrap execute mutates the same ToolDefinition object',()=>{
 const tool={name:'mcp__wispdemo__record',execute:()=>'original'};
 const same=wrapMcpExecute(tool,()=>{});
 assert.equal(same,tool);
 assert.equal(tool.execute!==undefined,true);
});

test('Linux-supplemental: extra unadmitted MCP tool fails seal; same-object inventory remains required',()=>{
 const admitted={name:'mcp__wispdemo__record',execute:()=>{}};
 wrapMcpExecute(admitted,()=>{});
 const extra={name:'mcp__wispdemo__extra',execute:()=>{}};
 assert.throws(()=>sealMcpInventory({registered:[admitted,extra],admitted:[{tool:admitted}]}));
 assert.equal(mcpInventoryValid({registered:[admitted],admitted:[{tool:admitted}]}),true);
 const replaced={name:'mcp__wispdemo__record',execute:admitted.execute};
 assert.throws(()=>mcpInventoryValid({registered:[replaced],admitted:[{tool:admitted}]}));
});

test('Linux-supplemental: real local stdio fixture withhold/deny/cancel/allow-once is 0/0/0/1',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-mcp-stdio-'));
 const counts=[],rpc=[],lines=[];
 try{
  for(const decision of [null,'deny','cancel','allow-once']){
   const ledger=join(dir,'ledger-'+String(decision)+'.jsonl');
   const client=new McpStdioClient(process.execPath,[fixture,'--ledger',ledger]);
   try{
    await client.initialize();
    const listed=await client.listTools();
    assert.equal(listed.tools[0].name,'record');
    assert.equal(listed.tools.some(t=>t.name==='mcp__wispdemo__record'),false);
    const tool={name:'mcp__wispdemo__record',execute:(_args,_exec)=>client.callTool('record',{label:'once'})};
    wrapMcpExecute(tool,()=>{if(decision!=='allow-once')throw Error('WISP_NO_GRANT');});
    try{await tool.execute({label:'once'},{token:Symbol('grant')});}catch{/* withhold/deny/cancel */}
    counts.push(ledgerLines(ledger).length);
    rpc.push(rpcCount(ledger));
    lines.push(ledgerLines(ledger));
   }finally{await client.close();}
  }
  assert.deepEqual(counts,[0,0,0,1]);
  assert.deepEqual(rpc,[0,0,0,1]);
  assert.equal(JSON.parse(lines[3][0]).tool,'record');
  assert.equal(JSON.parse(lines[3][0]).label,'once');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: deny/cancel never increment tools/call; extra advertised tool is not called',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-mcp-deny-'));
 const ledger=join(dir,'ledger.jsonl');
 const client=new McpStdioClient(process.execPath,[fixture,'--ledger',ledger,'--extra-tool']);
 try{
  await client.initialize();
  const listed=await client.listTools();
  assert.equal(listed.tools.some(t=>t.name==='extra'),true);
  const record={name:'mcp__wispdemo__record',execute:()=>client.callTool('record',{label:'x'})};
  wrapMcpExecute(record,()=>{throw Error('WISP_NO_GRANT');});
  await assert.rejects(async()=>{await record.execute({label:'x'},{});},/WISP_NO_GRANT/);
  assert.equal(rpcCount(ledger),0);
  assert.equal(ledgerLines(ledger).length,0);
  const extra={name:'mcp__wispdemo__extra',execute:()=>client.callTool('extra',{})};
  assert.throws(()=>sealMcpInventory({registered:[record,extra],admitted:[{tool:record}]}));
 }finally{await client.close();rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: tools/change after seal yields zero further RPC',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-mcp-change-'));
 const ledger=join(dir,'ledger.jsonl');
 const client=new McpStdioClient(process.execPath,[fixture,'--ledger',ledger]);
 const state={invalid:false};
 try{
  await client.initialize();
  const tool={name:'mcp__wispdemo__record',execute:()=>client.callTool('record',{label:'once'})};
  wrapMcpExecute(tool,(exec)=>{if(state.invalid)throw Error('WISP_NO_GRANT');if(!exec||!exec.granted)throw Error('WISP_NO_GRANT');});
  await tool.execute({label:'once'},{granted:true});
  assert.equal(rpcCount(ledger),1);
  state.invalid=true;
  await assert.rejects(async()=>{await tool.execute({label:'two'},{granted:true});},/WISP_NO_GRANT/);
  assert.equal(rpcCount(ledger),1);
  assert.equal(ledgerLines(ledger).length,1);
 }finally{await client.close();rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: stock ids remain disabled; prepare-product copies MCP overlay sources',()=>{
 for(const id of ['tool-bash','tool-fs','tool-web','web-fetch-http']) assert.ok(DISABLED_STOCK_IDS.includes(id));
 const patch=readFileSync(new URL('../engine/product.patch.yml',import.meta.url),'utf8');
 assert.match(patch,/- id: tool-bash\n {2}disabled: true/);
 assert.match(patch,/- id: tool-fs\n {2}disabled: true/);
 assert.match(patch,/- id: tool-web\n {2}disabled: true/);
 assert.ok(productFiles.includes('mcp-connection.ts'));
 assert.ok(productFiles.includes('mcp-demo-fixture.mjs'));
 assert.ok(productFiles.includes('mcp-wrap.mjs'));
 assert.ok(productFiles.includes('connection-config.mjs'));
 assert.ok(productFiles.includes('mcp-verification.ts'));
});

test('Linux-supplemental: MCP inventory/ack events cannot enter TTS',()=>{
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
 mic.deliver(id,'final','Record this');
 voice.receive({event:'ready',utteranceId:id,generation:gen,companionId:companion,text:'inventory should not speak',connections:[{id:CONNECTION_CATALOG_ID}]});
 voice.receive({event:'wisp.inventory',utteranceId:id,generation:gen,companionId:companion,text:'mcp__wispdemo__record'});
 voice.approval(true);
 voice.receive({event:'voice-result',utteranceId:id,generation:gen,companionId:companion,text:'Should not speak during approval'});
 assert.deepEqual(speaker.spoken,[]);
});

test('Linux-supplemental: describeMcpRecord is strict and names the public tool',()=>{
 const action=describeMcpRecord({label:'ok_1'},'/owned/ledger',{publicName:'mcp__wispdemo__record',note:'lab'});
 assert.equal(action.operation,'append-test-record');
 assert.equal(action.destination,'/owned/ledger');
 assert.ok(action.fields.some(f=>f.label==='Public tool'&&f.value==='mcp__wispdemo__record'));
 assert.throws(()=>describeMcpRecord({label:'ok_1',extra:1},'/owned/ledger'));
 assert.equal(publicMcpToolName('wispdemo'),'mcp__wispdemo__record');
});

test('Linux-supplemental: connection snapshot file enforces ownership, links and bound',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wisp-conn-check-'));
 try{
  const path=join(dir,'launch.json');
  const snap=defaultConnectionSnapshot();
  writeFileSync(path,JSON.stringify(snap),{mode:0o600});
  assert.deepEqual(readConnectionSnapshot(path),snap);
  chmodSync(path,0o644);assert.throws(()=>readConnectionSnapshot(path));chmodSync(path,0o600);
  const linked=join(dir,'link.json');symlinkSync(path,linked);assert.throws(()=>readConnectionSnapshot(linked));
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Linux-supplemental: developer fixture insert remains available beside MCP',()=>{
 const both=compose({developerPath,mcp:{path:mcpPath,config:enabledSnap().config}});
 assert.ok(both.includes('wisp-local-permission-plugin'));assert.ok(both.includes('wisp-mcp-connection'));
});
