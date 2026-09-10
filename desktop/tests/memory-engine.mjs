// Run with the verified runtime's node --import <tsx>; this uses the real pinned service.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {apply} from '../engine/memory-context.mjs';
const root=resolve(process.argv[2]);
const {Context}=await import(pathToFileURL(join(root,'vendor/cordis/lib/index.js')));
const {default:SystemPrompt,renderPrompt}=await import(pathToFileURL(join(root,'packages/core/system-prompt/src/index.ts')));
const ctx=new Context();
try {
 await ctx.plugin(SystemPrompt,{includeHarnessIdentity:false,includeRuntimeContext:false,persona:'Wisp owns this deployment.'});
 const memory={version:1,entries:[{id:'b688c6a5-c493-42ef-8714-33fc4da2c7a9',category:'fact',text:'Literal {{unknown}} and 🦊\nمرحبا'}]};
 apply(ctx,{version:1,companionId:'a688c6a5-c493-42ef-8714-33fc4da2c7a9',revision:'a'.repeat(64),memory});
 const assembly=await ctx.systemPrompt.assemble();const rendered=renderPrompt(assembly);
 assert.ok(rendered.includes(JSON.stringify(memory)));assert.deepEqual(assembly.contexts,[]);assert.deepEqual(assembly.tools,[]);
 assert.ok(rendered.startsWith('Wisp owns this deployment.'));assert.equal(assembly.sections.filter(s=>s.name==='wisp:memory').length,1);
 console.log(JSON.stringify({actualPinnedSystemPrompt:true,literalVariableValuePreserved:true,contextsSuppressed:true,noTools:true}));
}finally{await ctx.root.fiber.dispose();}
