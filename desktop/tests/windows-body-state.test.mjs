import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {RASTER_SAMPLES} from '../engine/pet-config.mjs';
import {DISABLED_STOCK_IDS} from '../engine/plugin-overlay.mjs';
import {
  BodyState,BodyPhase,animationAllowed,assertWindowsProductChord,hotkeyRegisteredCopy,
  orbAlpha,orbRasterSamples,clampBody,trayMenuEnabled,BODY_DIP,WINDOWS_SHORTCUT_LABEL,
  WINDOWS_HOTKEY_MODIFIERS,WINDOWS_HOTKEY_VK,WINDOWS_SYSTEM_WINDOW_MENU_CHORD,
  WINDOWS_HOTKEY_MOD_CONTROL,WINDOWS_HOTKEY_MOD_ALT,TRAY_ACCESSIBLE_NAME,TRAY_MENU,
  TRAY_DISABLED,VOICE_UNAVAILABLE_LABEL,ENGINE_NOT_ATTACHED,HOTKEY_REGISTERED,
  HOTKEY_CONFLICT,ORB_CATALOG_ID,
} from '../engine/windows-body-state.mjs';

test('Linux-supplemental: BodyPhase matches accepted-02 idle listening speaking interrupt hide',()=>{
 const state=new BodyState();
 assert.equal(state.phase,BodyPhase.starting);
 state.ready();
 const token=state.generation;
 assert.equal(state.phase,BodyPhase.idle);
 assert.equal(state.present(BodyPhase.listening,token),true);
 assert.equal(state.phase,BodyPhase.listening);
 assert.equal(state.present(BodyPhase.speaking,token),true);
 assert.equal(state.phase,BodyPhase.speaking);
 state.interrupt();
 assert.equal(state.phase,BodyPhase.idle);
 assert.equal(state.present(BodyPhase.speaking,token),false);
 assert.equal(state.present(BodyPhase.speaking,state.generation),false);
 assert.equal(state.present(BodyPhase.listening,state.generation),true);
 state.interrupt();
 assert.equal(state.phase,BodyPhase.idle);
 assert.equal(animationAllowed({visible:true,reduceMotion:false}),true);
 assert.equal(animationAllowed({visible:true,reduceMotion:true}),false);
 assert.equal(animationAllowed({visible:false,reduceMotion:false}),false);
});

test('Linux-supplemental: stale speaking after interrupt cannot stick; stop is terminal',()=>{
 const state=new BodyState();
 state.ready();
 const token=state.generation;
 state.present(BodyPhase.listening,token);
 state.interrupt();
 assert.equal(state.present(BodyPhase.speaking,token),false);
 assert.equal(state.phase,BodyPhase.idle);
 state.unavailable();
 state.interrupt();
 assert.equal(state.phase,BodyPhase.unavailable);
 state.stop();
 state.ready();
 assert.equal(state.phase,BodyPhase.stopped);
});

test('Linux-supplemental: Windows product chord is Ctrl+Alt+W; Alt+Space is rejected',()=>{
 assert.equal(assertWindowsProductChord(WINDOWS_SHORTCUT_LABEL),WINDOWS_SHORTCUT_LABEL);
 assert.deepEqual([...WINDOWS_HOTKEY_MODIFIERS],['MOD_CONTROL','MOD_ALT']);
 assert.equal(WINDOWS_HOTKEY_VK,'W');
 assert.equal(WINDOWS_HOTKEY_MOD_CONTROL,0x0002);
 assert.equal(WINDOWS_HOTKEY_MOD_ALT,0x0001);
 assert.equal(WINDOWS_SYSTEM_WINDOW_MENU_CHORD,'Alt+Space');
 assert.throws(()=>assertWindowsProductChord('Alt+Space'));
 assert.throws(()=>assertWindowsProductChord('Option–Space'));
 assert.throws(()=>assertWindowsProductChord('Ctrl+W'));
 assert.equal(hotkeyRegisteredCopy(true),HOTKEY_REGISTERED);
 assert.equal(hotkeyRegisteredCopy(false),HOTKEY_CONFLICT);
});

test('Linux-supplemental: even-odd wisp-orb samples match RASTER_SAMPLES',()=>{
 assert.equal(BODY_DIP,160);
 assert.equal(ORB_CATALOG_ID,'wisp-orb');
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].corner,[0,0]);
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].gap,[80,98]);
 assert.deepEqual(RASTER_SAMPLES['wisp-orb'].uniqueOpaque,[40,80]);
 const sample=orbRasterSamples();
 assert.equal(sample.cornerAlpha,0);
 assert.equal(sample.gapAlpha,0);
 assert.ok(sample.uniqueOpaqueAlpha>0);
 assert.equal(orbAlpha(0,0),0);
 assert.equal(orbAlpha(159,0),0);
 assert.equal(orbAlpha(0,159),0);
 assert.equal(orbAlpha(159,159),0);
 assert.equal(orbAlpha(80,98),0);
 assert.equal(orbAlpha(40,80),255);
});

test('Linux-supplemental: clamp keeps negative virtual-screen coordinates',()=>{
 const negative={x:-1600,y:100,w:1600,h:900};
 const body={x:-1200,y:300,w:160,h:160};
 assert.deepEqual(clampBody(body,[negative]),body);
 const remaining={x:0,y:40,w:900,h:700};
 const recovered=clampBody(body,[remaining]);
 assert.equal(recovered.x>=remaining.x&&recovered.x+recovered.w<=remaining.x+remaining.w,true);
 assert.equal(recovered.y>=remaining.y&&recovered.y+recovered.h<=remaining.y+remaining.h,true);
 const top={x:0,y:1000,w:900,h:700};
 assert.equal(clampBody({x:500,y:1500,w:160,h:160},[remaining,top]).y,1500);
});

test('Linux-supplemental: tray names Show Companion and disables Wake Voice and Mute',()=>{
 assert.equal(TRAY_ACCESSIBLE_NAME,'Wisp');
 assert.deepEqual([...TRAY_MENU],[
  'Show Companion','Choose Wisp Folder…','Settings/General','Wake Voice','Mute','Quit Wisp',
 ]);
 assert.deepEqual([...TRAY_DISABLED],['Wake Voice','Mute']);
 assert.equal(trayMenuEnabled('Show Companion'),true);
 assert.equal(trayMenuEnabled('Quit Wisp'),true);
 assert.equal(trayMenuEnabled('Wake Voice'),false);
 assert.equal(trayMenuEnabled('Mute'),false);
 assert.equal(VOICE_UNAVAILABLE_LABEL,'Voice unavailable');
 assert.equal(ENGINE_NOT_ATTACHED,'engine not attached (Windows 17)');
});

test('Linux-supplemental: product Windows sources do not call forbidden input or UIA effect paths',()=>{
 assert.ok(DISABLED_STOCK_IDS.includes('tool-pwsh'));
 const windowsRoot=fileURLToPath(new URL('../windows',import.meta.url));
 const forbidden=[
  /\bSendInput\s*\(/,
  /\bmouse_event\s*\(/,
  /\bSetWindowsHookEx[AW]?\s*\(/,
  /\bWH_KEYBOARD_LL\b/,
  /\bIUIAutomation\b/,
  /\bwisp_uia_/,
  /\bWS_EX_TRANSPARENT\b/,
  /\bCreateProcess[AW]?\s*\(/,
  /\bopenNativePath\b/,
  /\btool-pwsh\b/,
 ];
 function strip(text){
  return text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 }
 let sawManifest=false;
 function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const path=join(dir,entry.name);
   if(entry.isDirectory()){walk(path);continue;}
   const text=readFileSync(path,'utf8');
   if(entry.name==='wisp.manifest'){
    sawManifest=true;
    assert.match(text,/dpiAware/);
    assert.match(text,/PerMonitorV2/);
    assert.match(text,/uiAccess="false"/);
    assert.equal(/uiAccess="true"/.test(text),false);
   }
   if(/\.(cpp|h|hpp)$/i.test(entry.name)){
    const code=strip(text);
    for(const pattern of forbidden){
     assert.equal(pattern.test(code),false,`${path} ${pattern}`);
    }
    assert.equal(code.includes('body-bridge'),false,path);
    assert.equal(/node\.exe/i.test(code),false,path);
   }
  }
 }
 walk(windowsRoot);
 assert.equal(sawManifest,true);
});
