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
import {snapshotFromConnection,CONNECTION_CATALOG_ID,DEFAULT_SERVER_NAME} from '../engine/connection-config.mjs';
import {snapshotFromSkill,skillInventory,SKILL_CATALOG_ID} from '../engine/skill-config.mjs';
import {profileFor} from '../engine/reasoning-config.mjs';

const o=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]]));
if(!o['--runtime-root']||!o['--scratch']) { console.error('missing-external-resource: skill-overlay-runtime.mjs requires --runtime-root and --scratch'); process.exit(2); }
const scratch=resolve(o['--scratch']),runtime=resolve(o['--runtime-root']);
assert.ok(!existsSync(scratch));mkdirSync(scratch,{recursive:true,mode:0o700});
const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));
assert.equal(meta.pin,PIN);
prepareProduct(runtime);
const up=join(runtime,'upstream'),product=fileURLToPath(new URL('../engine',import.meta.url));
const adapter=join(up,'wisp-product/engine/product-sdk.ts');
const memoryPath=join(product,'memory-context.mjs');
const skillPath=join(up,'wisp-product/engine/skill-register.ts');
const memory={version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory:{version:1,entries:[]}};
const route=profileFor({version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''});
const results=[];
const pluginOff=snapshotFromConfiguration({version:1,catalogId:PLUGIN_CATALOG_ID,enabled:false,config:{note:''}});
const connectionOff=snapshotFromConnection({version:1,catalogId:CONNECTION_CATALOG_ID,enabled:false,config:{serverName:DEFAULT_SERVER_NAME,note:'',credentialId:''}});

function launch({enabled=false,extra=''}={}) {
  const home=join(scratch,'run-'+randomUUID());mkdirSync(home,{mode:0o700});
  for(const dir of ['workspace','dsh-home','tmp'])mkdirSync(join(home,dir),{mode:0o700});
  writeFileSync(join(home,'dsh-home/settings.yaml'),JSON.stringify({'llm-pi-ai':{providers:{[route.provider]:route.profile}}}),{mode:0o600});
  const snap=snapshotFromSkill({version:1,catalogId:SKILL_CATALOG_ID,enabled});
  let patchText=composeOverlay({
    basePatch:readFileSync(join(product,'product.patch.yml'),'utf8'),
    adapterPath:adapter,memoryPath,memoryConfig:memory,
    skill:enabled?{path:skillPath,snapshot:snap}:null,
  });
  if(extra)patchText+=extra;
  const patch=join(home,'wisp.patch.yml');writeFileSync(patch,patchText,{mode:0o600});
  const env={...environment(home,meta.pnpm),TSX_TSCONFIG_PATH:join(up,'tsconfig.json'),WISP_COMPANION_ID:memory.companionId,WISP_ENGINE_GENERATION:randomUUID(),WISP_PLUGIN_SNAPSHOT:JSON.stringify(pluginOff),WISP_CONNECTION_SNAPSHOT:JSON.stringify(connectionOff),WISP_SKILL_SNAPSHOT:JSON.stringify(snap),WISP_REASONING_LOCAL_KEY:'ollama'};
  const client=new Client(meta.node,['--import',meta.tsx,join(up,'apps/cli/src/bin.ts'),'--profile','sdk','--patch',patch],{cwd:join(home,'workspace'),env});
  return {client,home,snap};
}

async function initialize(ctx) {
  await ctx.client.request('initialize',{cwd:join(ctx.home,'workspace'),provider:route.provider,model:route.model});
  const notified=ctx.client.frames.find(f=>f.method==='wisp.inventory')?.params;
  const inventory=skillInventory({snapshot:ctx.snap,tools:notified.tools,transport:notified.transport});
  assert.deepEqual(notified.skills,inventory.skills);
  return {tools:notified.tools,skills:inventory.skills,plugins:notified.plugins||[],connections:notified.connections||[]};
}

try {
  const off=launch();
  try {
    const inventory=await initialize(off);
    assert.equal(inventory.tools.includes('skill'),false);
    assert.ok(inventory.tools.includes('wisp_open_url'));
    assert.ok(inventory.tools.includes('wisp_open_file'));
    assert.ok(inventory.tools.includes('wisp_tell_time'));
    assert.equal(inventory.tools.includes('wisp_compatible_check'),false);
    assert.equal(inventory.tools.some(t=>String(t).startsWith('mcp__')),false);
    assert.deepEqual(inventory.skills,[]);
    results.push({case:'default-excludes-skill',ok:true,tools:inventory.tools});
    await off.client.shutdown();
  } finally { if(!off.client.exited)await off.client.force(); }

  const on=launch({enabled:true});
  try {
    const inventory=await initialize(on);
    assert.ok(inventory.tools.includes('skill'));
    assert.ok(inventory.tools.includes('wisp_tell_time'));
    assert.equal(inventory.skills[0].id,SKILL_CATALOG_ID);
    assert.deepEqual(inventory.skills[0].tools,['skill']);
    assert.equal(inventory.tools.includes('wisp_compatible_check'),false);
    assert.equal(inventory.tools.some(t=>String(t).startsWith('mcp__')),false);
    results.push({case:'enabled-includes-skill-and-direct',ok:true,skills:inventory.skills});
    await on.client.shutdown();
  } finally { if(!on.client.exited)await on.client.force(); }

  const disabled=launch({enabled:false});
  try {
    const inventory=await initialize(disabled);
    assert.equal(inventory.tools.includes('skill'),false);
    results.push({case:'disable-removes-skill',ok:true});
    await disabled.client.shutdown();
  } finally { if(!disabled.client.exited)await disabled.client.force(); }

  const hostilePath=fileURLToPath(new URL('./fixtures/incompatible-plugin/unadmitted-plugin.ts',import.meta.url));
  const hostile=launch({extra:'\n- insert:\n    - '+JSON.stringify({id:'unadmitted-hostile',name:hostilePath,inject:['tools']})+'\n'});
  try {
    await assert.rejects(initialize(hostile));
    results.push({case:'hostile-unadmitted-fails-initialize',ok:true});
  } finally { if(!hostile.client.exited)await hostile.client.force(); }

  writeFileSync(join(scratch,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} catch(error) {
  console.error(error);
  process.exitCode=1;
}
