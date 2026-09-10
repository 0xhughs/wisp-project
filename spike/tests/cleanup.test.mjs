import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, symlinkSync, existsSync, rmSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cleanup, processIdentity } from '../cleanup.mjs';
import { PIN } from '../prepare.mjs';
const allowed=resolve(new URL('../',import.meta.url).pathname,'../../../work/wisp-01');
function fixture() {
 mkdirSync(allowed,{recursive:true});const root=mkdtempSync(join(allowed,'cleanup-proof-'));
 for(const path of ['tmp','proof','upstream'])mkdirSync(join(root,path));
 const tempAlias='/tmp/wisp01-'+randomUUID();symlinkSync(join(root,'tmp'),tempAlias);
 writeFileSync(join(root,'.wisp-spike.json'),JSON.stringify({root,pin:PIN,tempAlias}));
 return {root,tempAlias,dispose(){if(existsSync(tempAlias))unlinkSync(tempAlias);rmSync(root,{recursive:true,force:true});}};
}
test('cleanup refuses roots, ancestors, symlink escapes and mismatched markers',async()=>{
 const f=fixture(),link=f.root+'-link';try{
  await assert.rejects(cleanup('/'));await assert.rejects(cleanup(allowed));
  symlinkSync(f.root,link);await assert.rejects(cleanup(link));
  writeFileSync(join(f.root,'.wisp-spike.json'),JSON.stringify({root:f.root,pin:'wrong',tempAlias:f.tempAlias}));
  await assert.rejects(cleanup(f.root));assert.ok(existsSync(f.root));
 }finally{if(existsSync(link))unlinkSync(link);f.dispose();}
});
test('cleanup refuses changed process ownership without signaling it',async()=>{
 const f=fixture();try{
  writeFileSync(join(f.root,'proof/owned-process.json'),JSON.stringify({pid:process.pid,identity:'not-current'}));
  await assert.rejects(cleanup(f.root),/OWNERSHIP_CHANGED/);assert.ok(existsSync(f.root));
 }finally{f.dispose();}
});
test('cleanup joins owned process group and deletes only marked root and alias',async()=>{
 const f=fixture(),file=join(f.root,'upstream/cleanup-child.mjs');writeFileSync(file,'setInterval(()=>{},1000);');
 const child=spawn(process.execPath,[file],{detached:true,stdio:'ignore'});const exit=once(child,'exit');
 try{
  await once(child,'spawn');writeFileSync(join(f.root,'proof/owned-process.json'),JSON.stringify({pid:child.pid,identity:processIdentity(child.pid)}));
  assert.deepEqual(await cleanup(f.root),{removed:true,ownedAliasUnlinked:true,noOrphan:true});await exit;
  assert.ok(!existsSync(f.root));assert.ok(!existsSync(f.tempAlias));assert.equal(processIdentity(child.pid),null);
 }finally{try{process.kill(-child.pid,'SIGKILL');}catch{}f.dispose();}
});
