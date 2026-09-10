import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest,validateDecision} from '../engine/permission-protocol.mjs';
import {Lines} from '../engine/body-bridge.mjs';
const request=()=>({version:1,generation:'g',requestId:'r',sessionId:'s',callId:'c',actionDigest:'a'.repeat(64),companionId:'companion',turn:1,rootCallId:'c',toolName:'wisp_permission_check',source:'wisp-direct',revision:'1',arguments:{label:'safe'},operation:'append-test-record',destination:'/owned/ledger',fields:[{label:'Record',value:'safe'}]});
const decision=()=>Object.assign(Object.fromEntries(['version','generation','requestId','sessionId','callId','actionDigest'].map(k=>[k,request()[k]])),{decision:'deny'});
test('complete trusted request and exact decision pass owned frame decoding',()=>{assert.deepEqual(validateRequest(request()),request());assert.deepEqual(validateDecision(decision()),decision());assert.deepEqual(new Lines().push(Buffer.from(JSON.stringify({op:'approval',decision:decision()})+'\n')),[{op:'approval',decision:decision()}]);});
test('compatible plugin request is accepted only with the matching closed source',()=>{
 const compatible={...request(),toolName:'wisp_compatible_check',source:'wisp-compatible-plugin'};
 assert.deepEqual(validateRequest(compatible),compatible);
 assert.throws(()=>validateRequest({...compatible,source:'wisp-direct'}));
 assert.throws(()=>validateRequest({...request(),toolName:'wisp_compatible_check',source:'wisp-local-plugin'}));
});
test('skill request is accepted only with wisp-skill / load-skill-instructions / exact name; Direct time remains',()=>{
 const skill={...request(),toolName:'skill',source:'wisp-skill',arguments:{name:'wisp-local-time-briefing'},operation:'load-skill-instructions',destination:'wisp-local-time-briefing',fields:[{label:'Skill',value:'Local time briefing'}]};
 assert.deepEqual(validateRequest(skill),skill);
 assert.throws(()=>validateRequest({...skill,source:'wisp-direct'}));
 assert.throws(()=>validateRequest({...skill,source:'wisp-safe-action'}));
 assert.throws(()=>validateRequest({...skill,operation:'read-local-clock'}));
 assert.throws(()=>validateRequest({...skill,arguments:{name:'meeting-prep-bundle'}}));
 assert.throws(()=>validateRequest({...skill,arguments:{name:'wisp-local-time-briefing',extra:'x'}}));
 const time={...request(),toolName:'wisp_tell_time',source:'wisp-safe-action',arguments:{},operation:'read-local-clock',destination:'local-system-clock',fields:[{label:'Clock',value:'local'}]};
 assert.deepEqual(validateRequest(time),time);
});
for(const [key,value] of [['version',2],['extra','secret'],['source','model-claimed-safe'],['toolName','bash'],['rootCallId','different'],['operation','send'],['destination','x'.repeat(2049)],['destination','hidden\u202einput'],['arguments',{label:'safe',key:'secret'}],['fields',[{label:'x',value:'hidden\ninput'}]],['turn',0]])test(`unrenderable or untrusted request ${key} fails closed`,()=>assert.throws(()=>validateRequest({...request(),[key]:value})));
for(const [key,value] of [['version',2],['decision','allow-always'],['generation',''],['actionDigest','bad'],['extra','secret']])test(`invalid decision ${key} cannot cross bridge`,()=>assert.throws(()=>new Lines().push(Buffer.from(JSON.stringify({op:'approval',decision:{...decision(),[key]:value}})+'\n'))));
test('material fields cannot exceed complete rendered frame budget',()=>assert.throws(()=>validateRequest({...request(),fields:Array.from({length:12},()=>({label:'x',value:'x'.repeat(2048)}))})));
