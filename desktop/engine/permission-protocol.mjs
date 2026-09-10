const fields=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join()===keys.sort().join();
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
export function validateDecision(value) {
 if(!fields(value,['version','generation','requestId','sessionId','callId','actionDigest','decision'])||value.version!==1||!['generation','requestId','sessionId','callId'].every(k=>id(value[k]))||!/^[a-f0-9]{64}$/.test(value.actionDigest)||!['allow-once','deny','cancel'].includes(value.decision))throw Error('PERMISSION_DECISION');
 return value;
}
export function validateRequest(value) {
 const keys=['version','generation','requestId','sessionId','callId','actionDigest','companionId','turn','rootCallId','toolName','source','revision','arguments','operation','destination','fields'];
 const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(v);
 const sources={wisp_permission_check:'wisp-direct',wisp_plugin_check:'wisp-local-plugin',wisp_compatible_check:'wisp-compatible-plugin'};
 if(!fields(value,keys)||value.version!==1||!['generation','requestId','sessionId','callId','rootCallId','companionId'].every(k=>id(value[k]))||value.rootCallId!==value.callId||!Number.isSafeInteger(value.turn)||value.turn<1||!/^[a-f0-9]{64}$/.test(value.actionDigest)||!sources[value.toolName]||value.source!==sources[value.toolName]||value.revision!=='1'||value.operation!=='append-test-record'||!fields(value.arguments,['label'])||!/^[A-Za-z0-9_-]{1,40}$/.test(value.arguments.label)||!text(value.destination,2048)||!Array.isArray(value.fields)||value.fields.length>12||!value.fields.every(f=>fields(f,['label','value'])&&text(f.label,80)&&text(f.value,2048))||Buffer.byteLength(JSON.stringify(value))>12000)throw Error('PERMISSION_REQUEST');
 return value;
}
