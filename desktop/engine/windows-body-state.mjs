// Linux-supplemental Windows body phase, geometry, shortcut, and orb samples. Not Win32 proof.

import {RASTER_SAMPLES} from './pet-config.mjs';

export const BODY_DIP=160;
export const WINDOWS_SHORTCUT_LABEL='Ctrl+Alt+W';
export const WINDOWS_HOTKEY_MODIFIERS=Object.freeze(['MOD_CONTROL','MOD_ALT']);
export const WINDOWS_HOTKEY_VK='W';
export const WINDOWS_HOTKEY_MOD_CONTROL=0x0002;
export const WINDOWS_HOTKEY_MOD_ALT=0x0001;
export const WINDOWS_SYSTEM_WINDOW_MENU_CHORD='Alt+Space';
export const TRAY_ACCESSIBLE_NAME='Wisp';
export const TRAY_MENU=Object.freeze([
 'Show Companion',
 'Choose Wisp Folder…',
 'Settings/General',
 'Wake Voice',
 'Mute',
 'Quit Wisp',
]);
export const TRAY_DISABLED=Object.freeze(['Wake Voice','Mute']);
export const VOICE_UNAVAILABLE_LABEL='Voice unavailable';
export const ENGINE_NOT_ATTACHED='engine not attached (Windows 17)';
export const HOTKEY_REGISTERED='Ctrl+Alt+W · registered';
export const HOTKEY_CONFLICT='Ctrl+Alt+W unavailable (conflict); use Show Companion';
export const ORB_CATALOG_ID='wisp-orb';
export const ORB_OUTER=Object.freeze({x:24,y:24,w:112,h:112});
export const ORB_INNER=Object.freeze({x:60,y:80,w:40,h:36});

export const BodyPhase=Object.freeze({
 starting:'starting',
 idle:'idle',
 listening:'listening',
 speaking:'speaking',
 processing:'processing',
 approval:'approval',
 muted:'muted',
 unavailable:'unavailable',
 stopped:'stopped',
});

export class BodyState {
 phase=BodyPhase.starting;
 generation=0;
 ready(){
  if(this.phase===BodyPhase.starting){this.phase=BodyPhase.idle;this.generation+=1;}
 }
 present(next,token){
  if(token!==this.generation)return false;
  if((this.phase===BodyPhase.idle&&next===BodyPhase.listening)||(this.phase===BodyPhase.listening&&next===BodyPhase.speaking)){
   this.phase=next;return true;
  }
  return false;
 }
 interrupt(){
  this.generation+=1;
  if(this.phase===BodyPhase.listening||this.phase===BodyPhase.speaking)this.phase=BodyPhase.idle;
 }
 unavailable(){
  this.generation+=1;
  if(this.phase!==BodyPhase.stopped)this.phase=BodyPhase.unavailable;
 }
 stop(){
  this.generation+=1;
  this.phase=BodyPhase.stopped;
 }
}

export function animationAllowed({visible,reduceMotion}={}){
 return visible===true&&reduceMotion!==true;
}

export function assertWindowsProductChord(label){
 if(label===WINDOWS_SYSTEM_WINDOW_MENU_CHORD)throw Error('WISP_SHORTCUT_ALT_SPACE');
 if(label!==WINDOWS_SHORTCUT_LABEL)throw Error('WISP_SHORTCUT');
 return WINDOWS_SHORTCUT_LABEL;
}

export function hotkeyRegisteredCopy(ok){
 return ok?HOTKEY_REGISTERED:HOTKEY_CONFLICT;
}

function insideEllipse(x,y,cx,cy,rx,ry){
 const dx=(x+0.5-cx)/rx;
 const dy=(y+0.5-cy)/ry;
 return dx*dx+dy*dy<=1;
}

export function orbAlpha(x,y){
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=BODY_DIP||y>=BODY_DIP)throw Error('WISP_ORB_SAMPLE');
 const outer=insideEllipse(x,y,80,80,56,56);
 const inner=insideEllipse(x,y,80,98,20,18);
 return outer&&!inner?255:0;
}

export function orbRasterSamples(){
 const sample=RASTER_SAMPLES[ORB_CATALOG_ID];
 return {
  corner:[...sample.corner],
  gap:[...sample.gap],
  uniqueOpaque:[...sample.uniqueOpaque],
  cornerAlpha:orbAlpha(...sample.corner),
  gapAlpha:orbAlpha(...sample.gap),
  uniqueOpaqueAlpha:orbAlpha(...sample.uniqueOpaque),
 };
}

export function clampBody(body,screens){
 if(!screens||screens.length===0)return {...body};
 const distance=(a,b)=>{
  const x=Math.max(b.x- (a.x+a.w/2),0,(a.x+a.w/2)-(b.x+b.w));
  const y=Math.max(b.y-(a.y+a.h/2),0,(a.y+a.h/2)-(b.y+b.h));
  return x*x+y*y;
 };
 let screen=screens[0];
 let best=distance(body,screen);
 for(const candidate of screens){
  const d=distance(body,candidate);
  if(d<best){best=d;screen=candidate;}
 }
 const x=Math.max(screen.x,Math.min(body.x,screen.x+screen.w-body.w));
 const y=Math.max(screen.y,Math.min(body.y,screen.y+screen.h-body.h));
 return {x,y,w:body.w,h:body.h};
}

export function trayMenuEnabled(title){
 return !TRAY_DISABLED.includes(title);
}
