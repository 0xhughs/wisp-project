// Closed Diagnostics snapshot: labeled nonsecret facts only.
// No credentials, keys, home path, companion UUID, memory.json, recognized text,
// overlay YAML, plugin paths, or raw engine stderr. Telemetry stays disabled.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

export const DIAGNOSTICS_VERSION=1;
export const DIAGNOSTICS_MAX_BYTES=16384;
export const ENGINE_LIFECYCLES=Object.freeze(['Starting','Ready','Unavailable','Stopping']);
export const VOICE_PHASES=Object.freeze(['idle','listening','finalizing','processing','approval','speaking','releasing','muted','unavailable']);
export const LAST_STOPS=Object.freeze(['none','clean','forced']);
export const TCC=Object.freeze(['trusted','untrusted','unavailable']);
export const MODELS_SELECTED=Object.freeze(['local','deepseek','none']);
export const SNAPSHOT_KEYS=Object.freeze([
 'version','engineLifecycle','voicePhase','voiceMuted','voiceLocale','shortcutRegistered','shortcutCopy','speechPermission',
 'modelsSelected','modelsDisclosure','hardwareText','pluginsMounted','pluginsDemonstration','connectionsMounted','connectionsDemonstration',
 'skillsMounted','skillsDemonstration','bodyCatalogId','bodyTitle','accessibilityTcc','telemetryDisabled','telemetryCopy',
 'homeConfigured','lastStop','accountRequired','recoveryCopy',
]);
export const TELEMETRY_COPY='Session telemetry is disabled. Overlay row session-telemetry-otel is disabled. Spawn sets DSH_TELEMETRY_DISABLED.';
export const SENTINELS=Object.freeze(['sk-live','BEGIN CERTIFICATE','memory.json','/Users/wisp']);
export const DIAGNOSTICS_REFRESH_ALLOWED=Object.freeze(['hardware-collect','GET /api/version','GET /api/tags']);
export const DIAGNOSTICS_REFRESH_FORBIDDEN=Object.freeze(['session/prompt','wakeVoice','api/pull','testModelConnection']);

const UUID_RE=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const SK_RE=/sk-[A-Za-z0-9_-]*/g;
const BEGIN_RE=/BEGIN(?: [A-Z]+)*/g;
const MEMORY_RE=/memory\.json/g;
const USERS_RE=/\/Users\/[^\s]*/g;
const ABS_PATH_RE=/(?:^|[\s])(\/(?:opt|home|var|private|Library|Applications|usr|tmp)\/[^\s]+)/g;

export const keys=(o,n)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join()===n.slice().sort().join();
function fail(code='DIAGNOSTICS_INVALID'){throw Error(code);}
function bounded(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>DIAGNOSTICS_MAX_BYTES)fail();
 return text;
}

export function redact(text){
 if(typeof text!=='string')fail();
 return text
  .replace(SK_RE,'[omitted]')
  .replace(BEGIN_RE,'[omitted]')
  .replace(MEMORY_RE,'[omitted]')
  .replace(USERS_RE,'[omitted]')
  .replace(UUID_RE,'[omitted]')
  .replace(ABS_PATH_RE,(full,p)=>full.replace(p,'[omitted]'));
}

function cleanString(v, {allowEmpty=false}={}){
 if(typeof v!=='string')fail();
 const out=redact(v);
 if(!allowEmpty&&!out.trim())fail();
 if(out.length>4096)fail();
 return out;
}
function nat(v){
 if(!Number.isInteger(v)||v<0||v>99)fail();
 return v;
}
function oneOf(v,allowed){
 if(typeof v!=='string'||!allowed.includes(v))fail();
 return v;
}

export function defaultRecovery(homeConfigured,lastStop){
 if(typeof homeConfigured!=='boolean'||!LAST_STOPS.includes(lastStop))fail();
 const home=homeConfigured?'Home is configured.':'Home is not configured. Settings and Quit still work.';
 return `${home} If the engine is Unavailable, Quit Wisp and reopen. Do not start a second Wisp. A forced bridge stop is not a clean pass.`;
}

export function sample(patch={}){
 const base={
  version:DIAGNOSTICS_VERSION,
  engineLifecycle:'Ready',
  voicePhase:'idle',
  voiceMuted:false,
  voiceLocale:'en-US',
  shortcutRegistered:true,
  shortcutCopy:'Option–Space · registered',
  speechPermission:'Microphone: not requested; speech recognition: not requested.',
  modelsSelected:'local',
  modelsDisclosure:'Local Ollama: recognized text stays on this Mac.',
  hardwareText:'Hardware (nonsecret): CPU unavailable (not collected). Speech headroom: qualitative.',
  pluginsMounted:0,
  pluginsDemonstration:'not installed',
  connectionsMounted:0,
  connectionsDemonstration:'not installed',
  skillsMounted:0,
  skillsDemonstration:'not installed',
  bodyCatalogId:'wisp-orb',
  bodyTitle:'Wisp orb',
  accessibilityTcc:'unavailable',
  telemetryDisabled:true,
  telemetryCopy:TELEMETRY_COPY,
  homeConfigured:false,
  lastStop:'none',
  accountRequired:false,
  recoveryCopy:defaultRecovery(false,'none'),
 };
 return validateSnapshot({...base,...patch});
}

export function validateSnapshot(raw){
 if(!keys(raw,SNAPSHOT_KEYS))fail();
 if(raw.version!==DIAGNOSTICS_VERSION)fail();
 if(typeof raw.voiceMuted!=='boolean'||typeof raw.shortcutRegistered!=='boolean'||typeof raw.homeConfigured!=='boolean')fail();
 if(raw.telemetryDisabled!==true)fail();
 if(raw.accountRequired!==false)fail();
 const telemetryCopy=cleanString(raw.telemetryCopy);
 if(!/telemetry is disabled/i.test(telemetryCopy))fail();
 if(/feedback-only.{0,80}(is on|is active|sharing is on)/i.test(telemetryCopy))fail();
 const snap={
  version:DIAGNOSTICS_VERSION,
  engineLifecycle:oneOf(raw.engineLifecycle,ENGINE_LIFECYCLES),
  voicePhase:oneOf(raw.voicePhase,VOICE_PHASES),
  voiceMuted:raw.voiceMuted,
  voiceLocale:cleanString(raw.voiceLocale),
  shortcutRegistered:raw.shortcutRegistered,
  shortcutCopy:cleanString(raw.shortcutCopy),
  speechPermission:cleanString(raw.speechPermission),
  modelsSelected:oneOf(raw.modelsSelected,MODELS_SELECTED),
  modelsDisclosure:cleanString(raw.modelsDisclosure),
  hardwareText:cleanString(raw.hardwareText),
  pluginsMounted:nat(raw.pluginsMounted),
  pluginsDemonstration:cleanString(raw.pluginsDemonstration),
  connectionsMounted:nat(raw.connectionsMounted),
  connectionsDemonstration:cleanString(raw.connectionsDemonstration),
  skillsMounted:nat(raw.skillsMounted),
  skillsDemonstration:cleanString(raw.skillsDemonstration),
  bodyCatalogId:cleanString(raw.bodyCatalogId),
  bodyTitle:cleanString(raw.bodyTitle),
  accessibilityTcc:oneOf(redact(raw.accessibilityTcc),TCC),
  telemetryDisabled:true,
  telemetryCopy,
  homeConfigured:raw.homeConfigured,
  lastStop:oneOf(raw.lastStop,LAST_STOPS),
  accountRequired:false,
  recoveryCopy:cleanString(raw.recoveryCopy),
 };
 if(/\/Users\//.test(snap.recoveryCopy)||snap.homeConfigured!==raw.homeConfigured)fail();
 return snap;
}

export function renderDiagnostics(raw){
 const snap=validateSnapshot(raw);
 const text=[
  `Engine lifecycle: ${snap.engineLifecycle}`,
  `Voice phase: ${snap.voicePhase}`,
  `Mute: ${snap.voiceMuted?'yes':'no'}`,
  `Locale: ${snap.voiceLocale}`,
  `Shortcut: ${snap.shortcutCopy}`,
  `Microphone and speech permission: ${snap.speechPermission}`,
  `Models route: ${snap.modelsSelected}`,
  `Models: ${snap.modelsDisclosure}`,
  `Hardware: ${snap.hardwareText}`,
  `Plugins mounted: ${snap.pluginsMounted}`,
  `Plugins demonstration: ${snap.pluginsDemonstration}`,
  `Connections mounted: ${snap.connectionsMounted}`,
  `Connections demonstration: ${snap.connectionsDemonstration}`,
  `Skills mounted: ${snap.skillsMounted}`,
  `Skills demonstration: ${snap.skillsDemonstration}`,
  `Body: ${snap.bodyCatalogId} (${snap.bodyTitle})`,
  `Accessibility TCC: ${snap.accessibilityTcc}`,
  `Telemetry: ${snap.telemetryCopy}`,
  `Home configured: ${snap.homeConfigured?'yes':'no'}`,
  `Last stop: ${snap.lastStop}`,
  'Account: no required cloud account',
  `Recovery: ${snap.recoveryCopy}`,
 ].join('\n');
 const out=redact(text);
 if(/feedback-only.{0,80}(is on|is active|sharing is on)/i.test(out))fail();
 if(out.includes('/Users/')||out.includes('memory.json')||out.includes('sk-live')||out.includes('BEGIN CERTIFICATE'))fail();
 return bounded(out);
}

export function copyDiagnostics(raw){
 return renderDiagnostics(raw);
}

export function telemetryFacts({patchText,env}={}){
 const patch=typeof patchText==='string'?patchText:readFileSync(new URL('./product.patch.yml',import.meta.url),'utf8');
 const overlayDisabled=/- id: session-telemetry-otel\s*\n\s*disabled:\s*true/.test(patch);
 const commandFeedbackDisabled=/- id: command-feedback\s*\n\s*disabled:\s*true/.test(patch);
 const envDisabled=typeof env?.DSH_TELEMETRY_DISABLED==='string'&&env.DSH_TELEMETRY_DISABLED.length>0;
 const setsFull=env!=null&&Object.prototype.hasOwnProperty.call(env,'DSH_TELEMETRY_MODE');
 const setsOtlp=env!=null&&Object.prototype.hasOwnProperty.call(env,'DSH_TELEMETRY_OTLP_URL');
 const disabled=overlayDisabled&&envDisabled&&!setsFull&&!setsOtlp;
 return {
  disabled,
  overlayDisabled,
  commandFeedbackDisabled,
  envDisabled,
  setsFull,
  setsOtlp,
  copy:disabled?TELEMETRY_COPY:'Session telemetry policy could not be verified from overlay and environment.',
 };
}

export function docsOmitShipInstructions(text){
 if(typeof text!=='string')fail();
 const terms=['notarize','Developer ID','App Store','Sparkle'];
 const sentences=text.split(/(?<=[.!?\n])/);
 const hits=[];
 for(const term of terms){
  const re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  for(const sentence of sentences){
   if(!re.test(sentence))continue;
   if(/\bout of\b|\bnever\b|\bdo not\b|\bdoes not\b|\bis not\b|\bare not\b|\bwithout\b|\brefus|\bnot\b/i.test(sentence))continue;
   hits.push({term,sentence:sentence.trim()});
  }
 }
 return hits;
}

export function productPatchPath(){
 return join(dirname(fileURLToPath(import.meta.url)),'product.patch.yml');
}
