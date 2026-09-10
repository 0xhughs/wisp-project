import { readFileSync, realpathSync, lstatSync, rmSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { args, PIN } from './prepare.mjs';
export function processIdentity(pid) {
 const r=spawnSync('/bin/ps',['-p',String(pid),'-o','lstart=,pgid=,command='],{encoding:'utf8'});
 return r.status===0?r.stdout.trim():null;
}
export async function cleanup(input) {
 const root=resolve(input),allowed=resolve(dirname(fileURLToPath(import.meta.url)),'../../../work/wisp-01');
 if(!root.startsWith(allowed+'/')||realpathSync(root)!==root||lstatSync(root).isSymbolicLink())throw new Error('WISP_INVALID_CLEANUP_ROOT');
 const m=JSON.parse(readFileSync(join(root,'.wisp-spike.json')));
 if(m.root!==root||m.pin!==PIN||!/^\/tmp\/wisp01-[a-z0-9-]+$/.test(m.tempAlias)||!lstatSync(m.tempAlias).isSymbolicLink()||realpathSync(m.tempAlias)!==join(root,'tmp'))throw new Error('WISP_INVALID_CLEANUP_MARKER');
 const ownerFile=join(root,'proof','owned-process.json');
 if(existsSync(ownerFile)) {
  const owner=JSON.parse(readFileSync(ownerFile));const current=processIdentity(owner.pid);
  if(current) {
   if(current!==owner.identity||!current.includes(join(root,'upstream'))||!Number.isSafeInteger(owner.pid)||owner.pid<=1)throw new Error('WISP_PROCESS_OWNERSHIP_CHANGED');
   process.kill(-owner.pid,'SIGTERM');
   for(let i=0;i<50&&processIdentity(owner.pid);i++)await delay(100);
   if(processIdentity(owner.pid))process.kill(-owner.pid,'SIGKILL');
   for(let i=0;i<50&&processIdentity(owner.pid);i++)await delay(100);
   if(processIdentity(owner.pid))throw new Error('WISP_CLEANUP_PROCESS_ALIVE');
  }
  const groups=spawnSync('/bin/ps',['-axo','pgid='],{encoding:'utf8'});
  if(groups.status!==0||groups.stdout.split('\n').some(x=>Number(x.trim())===owner.pid))throw new Error('WISP_CLEANUP_GROUP_ALIVE');
 }
 unlinkSync(m.tempAlias);rmSync(root,{recursive:true});return {removed:true,ownedAliasUnlinked:true,noOrphan:true};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await cleanup(args().root)));
