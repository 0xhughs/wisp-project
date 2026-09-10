// Linux-supplemental. Does not prove macOS Settings GUI, live Quit, NativeChecks, or live OTLP silence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {environment} from '../../spike/prepare.mjs';
import {composeOverlay,classifyInsert,DISABLED_STOCK_IDS} from '../engine/plugin-overlay.mjs';
import {
  SNAPSHOT_KEYS,sample,validateSnapshot,renderDiagnostics,copyDiagnostics,telemetryFacts,docsOmitShipInstructions,
  TELEMETRY_COPY,DIAGNOSTICS_REFRESH_FORBIDDEN,DIAGNOSTICS_REFRESH_ALLOWED,
} from '../engine/diagnostics-snapshot.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const basePatch=readFileSync(new URL('../engine/product.patch.yml',import.meta.url),'utf8');
const companionId='a688c6a5-c493-42ef-8714-33fc4da2c7a9';
const pluginPath='/opt/wisp/plugins/compatible-plugin.ts';
const adapter='/prepared/upstream/wisp-product/engine/product-sdk.ts';
const memoryPath='/app/desktop/engine/memory-context.mjs';
const demoPath='/prepared/upstream/wisp-product/engine/compatible-plugin.ts';
const memory={version:1,companionId,revision:'a'.repeat(64),memory:{version:1,entries:[]}};
const compose=(extra={})=>composeOverlay({basePatch,adapterPath:adapter,memoryPath,memoryConfig:memory,...extra});

function assertOmits(text){
 for(const s of ['sk-live','BEGIN CERTIFICATE','memory.json','/Users/wisp',companionId,pluginPath,'the rain in spain']){
  assert.equal(text.includes(s),false,`rendered Diagnostics leaked ${s}`);
 }
 assert.equal(/feedback-only.{0,80}(is on|is active|sharing is on)/i.test(text),false);
}

test('Linux-supplemental: closed allowed-key snapshot round-trips; extra keys rejected',()=>{
 const snap=sample();
 assert.deepEqual(Object.keys(snap).sort(),[...SNAPSHOT_KEYS].sort());
 assert.deepEqual(validateSnapshot(snap),snap);
 assert.equal(snap.homeConfigured,false);
 assert.equal(snap.telemetryDisabled,true);
 assert.equal(snap.accountRequired,false);
 assert.equal(snap.lastStop,'none');
 assert.throws(()=>validateSnapshot({...snap,extra:'x'}));
 assert.throws(()=>validateSnapshot({...snap,homePath:'/Users/wisp'}));
 assert.throws(()=>validateSnapshot({...snap,companionId}));
 assert.throws(()=>validateSnapshot({...snap,recognizedText:'the rain in spain'}));
 assert.throws(()=>validateSnapshot({...snap,pendingReply:'hi'}));
 assert.throws(()=>validateSnapshot({...snap,voiceStatus:'fail'}));
 assert.throws(()=>validateSnapshot({...snap,pluginPath}));
 assert.throws(()=>validateSnapshot({...snap,version:2}));
 assert.throws(()=>validateSnapshot({...snap,engineLifecycle:'Attached'}));
 assert.throws(()=>validateSnapshot({...snap,telemetryDisabled:false}));
 assert.throws(()=>validateSnapshot({...snap,accountRequired:true}));
});

test('Linux-supplemental: sentinels cannot appear in rendered Diagnostics text',()=>{
 const hostile=sample({
  recoveryCopy:`see notes sk-live BEGIN CERTIFICATE memory.json /Users/wisp ${companionId} ${pluginPath}`,
  hardwareText:`CPU available. ignore sk-live BEGIN CERTIFICATE memory.json /Users/wisp ${companionId} ${pluginPath}`,
  modelsDisclosure:'Local Ollama: recognized text stays on this Mac.',
 });
 const text=renderDiagnostics(hostile);
 assertOmits(text);
 assert.match(text,/Home configured: no/);
 assert.equal(text.includes('/Users/'),false);
 assert.equal(text.includes('Wisp folder'),false);
 assert.equal(copyDiagnostics(hostile),text);
 assert.match(text,/telemetry is disabled/i);
 assert.equal(text.includes('the rain in spain'),false);
});

test('Linux-supplemental: homeConfigured is a boolean without a path',()=>{
 const yes=renderDiagnostics(sample({homeConfigured:true,recoveryCopy:'Home is configured. If the engine is Unavailable, Quit Wisp and reopen. Do not start a second Wisp. A forced bridge stop is not a clean pass.'}));
 assert.match(yes,/Home configured: yes/);
 assert.equal(yes.includes('/Users/'),false);
 assert.equal(yes.includes('/home/'),false);
 const no=renderDiagnostics(sample({homeConfigured:false}));
 assert.match(no,/Home configured: no/);
 assert.match(no,/Last stop: none/);
});

test('Linux-supplemental: telemetry copy says disabled and does not say feedback-only is active',()=>{
 const env=environment('/tmp/wisp-14-diagnostics-policy','/usr/bin/pnpm');
 assert.equal(typeof env.DSH_TELEMETRY_DISABLED,'string');
 assert.ok(env.DSH_TELEMETRY_DISABLED.length>0);
 assert.equal(Object.prototype.hasOwnProperty.call(env,'DSH_TELEMETRY_MODE'),false);
 assert.equal(Object.prototype.hasOwnProperty.call(env,'DSH_TELEMETRY_OTLP_URL'),false);
 const facts=telemetryFacts({patchText:basePatch,env});
 assert.equal(facts.disabled,true);
 assert.equal(facts.overlayDisabled,true);
 assert.equal(facts.commandFeedbackDisabled,true);
 assert.equal(facts.envDisabled,true);
 assert.equal(facts.setsFull,false);
 assert.equal(facts.setsOtlp,false);
 assert.equal(facts.copy,TELEMETRY_COPY);
 assert.match(facts.copy,/telemetry is disabled/i);
 assert.equal(/feedback-only/i.test(facts.copy),false);
 const text=renderDiagnostics(sample({telemetryCopy:facts.copy}));
 assert.match(text,/Telemetry: Session telemetry is disabled/);
 assertOmits(text);
});

test('Linux-supplemental: overlay disables session-telemetry-otel; classifyInsert refuses it; command-feedback stays disabled',()=>{
 assert.match(basePatch,/- id: session-telemetry-otel\n  disabled: true/);
 assert.match(basePatch,/- id: command-feedback\n  disabled: true/);
 assert.ok(DISABLED_STOCK_IDS.includes('session-telemetry-otel'));
 assert.ok(DISABLED_STOCK_IDS.includes('command-feedback'));
 assert.throws(()=>classifyInsert({id:'session-telemetry-otel',name:'/opt/x/session-telemetry-otel.ts',inject:['session']}));
 const off=compose();
 assert.match(off,/- id: session-telemetry-otel\n  disabled: true/);
 assert.match(off,/- id: command-feedback\n  disabled: true/);
 const on=compose({compatible:{path:demoPath,config:{note:''}}});
 assert.match(on,/- id: session-telemetry-otel\n  disabled: true/);
 assert.equal(on.includes('disabled: false')&&on.includes('session-telemetry-otel')&&/- id: session-telemetry-otel\n  disabled: false/.test(on),false);
});

test('Linux-supplemental: macos-readiness.md omits notarize/Developer ID/App Store/Sparkle as ship instructions',()=>{
 const docs=readFileSync(join(root,'docs/macos-readiness.md'),'utf8');
 const hits=docsOmitShipInstructions(docs);
 assert.deepEqual(hits,[],'ship-instruction language in macos-readiness.md');
 assert.match(docs,/local/i);
 assert.match(docs,/Quit Wisp/);
});

test('Linux-supplemental: Diagnostics Refresh remains 08 inspect; sources do not concatenate voice.status',()=>{
 for(const name of DIAGNOSTICS_REFRESH_FORBIDDEN) assert.equal(DIAGNOSTICS_REFRESH_ALLOWED.includes(name),false);
 const onboarding=readFileSync(join(root,'desktop/macos/Sources/WispBody/OnboardingState.swift'),'utf8');
 assert.match(onboarding,/session\/prompt/);
 assert.match(onboarding,/wakeVoice/);
 assert.match(onboarding,/static let operations = \["hardware-collect","GET \/api\/version","GET \/api\/tags"\]/);
 const companion=readFileSync(join(root,'desktop/macos/Sources/WispBody/CompanionController.swift'),'utf8');
 assert.equal(companion.includes('if management.section == .diagnostics{return voiceDescription'),false);
 assert.match(companion,/diagnosticsText|DiagnosticsSnapshot/);
 const view=readFileSync(join(root,'desktop/macos/Sources/WispBody/DiagnosticsView.swift'),'utf8');
 assert.match(view,/Refresh/);
 assert.match(view,/Copy/);
 assert.equal(view.includes('session/prompt'),false);
 assert.equal(view.includes('wakeVoice'),false);
 const mgmt=readFileSync(join(root,'desktop/macos/Sources/WispBody/ManagementState.swift'),'utf8');
 const diag=mgmt.match(/case \.diagnostics: return "[\s\S]*?"/)[0];
 assert.equal(diag.includes('remain disconnected'),false);
 assert.equal(diag.includes('Voice: unavailable'),false);
 assert.equal(/unimplemented/i.test(diag),false);
 assert.match(diag,/never include credentials/);
});
