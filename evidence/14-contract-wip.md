# NOT ACCEPTED — unaccepted slice 14 working contract

This file is **not** an accepted-slice archive. Slice 14 is **not Shipped**.
Do not treat this path as `slices/14-macos-integrated-readiness.md`.

Parked 2026-09-10 after independent **14-review-105 IMPLEMENTATION_READY** (reviewer `bc-a32f54f2-1180-57c4-b28b-2918ec2c7d36`). Remaining Mac/human gaps are backlog only. Historical **07-review-060** remains **HUMAN_REQUIRED**. Linux 14-build-104 seams are implemented with verification pending. Project **not** Complete.

Approved slice-14 contract: `ff534143eee6468b1d56cd535ff80514ca926762892c3109b4a01cd1d40817c4`.
Implementation candidate: `f3e0fbabedbcd80d2ccc0dd48142d90e80ce40e5721ebbcd39348cc17a65e76a` (301 files).
Verbatim reviews: `$HOME/wisp-work/loop-state/14-review-105.md`, `$HOME/wisp-work/loop-state/14-plan-103.md`.

The body below is BUILD Slice through Tests at park time.

---

# BUILD — active contract

Slice: 14 macOS integrated readiness
Archive: (none; not shipped)

## Goal

Verify a coherent local-first macOS product across slices 01–13 by delivering one closed **Local-first macOS readiness pack**, without claiming that this Linux host passed the live macOS first-release gates.

Wisp remains one persistent desktop AI companion. Voice is the primary interaction. Settings and Diagnostics are management surfaces, not a chatbot, transcript, or Harness UI. DeepSeek Harness at pin `d347e703908d0406b7a7ef80e3a0e594d86b2215` stays the invisible runtime. Credentials stay out of Diagnostics and ordinary memory files.

**Chosen demonstration (closed; this is the contract choice).** Make Settings → Diagnostics a structured, Wisp-owned, nonsecret snapshot of engine lifecycle, voice phase (not a transcript), Models route without keys, 08 hardware/Ollama inspect, plugin/connection/skill mounted counts, current body catalog id, categorical Accessibility TCC, telemetry isolation, home-configured yes/no without path or companion UUID, and qualitative speech headroom. Document launch, Quit, recovery, no required Wisp account, and reproducible **local** macOS install/run. Linux tests lock overlay/env telemetry isolation and snapshot redaction. Native Swift may be authored here and remains **uncompiled/unverified**.

Parked 07–13 are implemented with verification pending, **not Shipped**. Do not assume voice, onboarding, safe actions, plugins, Connections, skills, or starter pets work. This slice **records 07–13 retest**. Independent release-gate success for 01–14 is not a Linux pass of this increment.

**Honest remainder (not this contract):** **14.x-macos-e2e** — declared-Mac NativeChecks compile; Settings Diagnostics GUI and keyboard; live launch/menu Quit/no-orphan; ordinary desktop usability with another app focused; live local-only network observation that Wisp does not contact the pin’s default OTLP collector during a local-only session; spoken 07–13 retest; release-gate Reviewer sign-off after 07–13 and 14 are independently accepted. Missing Mac evidence does not authorize inventing numeric performance targets or marking 07–19 Shipped.

This slice is inside the selected macOS first-release acceptance target (01–14). Gate 10: starter pet switching is in-scope as 13 retest; approximately twenty skins, wake-word, advanced computer control, Windows, and remote channels are **not** 14 gates. Parked 19 wave-1 catalog is outside 01–14.

## Done when

1. **Working Diagnostics management surface; not a conversation.** Settings → Diagnostics is a dedicated Wisp-owned management section (a `DiagnosticsView` or equivalent structured pane, not only the wrapping `detail` label and not a chat composer). It is reachable from the existing eleven-section navigation in the same retained Settings window. Keyboard traversal covers the Diagnostics controls (Refresh; optional Copy of the **same** on-screen redacted text). Selecting Diagnostics still may refresh the 08 hardware/Ollama inspect (existing `refreshOnboarding` on section select); an explicit Refresh repeats that inspect only. Refresh never starts the microphone, never sends `session/prompt`, never pulls a model, never opens Harness UI, and never uploads.

   The pane shows labeled **nonsecret** facts, including at least:

   - Engine lifecycle among Starting / Ready / Unavailable / Stopping (existing `ManagementLifecycle`). Ready means the hidden engine is attached; it does **not** mean voice is capturing.
   - Voice **phase** (`VoicePhase`: idle, listening, finalizing, processing, approval, speaking, releasing, muted, unavailable), mute yes/no, locale, shortcut registered vs conflict copy, categorical microphone/speech permission. Do **not** show recognized words, assistant replies, `pendingReply`, bootstrap frames, or raw provider errors.
   - Models route: selected local vs optional DeepSeek **without** keys, endpoints that are not loopback-safe to echo if they could leak, or Keychain ids. Local-only remains possible; no Wisp account is required.
   - 08 hardware snapshot and Ollama inspect via `OnboardingDiagnostics` (CPU, memory kind, GPU/VRAM or unavailable reasons, disk bytes, installed names/sizes, qualitative speech headroom). Missing readings stay `unavailable` + reason, never a fabricated `0`.
   - Plugins / Connections / Skills: mounted count and demonstration status only. No plugin paths, overlay YAML, MCP env, or credential values.
   - Current body catalog id and title (nonsecret). Wave-1 ids may appear if a parked-19 snapshot is saved; that is a fact, not a 14 acceptance of 19.
   - Accessibility TCC: categorical `trusted` / `untrusted` / `unavailable`. Granting Accessibility is not Allow Once.
   - Telemetry: Wisp session telemetry is **disabled**; overlay row `session-telemetry-otel` is disabled; spawn sets `DSH_TELEMETRY_DISABLED`. Copy must not say “feedback-only sharing is on.”
   - Recovery: home configured yes/no **without** folder path, companion UUID, `memory.json` bytes, or revision hashes. Engine-unavailable recovery copy: Quit and reopen; do not start a second Wisp; forced bridge stop is not a clean pass.
   - Account: no required cloud account; optional cloud key stays in Models.

   `ManagementState` Diagnostics copy must stop claiming voice is unimplemented. Fallback/static copy must match the structured omit list: never credentials, keys (`sk-`, `BEGIN`), bootstrap frames, recognized text, plugin paths, overlay YAML, `memory.json`, companion UUID, home path, or raw engine stderr.

   Optional Copy writes only that redacted on-screen text to the pasteboard. No “send diagnostics,” no network upload, no durable diagnostic log in the Wisp home.

   No chat composer, transcript UI, prompt field, conversation history, `dsh` CLI, or Harness web/chat UI.

2. **No required account; unnecessary telemetry not silently enabled.** Launch, Settings, Diagnostics, and local Models do not require a Wisp or DeepSeek account. Optional cloud remains 05 Models + Keychain. Wisp must not mount or re-enable `session-telemetry-otel`, must not set `DSH_TELEMETRY_MODE=FULL`, must not set `DSH_TELEMETRY_OTLP_URL`, and must keep `DSH_TELEMETRY_DISABLED` non-empty on the engine child (`environment()` from `spike/prepare.mjs` as spread by `body-bridge.mjs`). `classifyInsert` continues to refuse `session-telemetry-otel`. `command-feedback` stays disabled in `product.patch.yml` (feedback-gated upload is not a Wisp feature).

   Pin inspection (not a live network pass): default FEEDBACK_ONLY can export raw session records; therefore overlay disable **and** `DSH_TELEMETRY_DISABLED` are both required. Diagnostics reports that policy. Linux tests prove overlay/env/classifier. Live observation that a local-only session does not contact `harness-telemetry.deepseeksvc.com` is **14.x-macos-e2e**, not claimed here.

3. **Launch, Quit, and recovery are specified and Diagnostics-visible; Linux does not claim native proof.** Ordinary launch: accessory app, one status item, body + Settings/Quit usable. Missing Wisp folder: engine Unavailable; Settings and Quit still work; Diagnostics says home is not configured without echoing a path. Closing Settings does not quit (`applicationShouldTerminateAfterLastWindowClosed` remains false). Menu **Quit Wisp** / Command-Q uses existing `applicationShouldTerminate`: dispose menu/settings/shortcut/permission UI, `bridge.stop()`, wait for EOF; the existing ~32s deadline that emits `forced-bridge-stop` is **not** a clean-pass. Repeat launch must not leave a second status item from the previous process. SIGTERM/SIGINT remain terminate requests, not a substitute for proving menu Quit on Mac.

   Diagnostics shows process-memory last-stop category when known (`none` / `clean` / `forced`) without persisting a crash log into the user home. No new durable diagnostic file.

   Developer stdin commands stay developer-only; ordinary launch has no command channel.

4. **Local install/run docs and qualitative supported-host statement; 07–13 retest; later-slice boundaries.** New (or clearly retitled) first-release local docs — likely `docs/macos-readiness.md` plus updates to `docs/management-shell.md` and `docs/desktop-body.md` — give a reproducible local assemble/run/quit path:

   - Prerequisites: macOS version that can run a macOS 14+ AppKit accessory (Package.swift `macOS(.v14)` is a **compiler floor**, not a marketing support claim); Node meeting `spike/prepare.mjs` (≥22.19, 24 accepted); pnpm 11.7.0 to **prepare** a pin runtime; pristine Harness pin `d347e70`; optional local Ollama; optional DeepSeek key in Models. Speech and a local model need remaining machine capacity; 08 qualitative headroom; **no** invented GB/VRAM/latency cutoffs.
   - Commands: `desktop/scripts/build-macos.sh --scratch /absolute/external/build`; marked `.wisp-owned` scratch; `desktop/scripts/run-macos.sh` / LaunchServices `open -n -W -a` so TCC strings bind to `local.wisp.body`. Ad-hoc `codesign --sign -` is local development identity for microphone/speech usage strings, **not** Developer ID, notarization, or distribution.
   - Quit via status-menu Quit Wisp. Do not claim Sparkle, DMG, App Store, TestFlight, or CI publishing.
   - Historical 02 host (macOS 26.5.2 / Mac16,11 / 24 GiB) is an observation, not an SLA.

   **Retest 07–13** (do not assume they passed; do not write accepted archives):

   - **07** after CompanionController / SettingsWindowController / Diagnostics composition / VoiceLifecycle / EngineBridge: shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend DeepSeek 0/1.
   - **08** Diagnostics/Models hardware snapshot and speech-headroom copy; Refresh still GET-only loopback.
   - **09** Direct URL/file/time still 0/0/0/1; `file:` and `/etc` fail.
   - **10** Plugins catalog; demonstration still gated; `session-telemetry-otel` still not enableable.
   - **11** Connections; secrets still absent from Diagnostics/memory.
   - **12** Skills; same Wisp; Enable is not Allow Once.
   - **13** Settings → Pets still selects orb/fox/robot; Cancel zero snapshot; pet Apply does not restart the engine. Wave-1 is **not** a 14 gate.

   Do **not** retest 15 AX, 16 visual, 17 Windows, or 19 wave-1 as 14 acceptance unless overlay, `classifyInsert`, `wisp.inventory`, `permission-protocol`, AX/visual drivers, or `desktop/windows/**` actually change (they must not). If they change, stop and return a contract repair.

   Proactivity stays “no configured behavior.” Do not implement 18/20/21. Do not resolve Open decisions. `desktop/windows/**` stays byte-unchanged.

5. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS tests for diagnostic snapshot schema, redaction sentinels, overlay telemetry disable, `DSH_TELEMETRY_DISABLED` on `environment()`, classifyInsert refusal of `session-telemetry-otel`, and install-doc omit-list (no notarize/publish/signing-identity language) pass on this host. Native DiagnosticsView / NativeChecks remain **uncompiled/unverified** (`missing-platform`). Live Mac GUI, spoken 07–13, live network, NativeChecks, and no-orphan menu Quit are **14.x-macos-e2e**, not Linux passes. Isolated pin-runtime initialize is **not** a new 14 resource while overlay/`classifyInsert`/`wisp.inventory`/admission stay policy-only (assert disabled telemetry; do not add inserts). Existing missing-external-resource initialize backlog stays recorded. No reserved DeepSeek call, no 05 cloud 6/6, no model download, no key inspection, no merge/publish/spend. This dispatch does not approve the plan or mark 07–19 Shipped.

## Out

- Claiming Linux proved release gates 1–10, spoken e2e, NativeChecks, AppKit click-through, or live OTLP-collector silence.
- Invented numeric performance targets, universal model support, or a GB/VRAM/latency hardware SLA.
- Required Wisp/cloud account; silently enabling Harness telemetry; `DSH_TELEMETRY_MODE=FULL`; setting `DSH_TELEMETRY_OTLP_URL`; re-enabling `session-telemetry-otel` or `command-feedback`.
- Chat composer, transcript UI, Harness web/chat UI, prompt field, or Diagnostics as conversation.
- Credentials, keys, companion UUID, home path, `memory.json`, recognized text, overlay YAML, plugin paths, or raw engine errors in Diagnostics, Copy output, or ordinary memory files. A durable diagnostic log in the Wisp home.
- Publishing, Developer ID, notarization, installer/DMG/App Store distribution, merging PRs, or spend. Implying those in local install docs. Treating ad-hoc codesign as shipping identity.
- Making 15/16/17/18/19/20/21 acceptance criteria; ~20 skins, wake-word, advanced computer control, Windows, remote. Editing `desktop/windows/**`.
- Implementing 18, 20, or 21. Resolving SLICES Open decisions.
- Spending DeepSeek greeting 0/1 or exhausted 05 cloud 6/6; downloading models; inspecting keys.
- Writing `slices/07-*.md` through `slices/19-*.md`; marking 07–19 Shipped; declaring the project Complete.
- Enabling stock `tool-bash` / `tool-fs` / `tool-web` / `tool-pwsh`, Allow Always, or disabling permission, privacy, credential, cancellation, or release safeguards.
- Treating Diagnostics Refresh, Copy, or pet/plugin/connection/skill save as Allow Once.

## Constraints

**Closed readiness pack (this is the contract choice).** SLICES Provides lists e2e evidence, Diagnostics, launch/quit/recovery, no required account or unnecessary telemetry, voice resource headroom, and ordinary desktop usability. Discovery shows live Mac e2e of unaccepted 07–13 is a separate substantial outcome this host cannot perform. This contract covers Diagnostics + telemetry isolation + launch/quit/recovery facts + local install/support docs + recorded 07–13 retest. Honest remainder is **14.x-macos-e2e**. Do not pretend this slice Linux-proves every release gate. Do not leave Diagnostics/install/telemetry/launch-quit empty.

**01–06 accepted; 07–13 unaccepted prerequisites.** Build on parked 07–13 without assuming they work. Record **07–13 retest**. Do not write accepted archives. Historical `07-review-060` HUMAN_REQUIRED is unchanged. Do not spend DeepSeek 0/1.

**Release gate map (honesty, not a Linux pass).**

| Gate | This increment | Remainder / not a 14 gate |
|---|---|---|
| 1 Every 01–14 accepted | Cannot pass while 07–13 and 14 lack APPROVE_IMPLEMENTATION | Independent archive/release review |
| 2 Transparent companion, click-through, shortcut/menu/mute/quit | Docs + Diagnostics recovery; 02/03 already accepted for body/shell | Live Mac usability + 07 shortcut **14.x-macos-e2e** |
| 3 Spoken Harness roundtrip, no chat UI | No composer; Diagnostics is management | Live spoken 07 **14.x-macos-e2e** |
| 4 Hardware onboarding + speech headroom | Surface 08 qualitative snapshot in Diagnostics | Live IOKit/Ollama 08 retest |
| 5 Home/memory/credentials | Diagnostics must not echo path/UUID/secrets (04 rule) | Restart identity 04 + 13 retest |
| 6 Eleven Settings sections | Diagnostics becomes a working flow; Proactivity stays empty | Live keyboard all sections |
| 7 Plugins/Connections/skills demos | Telemetry row stays unlistable; Diagnostics counts | 10/11/12 Mac retest |
| 8 Safe actions + approvals | Do not weaken 06/09 | 09 Mac retest |
| 9 No account/telemetry; launch/quit; local install | **Closed pack** | Live network + live Quit **14.x-macos-e2e** |
| 10 Starter pets; not ~20/wake/AX-visual/Windows/remote | 13 retest orb/fox/robot | 19/18/15/16/17/21 out |

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product overlay remains `desktop/engine/product.patch.yml`. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Do not call Harness web settings controllers. Inspected pin facts for this proposal: `session-telemetry-otel` default `FEEDBACK_ONLY` + OTLP URL above; `resolveTelemetryPatch` any non-empty `DSH_TELEMETRY_DISABLED`; no session-telemetry redaction rule. Do not invent other Harness RPCs.

**Diagnostics is management, not chat.** No `DiagnosticsView` exists today; adding one (or an equivalent structured pane in `SettingsWindowController`) is the expected owned UI increment. Do not put a text field that sends prompts. Copy is pasteboard of redacted text only. Slice 04: General/Memory may show the folder path; Diagnostics must not.

**Do not concatenate `voice.status` into Diagnostics.** Today `managementDescription` for Diagnostics prefixes `voiceDescription`, which includes `voice.status` (operator sentences, not transcripts, but `fail()` can be free-form). Structured Diagnostics uses `VoicePhase`, mute, locale, shortcut registration, categorical permission, and `VoiceReasoningRoute.disclosure` — not recognized text and not assistant `pendingReply`.

**Telemetry belt-and-suspenders.** Overlay disable **and** env opt-out. `DISABLED_STOCK_IDS` already includes `session-telemetry-otel`; Linux 14 tests must assert that id explicitly (current `plugin-config.test.mjs` lists bash/fs/web/skill/hmr/subagent, not telemetry). Do not remove `DSH_TELEMETRY_DISABLED` from `environment()`. Do not edit `spike/` unless a contract repair is required; prefer product tests that import `environment` and overlay.

**Launch/Quit.** Reuse `applicationShouldTerminate`, `bridge.stop()`, `forced-bridge-stop` deadline, `applicationShouldTerminateAfterLastWindowClosed == false`. Do not `exit()` as the product Quit path. Do not add a production JSON command channel.

**Confirmation and permissions.** Refresh/Copy/docs are not sending, deleting, purchasing, or privileged tools. Do not skip Allow Once for 09–12. Diagnostics Refresh is the existing 08 inspect, not a grant.

**Linux implementation track.** This host authors JS tests, docs, and may author Swift. Linux checks do not establish macOS Settings, AppKit, shortcut, microphone, audible TTS, or live egress. Mocks and source inspection are supplemental. Mark Swift uncompiled unless a compatible runner compiles it. Do not mark 07–19 Shipped.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- New `desktop/engine/diagnostics-snapshot.mjs` (schema, redact, telemetry-policy facts) and `desktop/tests/diagnostics-snapshot.test.mjs`; add to `tools/linux-js-tests.sh`.
- New `desktop/macos/Sources/WispBody/DiagnosticsView.swift` and snapshot composition used by `CompanionController.managementDescription` / Diagnostics pane; evolve `ManagementState.swift` Diagnostics copy; wire `SettingsWindowController.swift`.
- Native assertions in `desktop/macos/Tests/WispBodyTests/` (ManagementState + Diagnostics redaction); list new Swift in `desktop/scripts/test-native.sh`.
- `docs/macos-readiness.md`; update `docs/management-shell.md`, `docs/desktop-body.md`; sanitized `evidence/14-macos-readiness.md` at implementation.
- Assert-only on `product.patch.yml` / `plugin-overlay.mjs` / `spike/prepare.mjs` `environment()` — no telemetry re-enable.

Do not edit `desktop/windows/**`, `permission-protocol.mjs`, `product-sdk.ts` admission, `ax-actions.mjs`, `visual-actions.mjs`, accepted `spike/` tracked behavior, or `slices/01-*.md` through `slices/06-*.md`.

## Data / state impact

No new durable diagnostic store. Diagnostics is process memory (plus optional pasteboard of the same redacted text). Do not write Diagnostics into `memory.json`, `wisp-home.json`, `pets/config.json`, plugin/connection/skill snapshots, overlay YAML, or Keychain.

Last-stop category (`none` / `clean` / `forced`) is process memory only; restart starts at `none`. Do not persist crash dumps in the user-chosen Wisp folder.

08 hardware snapshot and Ollama inspect remain ephemeral process memory (existing). Resource-plan file stays under private application-support, not Diagnostics, not `memory.json`.

Identity, selected home, durable memory, Models route, Voice settings, plugin/connection/skill/pet snapshots survive 14 Diagnostics use. Refresh does not Apply models, Enable plugins, or grant tools.

Use fresh `$HOME/wisp-work/wisp-14/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07–13 and 15–19 copies under `evidence/` stay labeled NOT ACCEPTED.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Telemetry + snapshot schema (Linux).** Add `diagnostics-snapshot.mjs` (or equivalent) that: lists allowed keys; rejects extra keys; redacts sentinels (`sk-`, `BEGIN`, `memory.json`, `/Users/`, companion UUID-shaped ids if present in input, plugin paths); states telemetry disabled from overlay+env facts; homeConfigured boolean without path. Unit-test: `product.patch.yml` disables `session-telemetry-otel`; `DISABLED_STOCK_IDS` includes it; `classifyInsert` throws for that id; `environment()` has `DSH_TELEMETRY_DISABLED` non-empty and does not set `DSH_TELEMETRY_MODE` or `DSH_TELEMETRY_OTLP_URL`; composed overlay still contains the disabled telemetry row; snapshot stringify never includes sentinels. Do not HTTP. Do not contact the OTLP URL.

2. **Native Diagnostics pane (sources on Linux, uncompiled here).** `DiagnosticsView` (or equivalent): labeled fields, Refresh, optional Copy. `CompanionController` Diagnostics composition stops using concatenated `voice.status`. `ManagementState` Diagnostics copy matches omit list and does not say voice is unimplemented. `SettingsWindowController` hides/shows the pane like other working sections. Mark NativeChecks uncompiled on Linux.

3. **Docs, 07–13 retest recording, identities.** Write `docs/macos-readiness.md`; update management-shell/desktop-body Diagnostics and local-run language; explicit Out of publishing/signing/notarization. Keep 06/09/10/11/12 protocol tests green without overlay/permission edits beyond telemetry assertions. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac GUI/network/07–13 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames above are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** New `desktop/tests/diagnostics-snapshot.test.mjs` (keep `sh tools/linux-js-tests.sh` as the runner) covering: closed allowed-key snapshot; extra keys rejected; sentinels `sk-live`, `BEGIN CERTIFICATE`, `memory.json`, `/Users/wisp`, a UUID companion id, and a plugin absolute path cannot appear in rendered Diagnostics text; `homeConfigured` boolean with no path; telemetry copy says disabled and does not say feedback-only is active; `environment()` from `spike/prepare.mjs` includes `DSH_TELEMETRY_DISABLED` non-empty; `product.patch.yml` has `- id: session-telemetry-otel` with `disabled: true`; `DISABLED_STOCK_IDS` includes `session-telemetry-otel`; `classifyInsert` refuses that id; `command-feedback` remains disabled in the product patch; `docs/macos-readiness.md` (once added) does not contain notarize, Developer ID, App Store, or Sparkle as instructions to ship. Label results Linux-supplemental. They cannot satisfy Mac Settings GUI, live Quit, or live network Done when items.

2. **Isolated product runtime.** No new 14 initialize obligation while overlay inserts, `classifyInsert` eligibility of product adapters, `wisp.inventory`, and admission stay unchanged except assertions that telemetry stays disabled. Do not claim 09/10/11/12/15/16 pin-runtime initialize. If implementation accidentally changes those sources, stop and return a contract repair. No cloud, no key read, no model download.

3. **07–13 / shell regression obligations (Linux analogue + Mac backlog).** Existing voice-protocol / voice-seams: Diagnostics facts and catalog ids must not enter TTS; pending approval still suppresses speech. Existing plugin/connection/skill/pet config tests remain. Invalidation: CompanionController Diagnostics composition / `openSettings` / `selectSection`, SettingsWindowController, ManagementState, overlay/env, launch scripts. Record 07–13 retest. Do not treat 07–13 as accepted. 15/16/17/19 retest is not a 14 obligation unless those seams change.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains: ManagementState Diagnostics copy omits secrets and does not say voice is unimplemented; Diagnostics snapshot object/text omit `BEGIN`, `sk-`, `memory.json`, `/Users/`, companion UUID, recognized sample phrase; Refresh allowed-operation list still excludes `session/prompt`, pull, and `wakeVoice` (08 `OnboardingRefresh`); Copy uses the same redacted string. `desktop/scripts/build-macos.sh` remains Mac-only here. Live raster/click-through/shortcut remain unverified on Linux.

5. **Mac GUI / live / 07–13 retest (verification backlog, not Linux proof).** On the declared Mac, isolated home: launch via documented local path; Settings → Diagnostics; keyboard to Refresh (and Copy if present); confirm labeled facts; inject a sentinel in a test-only note and confirm it does not appear; missing-home launch: Diagnostics homeConfigured false, no path, Quit works; with home: engine lifecycle truthful; menu Quit; no orphan process/group; relaunch one status item. Ordinary desktop: another app focused, click-through idle transparent regions, status menu, Settings close does not quit. Then **07–13 retest** as in Done when 4. Live local-only session: no contact with pin default OTLP host (operator-recorded; source inspection is not this pass). NativeChecks pass. Do not spend DeepSeek 0/1. Do not assume parked 07–13 Mac GUI already passed.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, `connection-config`, `skill-config`, `pet-config`, hardware/ollama inspect, voice-protocol/seams, safe-actions, ax-actions, visual-actions, windows-home/body-state, and spike client tests remain applicable. Pristine pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`, byte-identical spike and archives 01–06. `desktop/windows/**` unchanged. No 07–13, 15, 16, 17, or 19 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
