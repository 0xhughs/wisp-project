// Product-owned safe subset of pinned Harness pi-ai profiles. No secret in this data.
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const keys=(o,n)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join()===n.sort().join();
export const cloudModels=['deepseek-v4-flash','deepseek-v4-pro']; // pi-ai0.84.2 providers/data/deepseek.json
export function validateConfiguration(c) {
 if(!keys(c,['version','selected','localModel','localEndpoint','cloudModel','cloudKeyID'])||c.version!==1||!['local','deepseek'].includes(c.selected)||!cloudModels.includes(c.cloudModel)||typeof c.localModel!=='string'||/[^\x20-\x7e]/.test(c.localModel)||!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(c.localModel)||c.localModel.includes('..')||typeof c.localEndpoint!=='string'||/[^\x20-\x7e]/.test(c.localEndpoint)||!/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):[0-9]{1,5}\/v1$/.test(c.localEndpoint)||typeof c.cloudKeyID!=='string'||c.cloudKeyID!==''&&!uuid.test(c.cloudKeyID))throw Error('MODELS_INVALID');
 const port=Number(c.localEndpoint.match(/:([0-9]+)\/v1$/)[1]);if(port<1||port>65535)throw Error('MODELS_INVALID');
 return structuredClone(c);
}
export function bootstrap(frame) {
 const c=validateConfiguration(frame?.configuration);
 if(c.selected==='local') {if(!keys(frame,['op','configuration'])||frame.op!=='configure')throw Error('MODELS_INVALID');return {configuration:c};}
 if(!keys(frame,['op','configuration','key'])||frame.op!=='configure'||!c.cloudKeyID||typeof frame.key!=='string'||!frame.key||Buffer.byteLength(frame.key)>4096||/[\x00-\x1f\x7f]/.test(frame.key))throw Error('MODELS_MISSING_KEY');
 return {configuration:c,key:frame.key};
}
export function profileFor(value) {
 const c=validateConfiguration(value),local=c.selected==='local';
 const profile={apiKeyEnv:local?'WISP_REASONING_LOCAL_KEY':'WISP_REASONING_CLOUD_KEY',baseURL:local?c.localEndpoint:'https://api.deepseek.com',retryPolicy:{mode:'normal',maxRetries:0},models:[{id:local?c.localModel:c.cloudModel,maxTokens:1024}]};
 if(local) Object.assign(profile,{api:'openai-completions',reasoning:'off',compat:{maxTokensField:'max_tokens',supportsStore:false,supportsDeveloperRole:false,supportsStrictMode:false,supportsReasoningEffort:true,supportsUsageInStreaming:true,thinkingFormat:'openai'},models:[{id:c.localModel,contextWindow:8192,maxTokens:1024,input:['text'],reasoningEfforts:{off:'none',high:'high'}}]});
 return {provider:local?'wisp-ollama':'deepseek',model:local?c.localModel:c.cloudModel,profile};
}
