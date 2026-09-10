import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {Client} from '../../spike/client.mjs';
import {environment,PIN} from '../../spike/prepare.mjs';
import {prepareProduct} from '../engine/prepare-product.mjs';
import {composeOverlay} from '../engine/plugin-overlay.mjs';
import {snapshotFromConfiguration,PLUGIN_CATALOG_ID} from '../engine/plugin-config.mjs';
import {snapshotFromConnection,connectionInventory,CONNECTION_CATALOG_ID,DEFAULT_SERVER_NAME} from '../engine/connection-config.mjs';
import {profileFor} from '../engine/reasoning-config.mjs';

const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]]));
if(!o['--runtime-root']||!o['--scratch']) { console.error('missing-external-resource: connection-overlay-runtime.mjs requires --runtime-root and --scratch'); process.exit(2); }
const scratch=resolve(o['--scratch']),runtime=resolve(o['--runtime-root']);
assert.ok(!existsSync(scratch));mkdirSync(scratch,{recursive:true,mode:0o700});
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));
assert.equal(meta.pin,PIN);
prepareProduct(runtime);
const up=join(runtime,'upstream'),product=fileURLToPath(new URL('../engine',import.meta.url));
const adapter=join(up,'wisp-product/engine/product-sdk.ts');
const memoryPath=join(product,'memory-context.mjs');
const mcpPath=join(up,'wisp-product/engine/mcp-connection.ts');
const memory={version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}};
const route=profileFor({version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''});
const results=[];
const pluginOff=snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:false,config:{note:''}});

function launch({enabled=false,note='',verify=false,extra=''}={}) {
  const home=join(scratch,'run-'+randomUUID());mkdirSync(home,{mode:0o700});
  for(const dir of ['workspace','dsh-home','tmp'])mkdirSync(join(home,dir),{mode:0o700});
  writeFileSync(join(home,'dsh-home/settings.yaml'),JSON.stringify({'llm-pi-ai':{providers:{[route.provider]:route.profile}}}),{mode:0o600});
  const snap=snapshotFromConnection({version:1,catalogId:CONNECTION_CATALOG_ID,enabled,config:{serverName:DEFAULT_SERVER_NAME,note,credentialId:''}});
  let patchText=composeOverlay({
    basePatch:readFileSync(join(product,'product.patch.yml'),'utf8'),
    adapterPath:adapter,memoryPath,memoryConfig:memory,
    mcp:enabled?{path:mcpPath,config:snap.config,snapshot:snap}:null,
  });
  if(extra)patchText+=extra;
  const patch=join(home,'wisp.patch.yml');writeFileSync(patch,patchText,{mode:0o600});
  const env={...environment(home,meta.pnpm),TSX_TSCONFIG_PATH:join(up,'tsconfig.json'),WISP_COMPANION_ID:memory.companionId,WISP_ENGINE_GENERATION:randomUUID(),WISP_PLUGIN_SNAPSHOT:JSON.stringify(pluginOff),WISP_CONNECTION_SNAPSHOT:JSON.stringify(snap),...(enabled?{WISP_MCP_LEDGER:join(home,'ledger.mcp.jsonl')}:{}),...(verify?{WISP_MCP_VERIFY:'1'}:{}),WISP_REASONING_LOCAL_KEY:'ollama'};
  const client=new Client(meta.node,['--import',meta.tsx,join(up,'apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch],{cwd:join(home,'workspace'),env});
  return {client,home,snap};
}

async function initialize(ctx) {
  await ctx.client.request('initialize',{cwd:join(ctx.home,'workspace'),provider:route.provider,model:route.model});
  const notified=ctx.client.frames.find(f=>f.method==='wisp.inventory')?.params;
  const inventory=connectionInventory({snapshot:ctx.snap,tools:notified.tools,transport:notified.transport});
  assert.deepEqual(notified.connections,inventory.connections);
  return {tools:notified.tools,connections:notified.connections};
}

try {
  const off=launch();
  try {
    const inventory=await initialize(off);
    assert.equal(inventory.tools.includes('mcp__wispdemo__record'),false);
    assert.ok(inventory.tools.includes('wisp_open_url'));
    assert.ok(inventory.tools.includes('wisp_open_file'));
    assert.ok(inventory.tools.includes('wisp_tell_time'));
    assert.ok(inventory.tools.includes('wisp_ax_focus_window'));
    assert.ok(inventory.tools.includes('wisp_ax_move_window'));
    assert.ok(inventory.tools.includes('wisp_ax_read_focused'));
    assert.ok(inventory.tools.includes('wisp_ax_click_named'));
    assert.ok(inventory.tools.includes('wisp_ax_type_named'));
    assert.ok(inventory.tools.includes('wisp_ax_find_named'));
    assert.equal(inventory.tools.includes('wisp_compatible_check'),false);
    assert.deepEqual(inventory.connections,[]);
    results.push({case:'default-excludes-mcp',ok:true,tools:inventory.tools});
    await off.client.shutdown();
  } finally { if(!off.client.exited)await off.client.force(); }

  const on=launch({enabled:true,note:'lab_1',verify:true});
  try {
    const inventory=await initialize(on);
    assert.ok(inventory.tools.includes('mcp__wispdemo__record'));
    assert.equal(inventory.connections[0].id,CONNECTION_CATALOG_ID);
    const mcpLedger=join(on.home,'ledger.mcp.jsonl');
    const records=()=>existsSync(mcpLedger)?readFileSync(mcpLedger,'utf8').trim().split('\n').filter(Boolean):[];
    const decide=(p,decision)=>Object.assign(Object.fromEntries(['version','generation','requestId','sessionId','callId','actionDigest'].map(k=>[k,p[k]])),{decision});
    const counts=[];
    for(const decision of [null,'deny','cancel','allow-once']) {
      const running=on.client.request('wisp/verification.mcp',{},120000);running.catch(()=>{});
      const p=await on.client.wait(fs=>{const r=fs.filter(f=>f.method==='wisp.approval.requested').at(-1);return r&&!r._used?r.params:null;});
      on.client.frames.filter(f=>f.method==='wisp.approval.requested').forEach(f=>{f._used=true;});
      const before=records().length;
      if(decision)await on.client.request('wisp/approval.decide',decide(p,decision));
      else {await on.client.request('wisp/approval.decide',decide(p,'cancel'));}
      await running.catch(()=>{});
      counts.push(records().length-before);
    }
    assert.deepEqual(counts.slice(1),[0,0,1]);
    assert.equal(counts[0],0);
    results.push({case:'enabled-inventory-and-registry',ok:true,connections:inventory.connections,effectCounts:counts,modelCalls0:true});
    await on.client.shutdown();
  } finally { if(!on.client.exited)await on.client.force(); }

  const disabled=launch({enabled:false});
  try {
    const inventory=await initialize(disabled);
    assert.equal(inventory.tools.includes('mcp__wispdemo__record'),false);
    results.push({case:'disable-removes-mcp',ok:true});
    await disabled.client.shutdown();
  } finally { if(!disabled.client.exited)await disabled.client.force(); }

  writeFileSync(join(scratch,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} catch(error) {
  console.error(error);
  process.exitCode=1;
}
