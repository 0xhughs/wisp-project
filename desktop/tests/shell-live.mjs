// Interactive native proof runner. GUI actions must be performed through the real UI.
// stdin allowlist: status, smoke, recreate, hide, fault. Quit must use the Wisp menu.
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,appendFileSync,readFileSync,realpathSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createInterface} from 'node:readline';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);
assert.equal(args.length%2,0);
const o=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[2*i],args[2*i+1]]));
const scenario=o['--case']||'normal'; assert.ok(['normal','bridge-loss','engine-failure','missing-config','repeat'].includes(scenario));
const scratch=resolve(o['--scratch']); assert.ok(!existsSync(scratch),'fresh scratch required');
mkdirSync(scratch,{recursive:true,mode:0o700});writeFileSync(join(scratch,'.wisp-owned'),'shell-live\n',{mode:0o600});
const runtime=realpathSync(o['--runtime-root']); const meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));
const app=realpathSync(o['--app']);
assert.ok(o['--fixture-helper'],'--fixture-helper required');
const fixture=spawnSync(o['--fixture-helper'],['create',join(scratch,'support'),join(scratch,'wisp-home')],{encoding:'utf8'});assert.equal(fixture.status,0,fixture.stderr);
const argv=['--developer','true','--test-support',join(scratch,'support'),'--scratch',scratch];
if(scenario!=='missing-config')argv.push('--runtime-root',runtime,'--node',meta.node);
const frames=[];let tail='',ended=false,owned,fault=false;
const child=spawn(app,argv,{stdio:['pipe','pipe','pipe']});
writeFileSync(join(scratch,'native-pid'),String(child.pid));
const send=op=>{if(!ended)child.stdin.write(JSON.stringify({op})+'\n')};
child.stdout.on('data',bytes=>{
 tail+=bytes;const lines=tail.split('\n');tail=lines.pop();
 for(const line of lines){const f=JSON.parse(line);frames.push(f);appendFileSync(join(scratch,'events.jsonl'),line+'\n',{mode:0o600});if(f.event==='ready')owned=f;
 if(['ready','smoke','shell-status','section-selected','settings-opened','unavailable','native-stopped'].includes(f.event))console.log(JSON.stringify(f));}
});
child.stderr.on('data',b=>appendFileSync(join(scratch,'native.stderr'),b,{mode:0o600}));
const input=createInterface({input:process.stdin});input.on('line',line=>{
 if(['status','smoke','recreate','hide'].includes(line))send(line);
 else if(line==='fault'&&owned&&!fault&&['bridge-loss','engine-failure'].includes(scenario)) {fault=true;process.kill(scenario==='bridge-loss'?owned.bridgePID:owned.pid,'SIGKILL');}
});
const noProcess=pid=>{try{process.kill(pid,0);return false}catch(e){if(e.code!=='ESRCH')throw e;return true}};
const noGroup=pid=>!spawnSync('/bin/ps',['-axo','pgid='],{encoding:'utf8'}).stdout.split('\n').some(x=>Number(x.trim())===pid);
const timer=setInterval(()=>send('status'),2000);
console.log(JSON.stringify({event:'operator-ready',scenario,pid:child.pid,scratch,commands:['status','smoke','recreate','hide','fault'],instruction:'Use actual Wisp menu and Settings controls; quit via menu.'}));
child.on('exit',async(code,signal)=>{
 ended=true;clearInterval(timer);input.close();
 let cleanup=true;
 if(owned){for(let i=0;i<350&&!(noProcess(owned.pid)&&noGroup(owned.pid)&&noProcess(owned.bridgePID));i++)await delay(100);cleanup=noProcess(owned.pid)&&noGroup(owned.pid)&&noProcess(owned.bridgePID)}
 const shell=frames.filter(f=>f.event==='shell-status');
 const checks={exitZero:code===0,cleanup,noForcedStop:!frames.some(f=>f.event==='forced-bridge-stop'),bodyNeverKey:shell.every(f=>!f.bodyKey&&!f.bodyMain),oneStatus:shell.every(f=>f.statusItems===1),oneSettings:shell.every(f=>f.settingsAllocated<=1),voiceNeverReady:shell.every(f=>!f.voiceAvailable),settingsOpened:frames.some(f=>f.event==='settings-opened')};
 if(scenario==='normal') {
  const turns=frames.filter(f=>f.event==='smoke');const shown=shell.filter(f=>f.settingsAllocated===1);
  Object.assign(checks,{twoDistinctTurns:turns.length===2&&turns[0].turn!==turns[1].turn,sameIdentity:turns.length===2&&['controller','bridgePID','pid','sessionId'].every(k=>turns[0][k]===turns[1][k]),recreated:frames.some(f=>f.bodyGeneration>1),allSections:new Set(frames.filter(f=>f.event==='section-selected').map(f=>f.section)).size===11,sameWindow:shown.length>0&&new Set(shown.map(f=>f.settingsWindow)).size===1,closed:frames.some(f=>f.event==='settings-closed')});
 }
 if(['bridge-loss','engine-failure'].includes(scenario))Object.assign(checks,{faultInjected:fault,unavailable:frames.some(f=>f.event==='shell-status'&&f.lifecycle==='Unavailable'&&f.settingsVisible),noRestart:frames.filter(f=>f.event==='ready').length===1});
 if(scenario==='missing-config')checks.noEngine=!frames.some(f=>f.event==='ready');
 const result={scenario,checks,passed:Object.values(checks).every(Boolean),exit:{code,signal},resourceBefore:shell[0],resourceAfter:shell.at(-1)};
 writeFileSync(join(scratch,'result.json'),JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
});
