import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DISABLED_STOCK_IDS} from '../engine/plugin-overlay.mjs';
import {expectedInventoryNames,DIRECT_AX_NAMES,DIRECT_SAFE_ACTION_NAMES} from '../engine/ax-actions.mjs';
import {
  parseMarker,parsePointer,encodeMarker,encodePointer,validateWindowsPath,
  reuseOrMintCompanionId,mintHomeFiles,planFolderChoice,validateTestSupport,
  assertPointerSeparation,bindPointerToMarker,HOME_README,MARKER_LEAF,OWNED_MARK,
} from '../engine/windows-home.mjs';

const existing='a688c6a5-c493-42ef-8714-33fc4da2c7a9';
const injected='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const homePath='C:\\Users\\fixture\\WispHome';
const supportPath='C:\\Users\\fixture\\AppData\\Local\\Wisp';
const scratchPath='C:\\Users\\fixture\\wisp-scratch';

test('Linux-supplemental: marker is version and companionId only',()=>{
 assert.deepEqual(parseMarker({version:1,companionId:existing}),{version:1,companionId:existing});
 assert.deepEqual(parseMarker(JSON.stringify({companionId:existing.toUpperCase(),version:1})),{version:1,companionId:existing});
 assert.deepEqual(encodeMarker(existing),{version:1,companionId:existing});
});

test('Linux-supplemental: marker extra keys, bookmark, relative types fail closed',()=>{
 assert.throws(()=>parseMarker({version:1,companionId:existing,extra:true}));
 assert.throws(()=>parseMarker({version:1,companionId:existing,bookmark:'AAAA'}));
 assert.throws(()=>parseMarker({companionId:existing,bookmark:'AAAA'}));
 assert.throws(()=>parseMarker({version:true,companionId:existing}));
 assert.throws(()=>parseMarker({version:'1',companionId:existing}));
 assert.throws(()=>parseMarker({version:2,companionId:existing}));
 assert.throws(()=>parseMarker({version:1,companionId:'not-a-uuid'}));
 assert.throws(()=>parseMarker({version:1}));
 assert.throws(()=>parseMarker({companionId:existing}));
});

test('Linux-supplemental: pointer is version, companionId, and absolute path only',()=>{
 const pointer=encodePointer(existing,homePath);
 assert.deepEqual(pointer,{version:1,companionId:existing,path:homePath});
 assert.deepEqual(parsePointer(pointer),pointer);
 assert.deepEqual(parsePointer(JSON.stringify({path:homePath,version:1,companionId:existing})),pointer);
 assert.equal(validateWindowsPath('\\\\server\\share\\WispHome'),'\\\\server\\share\\WispHome');
});

test('Linux-supplemental: pointer rejects relative, parent, bookmark, ADS, and extra keys',()=>{
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'WispHome'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'relative\\home'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'C:\\Users\\fixture\\..\\WispHome'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'C:\\Users\\fixture\\WispHome:stream'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'C:\\Users\\fixture\\WispHome',bookmark:'AAAA'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:homePath,extra:1}));
 assert.throws(()=>parsePointer({companionId:existing,bookmark:'AAAA'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'C:\\'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'/tmp/wisp'}));
 assert.throws(()=>parsePointer({version:1,companionId:existing,path:'\\\\?\\C:\\Users\\fixture\\WispHome'}));
});

test('Linux-supplemental: existing wisp-home.json UUID wins; mint only when marker absent',()=>{
 assert.equal(reuseOrMintCompanionId({marker:{version:1,companionId:existing},injectedId:injected}),existing);
 assert.equal(reuseOrMintCompanionId({marker:JSON.stringify({version:1,companionId:existing}),injectedId:injected}),existing);
 assert.equal(reuseOrMintCompanionId({injectedId:injected}),injected);
 assert.throws(()=>reuseOrMintCompanionId({}));
 const reuse=planFolderChoice({existingMarker:{version:1,companionId:existing},injectedId:injected,selectedPath:homePath,supportPath,scratchPath});
 assert.equal(reuse.action,'reuse');
 assert.equal(reuse.companionId,existing);
 assert.equal(reuse.writeMarker,false);
 assert.deepEqual(reuse.pointer,{version:1,companionId:existing,path:homePath});
 const minted=planFolderChoice({injectedId:injected,selectedPath:homePath,supportPath,scratchPath});
 assert.equal(minted.action,'mint');
 assert.equal(minted.companionId,injected);
 assert.equal(minted.writeMarker,true);
 assert.deepEqual(minted.files[MARKER_LEAF],{version:1,companionId:injected});
 assert.deepEqual(minted.files['memory.json'],{version:1,entries:[]});
 assert.equal(minted.files['README.txt'],HOME_README);
 assert.equal(planFolderChoice({cancelled:true,injectedId:injected,selectedPath:homePath,supportPath}).action,'noop');
});

test('Linux-supplemental: pointer must match marker UUID; homes cannot nest in support or scratch',()=>{
 assert.deepEqual(bindPointerToMarker(encodePointer(existing,homePath),encodeMarker(existing)),{companionId:existing,path:homePath});
 assert.throws(()=>bindPointerToMarker(encodePointer(existing,homePath),encodeMarker(injected)));
 assert.throws(()=>assertPointerSeparation(supportPath+'\\nested',supportPath,scratchPath));
 assert.throws(()=>assertPointerSeparation(scratchPath+'\\home',supportPath,scratchPath));
 assert.doesNotThrow(()=>assertPointerSeparation(homePath,supportPath,scratchPath));
 assert.deepEqual(validateTestSupport({scratch:scratchPath,testSupport:scratchPath+'\\support',listing:['.wisp-owned']}),{scratch:scratchPath,testSupport:scratchPath+'\\support'});
 assert.throws(()=>validateTestSupport({scratch:scratchPath,testSupport:scratchPath+'\\nested\\support',listing:[OWNED_MARK]}));
 assert.throws(()=>validateTestSupport({scratch:scratchPath,testSupport:scratchPath+'\\support',listing:[]}));
});

test('Linux-supplemental: overlay still lists tool-pwsh; inventory/admission files have no wisp_uia_ names',()=>{
 assert.ok(DISABLED_STOCK_IDS.includes('tool-pwsh'));
 assert.ok(DISABLED_STOCK_IDS.includes('tool-bash'));
 const names=expectedInventoryNames();
 for(const name of DIRECT_SAFE_ACTION_NAMES)assert.ok(names.includes(name));
 for(const name of DIRECT_AX_NAMES)assert.ok(names.includes(name));
 assert.ok(names.includes('wisp_visual_click_drawn'));
 assert.equal(names.some(name=>String(name).includes('wisp_uia_')),false);
 const engine=fileURLToPath(new URL('../engine',import.meta.url));
 const admission=[
  'plugin-overlay.mjs','plugin-config.mjs','product.patch.yml','permission-protocol.mjs',
  'body-bridge.mjs','ax-actions.mjs','ax-action-tools.ts','safe-actions.mjs','skill-config.mjs',
  'connection-config.mjs','product-sdk.ts','local-permission-plugin.ts',
 ];
 for(const name of admission){
  const text=readFileSync(join(engine,name),'utf8');
  assert.equal(text.includes('wisp_uia_'),false,name);
 }
 const windowsRoot=fileURLToPath(new URL('../windows',import.meta.url));
 function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const path=join(dir,entry.name);
   if(entry.isDirectory())walk(path);
   else if(/\.(cpp|h|hpp|manifest|cmake|txt|ps1|sh)$/i.test(entry.name)){
    const text=readFileSync(path,'utf8');
    assert.equal(text.includes('wisp_uia_'),false,path);
   }
  }
 }
 walk(windowsRoot);
});
