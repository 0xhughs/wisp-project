// Owned interactive runner: real chooser/editor/menu actions are external GUI checkpoints.
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,appendFileSync,readFileSync,existsSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);assert.equal(args.length%2,0);
const o=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[i*2],args[i*2+1]]));
const scratch=resolve(o['--scratch']);
if(!existsSync(scratch)){mkdirSync(scratch,{recursive:true,mode:0o700});writeFileSync(join(scratch,'.wisp-owned'),'memory-live\n',{mode:0o600});}
assert.ok(existsSync(join(scratch,'.wisp-owned')));
const runtime=realpathSync(o['--runtime-root']),meta=JSON.parse(readFileSync(join(runtime,'.wisp-spike.json')));
const run=join(scratch,'run-'+Date.now());mkdirSync(run,{mode:0o700});
const child=spawn(realpathSync(o['--app']),['--developer','true','--runtime-root',runtime,'--scratch',scratch,'--test-support',join(scratch,'support'),'--node',meta.node],{stdio:['pipe','pipe','pipe']});
writeFileSync(join(run,'native-pid'),String(child.pid));
let tail='',ended=false,owned;const frames=[];
child.stdout.on('data',bytes=>{tail+=bytes;const lines=tail.split('\n');tail=lines.pop();for(const line of lines){const f=JSON.parse(line);frames.push(f);appendFileSync(join(run,'private-events.jsonl'),line+'\n',{mode:0o600});if(f.event==='ready')owned=f;if(['memory-loaded','memory-error','ready','recall','smoke','native-stopped','unavailable','settings-opened','section-selected'].includes(f.event))console.log(JSON.stringify(f));}});
child.stderr.on('data',()=>{});
const send=op=>{if(!ended)child.stdin.write(JSON.stringify({op})+'\n')};
const input=createInterface({input:process.stdin});input.on('line',op=>{if(['status','smoke','recall','recreate','hide','show'].includes(op))send(op);});
const timer=setInterval(()=>send('status'),3000);
console.log(JSON.stringify({event:'operator-ready',pid:child.pid,run,scratch,commands:['status','smoke','recall','recreate','hide','show'],instruction:'Use real native chooser/editor and actual menu Quit. This runner never chooses a home.'}));
const absent=pid=>{try{process.kill(pid,0);return false}catch(e){if(e.code!=='ESRCH')throw e;return true}};
const groupGone=pid=>!spawnSync('/bin/ps',['-axo','pgid='],{encoding:'utf8'}).stdout.split('\n').some(x=>+x.trim()===pid);
child.on('exit',async(code,signal)=>{
 ended=true;clearInterval(timer);input.close();
 if(owned)for(let i=0;i<350&&!(absent(owned.pid)&&absent(owned.bridgePID)&&groupGone(owned.pid));i++)await delay(100);
 const summary={exit:{code,signal},cleanup:!owned||(absent(owned.pid)&&absent(owned.bridgePID)&&groupGone(owned.pid)),noForcedStop:!frames.some(f=>f.event==='forced-bridge-stop'),homeLoaded:frames.some(f=>f.event==='memory-loaded'&&f.companionId),runtimeReady:!!owned,recalls:frames.filter(f=>f.event==='recall').length,run};
 writeFileSync(join(run,'result.json'),JSON.stringify(summary,null,2),{mode:0o600});console.log(JSON.stringify(summary));process.exitCode=summary.cleanup?0:1;
});
