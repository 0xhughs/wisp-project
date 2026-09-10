import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConfiguration,profileFor,bootstrap} from '../engine/reasoning-config.mjs';
const config={version:1,selected:'local',localModel:'qwen3:8b',localEndpoint:'http://127.0.0.1:11434/v1',cloudModel:'deepseek-v4-flash',cloudKeyID:''};
test('route schemas reject external local targets, invalid identifiers and unknown fields',()=>{
 for(const patch of [{version:true},{localModel:'qwen3:8b\n'},{localEndpoint:'http://127.0.0.1:11434/v1\n'},{localEndpoint:'https://evil.example/v1'},{localEndpoint:'http://localhost:0/v1'},{localModel:'../../secret'},{cloudModel:'invented'},{cloudKeyID:'../other'},{extra:'x'}]) assert.throws(()=>validateConfiguration({...config,...patch}));
 assert.deepEqual(validateConfiguration(config),config);
});
test('local route preserves tested qwen caps and compatibility, never reads cloud key',()=>{
 const route=profileFor(config);assert.equal(route.provider,'wisp-ollama');assert.equal(route.profile.apiKeyEnv,'WISP_REASONING_LOCAL_KEY');assert.equal(route.profile.models[0].maxTokens,1024);assert.equal(route.profile.retryPolicy.maxRetries,0);
 assert.throws(()=>bootstrap({op:'configure',configuration:config,key:'not-local'}));
});
test('cloud requires explicit bounded key and uses fixed pinned endpoint/model',()=>{
 const c={...config,selected:'deepseek',cloudKeyID:'4b4d8b13-ae57-4911-a748-dbbf4981ee64'};
 assert.throws(()=>bootstrap({op:'configure',configuration:c}));
 assert.throws(()=>bootstrap({op:'configure',configuration:c,key:'x\nAuthorization: bad'}));
 const b=bootstrap({op:'configure',configuration:c,key:'test-sentinel'});assert.equal(b.key,'test-sentinel');
 const r=profileFor(c);assert.equal(r.provider,'deepseek');assert.equal(r.profile.baseURL,'https://api.deepseek.com');assert.equal(r.profile.models[0].id,c.cloudModel);
 assert.ok(!JSON.stringify(r).includes('test-sentinel'));
});
