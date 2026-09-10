const fields=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join()===keys.sort().join();
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
export function validateDecision(value) {
 if(!fields(value,['version','generation','requestId','sessionId','callId','actionDigest','decision'])||value.version!==1||!['generation','requestId','sessionId','callId'].every(k=>id(value[k]))||!/^[a-f0-9]{64}$/.test(value.actionDigest)||!['allow-once','deny','cancel'].includes(value.decision))throw Error('PERMISSION_DECISION');
 return value;
}
export function validateRequest(value) {
 const keys=['version','generation','requestId','sessionId','callId','actionDigest','companionId','turn','rootCallId','toolName','source','revision','arguments','operation','destination','fields'];
 const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(v);
 const fixtures={wisp_permission_check:'wisp-direct',wisp_plugin_check:'wisp-local-plugin',wisp_compatible_check:'wisp-compatible-plugin'};
 const actions={wisp_open_url:{source:'wisp-safe-action',operation:'open-http-url',args:['url']},wisp_open_file:{source:'wisp-safe-action',operation:'open-local-file-for-viewing',args:['path']},wisp_tell_time:{source:'wisp-safe-action',operation:'read-local-clock',args:[]}};
 const mcpRecord=/^mcp__[A-Za-z0-9_-]{1,32}__record$/;
 if(!fields(value,keys)||value.version!==1||!['generation','requestId','sessionId','callId','rootCallId','companionId'].every(k=>id(value[k]))||value.rootCallId!==value.callId||!Number.isSafeInteger(value.turn)||value.turn<1||!/^[a-f0-9]{64}$/.test(value.actionDigest)||value.revision!=='1'||!text(value.destination,2048)||!Array.isArray(value.fields)||value.fields.length>12||!value.fields.every(f=>fields(f,['label','value'])&&text(f.label,80)&&text(f.value,2048))||Buffer.byteLength(JSON.stringify(value))>12000)throw Error('PERMISSION_REQUEST');
 if(fixtures[value.toolName]) {
  if(value.source!==fixtures[value.toolName]||value.operation!=='append-test-record'||!fields(value.arguments,['label'])||!/^[A-Za-z0-9_-]{1,40}$/.test(value.arguments.label))throw Error('PERMISSION_REQUEST');
 } else if(mcpRecord.test(value.toolName)) {
  if(value.source!=='wisp-mcp'||value.operation!=='append-test-record'||!fields(value.arguments,['label'])||!/^[A-Za-z0-9_-]{1,40}$/.test(value.arguments.label))throw Error('PERMISSION_REQUEST');
 } else if(value.toolName==='skill') {
  if(value.source!=='wisp-skill'||value.operation!=='load-skill-instructions'||!fields(value.arguments,['name'])||value.arguments.name!=='wisp-local-time-briefing')throw Error('PERMISSION_REQUEST');
 } else if(actions[value.toolName]) {
  const a=actions[value.toolName];
  if(value.source!==a.source||value.operation!==a.operation||!fields(value.arguments,a.args))throw Error('PERMISSION_REQUEST');
  if(value.toolName==='wisp_open_url'&&(typeof value.arguments.url!=='string'||!text(value.arguments.url,2048)))throw Error('PERMISSION_REQUEST');
  if(value.toolName==='wisp_open_file'&&(typeof value.arguments.path!=='string'||!text(value.arguments.path,2048)))throw Error('PERMISSION_REQUEST');
  if(value.toolName==='wisp_tell_time'&&value.destination!=='local-system-clock')throw Error('PERMISSION_REQUEST');
 } else throw Error('PERMISSION_REQUEST');
 return value;
}
