// Execute with the prepared runtime's node --import tsx; no provider requests.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {join,resolve} from 'node:path';
import {profileFor,cloudModels} from '../engine/reasoning-config.mjs';
const root=resolve(process.argv[2]);
const {resolveProfiles}=await import(pathToFileURL(join(root,'packages/llm/llm-pi-ai/src/config.ts')));
const {catalogModels}=await import(pathToFileURL(join(root,'packages/llm/llm-pi-ai/src/catalog.ts')));
assert.deepEqual([...catalogModels('deepseek').keys()].sort(),[...cloudModels].sort());
for(const selected of ['local','deepseek']) {
 const route=profileFor({version:1,selected,localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:cloudModels[0],cloudKeyID:''});
 const profile=resolveProfiles({[route.provider]:route.profile}).get(route.provider);
 assert.equal(profile.apiKeyEnv,route.profile.apiKeyEnv);assert.equal(profile.retryPolicy.maxRetries,0);assert.equal(profile.configuredMaxTokens.get(route.model),1024);
}
console.log(JSON.stringify({actualInstalledCatalogMatches:true,actualProfilesResolve:true,explicitRequestCaps:1024,retries:0,networkRequests:0}));
