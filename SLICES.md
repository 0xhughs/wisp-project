# Wisp — product map

## Product
Wisp is a local-first desktop AI agent embodied by a small animated mascot. Users speak to it, hear its answers and ask it to perform useful computer actions. DeepSeek Harness supplies the invisible agent capability system; Wisp owns the voice, desktop body, management UI, permissions and durable memory. One identity persists across interchangeable bodies, model changes, installed skills and any future remote entry point.

Current release boundary: full macOS first release, selected by the user. Include slices 01–14: invisible engine integration, desktop body, Wisp Settings/menu bar, local memory, local/cloud reasoning, approvals, shortcut-driven voice, hardware-aware Ollama onboarding, initial safe actions, compatible plugins/Connections/MCP/skills, interchangeable starter pets and integrated macOS readiness. Later capabilities 15–21 remain outside those 01–14 acceptance gates even when the user authorizes their implementation.

## Users
People who want a spoken desktop companion without a chat application. Normal users manage friendly Connections and local/cloud model choices; advanced users can configure custom MCP servers and compatible engine capabilities.

## Loop target
Acceptance target: Full macOS first release — slices 01–14. Run status Complete and release-gate success require every included slice independently accepted and all macOS release gates passed. Slice 01 is the first milestone, not the loop stopping point. Execution authorized by the user on 2026-09-06.

Implementation target: slices 01–21, expanded by the user on 2026-09-10. This authorizes implementation, testing, documentation and draft PR updates of the existing slice definitions. It does not authorize publishing or deploying the application, merging pull requests, spending additional money, or treating unimplemented product decisions as resolved.

During this run, inside-implementation-target Later entries may become successive Now slices when eligible. A pending human or Mac check is not automatically a dependency blocker and does not stop the entire project. Outside-implementation-target work never starts automatically. Implemented with verification pending is not Shipped.

## Run status
Running

## Open decisions
- Runtime source is confirmed below. Its Wisp integration, dependency/distribution constraints and approval bridge still require execution evidence; source inspection is not a passed feasibility test.
- Implementation stack, supported OS/hardware floor, speech engines, model catalog and storage formats are deferred to source inspection and their slices. Do not invent numerical performance targets or universal model support.
- Proactivity is a requested Settings area, but triggers and autonomous behavior are unspecified. Define material behavior with the user before implementing proactive actions. Meeting preparation is an illustrative skill, not a mandatory service bundle.
- The 2026-09-10 implementation-target expansion does not resolve slice 18 listening design, slice 20 proactivity triggers, or slice 21 remote-channel choice. Those slices stay decision-blocked until the user specifies them. Settings may keep Proactivity as “no configured behavior.” Do not invent always-listening, autonomous actions, or a paid/external messaging integration.

## Inspected engine reference
User-confirmed repository: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness). Observed HEAD on 2026-09-05: `d347e703908d0406b7a7ef80e3a0e594d86b2215`. This is the proposed spike pin; updating it requires fresh source/contract review. Only source was inspected; nothing was installed or executed.
- [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/docs/architecture.md): named `sdk`, `headless` and `web` profiles are distinct; SDK adds a JSON-RPC server over the shared base. The base includes persistence, settings, credentials and telemetry. A Wisp profile should retain needed capabilities and explicitly inspect telemetry configuration.
- [SDK bundle](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/bundle/sdk-app/README.md) and [profile patch](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/bundle/sdk-app/cordis.patch.yml): process stdio is protocol-only; profile changes require restart. The default coding persona needs Wisp-specific configuration. These are candidate integration seams, not a final stack choice.
- [SDK server](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/sdk/server/README.md) and [dispatch source](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/sdk/server/src/server.ts): inspected dispatch handles initialization, session prompts and shutdown. It provides session/status events but documents no prompt-cancel method or per-prompt result. No approval-response method appears in that dispatch. Wisp approval routing and later voice interruption need explicit designs and proof.
- [Approval subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/docs/subsystems/approval.md): a request-scoped answerer can return a one-action grant, rejection, cancellation or unavailable outcome. Requests refer to a tool call rather than duplicating its arguments. Wisp must correlate the actual action details without relying on a chat transcript.
- [Minimal SDK guide](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/docs/user/guide/python-sdk.md): `sdk-minimal` omits managed settings/credentials and sub-agents and uses unrestricted local tool access. Do not treat it as Wisp's finished configuration merely because its demo is short.
- [Repository overview](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/README.md) identifies developer-preview status and MIT licensing, with third-party notices. Distribution review remains part of the spike; Wisp compatibility and safety cannot be inferred from upstream availability.

## Release gates
For the selected full macOS first release:
1. Every slice 01–14 has applicable independent approval and an immutable archive; final evidence matches the current contract/candidate. No unresolved acceptance gaps or escalations remain.
2. On the declared supported macOS test hardware, Wisp launches as a transparent, movable, always-on-top animated companion; idle transparent regions pass clicks through; shortcut, menu-bar controls, mute and quit work without disrupting normal application use.
3. A real spoken request reaches the real Harness agent/model and returns audible speech with listening/speaking reactions. Recognition and synthesis can be configured independently of reasoning. Voice and engine failures stay inside Wisp surfaces; no chat composer, conversation-history screen or Harness UI is required or exposed.
4. Hardware onboarding inspects applicable CPU/RAM/GPU/VRAM/unified-memory/disk data, recommends feasible Faster/Recommended/Stronger choices with speech headroom and supports Ollama download/use or an optional cloud API key. Validate local-only operation and the cloud route using authorized resources; record tested hardware, model/speech combination and measured observations. Missing live evidence is not a pass.
5. The user-chosen Wisp folder retains readable/editable durable memory and user files across restart. Body and model changes preserve one identity, memory, skills and connections. Credentials stay protected and out of memory/diagnostics; runtime sessions do not become the primary UI.
6. General, Models, Voice, Pets, Plugins, Connections, Skills, Memory, Permissions, Proactivity and Diagnostics exist in Wisp Settings. All capabilities included in the release have working management flows. Proactivity may explicitly report no configured behavior: its triggers remain outside the target. No silent upstream UI fallback or misleading enabled controls.
7. Compatible plugin, Connection/custom MCP, skill and provider paths are demonstrated against declared test integrations; compatibility exclusions are visible. At least one reusable skill runs as the same Wisp. Named service examples are not an all-service shipping obligation; unsupported required capability categories remain blockers.
8. Initial safe URL/file/time actions work from voice. Consequential direct or delegated actions cannot execute before clear scoped confirmation; denied, cancelled, missing and stale approvals prevent effects. Exercise applicable plugin/MCP/skill/sub-agent routes with harmless effects and verify credential handling. Review correctness, security and meaningful test evidence independently.
9. No required cloud account or unnecessary telemetry. Inspect inherited Harness profile behavior, verify the Wisp configuration and report actual network/diagnostic observations. Demonstrate startup, restart and shutdown recovery, no orphan background engine, normal desktop usability and reproducible local macOS installation/run instructions.
10. Starter pet switching is functional; approximately twenty skins, optional voice wake, advanced computer control, Windows and remote channels are not release gates. No publishing, signing identity or external deployment is authorized by acceptance alone.

## Release evidence
Finalization pending.01–06 independentlyaccepted/archived. loop-plan-061 APPROVE_PLAN. 07, 08, 09, 10 and 11 parked implemented-with-verification-pending; NOT Shipped; no slices/07-*.md through slices/11-*.md. 11-review-077 IMPLEMENTATION_READY (Linux 130/130; Mac/runtime backlog). 09-review-073 IMPLEMENTATION_READY (Linux 109/109; Mac/runtime backlog). 08-review-069 IMPLEMENTATION_READY (Linux 68/68; Mac/runtime backlog). 10-review-065 IMPLEMENTATION_READY (Linux 49/49; Mac/runtime backlog). Historical 07-review-060 HUMAN_REQUIRED unchanged. Next Now 13 (13-build-080). User-authorized source checkpoint ce014ffa20caab3e7c3d90ee9defd77faeb6740a published to feat/macos-release-loop. WIPpublication doesnotmean07or08or09or10accepted or releasecomplete. Existing05cloud6/6historical; extraagentallowanceunused.
Failed release reviews for this target: 0
Pending release result: none
Release review events / last consumed dispatch: none

## Shipped
### 01 Hidden engine feasibility proof
Goal: establish an evidenced, Wisp-owned boundary to the exact DeepSeek Harness source without exposing its interface.
Provides: a repeatable headless integration spike, capability map, approval round trip and separation contract for later clients.
Depends on: execution authorization; selected target and upstream source are identified above.
Target membership: inside the selected macOS release target.
Out: product UI, voice, product model-download flows (explicitly authorized external local test-resource provisioning is permitted for 01), production credentials and computer control.


### 02 macOS desktop body
Goal: a transparent always-on-top movable mascot that coexists with ordinary desktop use.
Provides: idle transparent-area click-through, animation states, listening/speaking reactions and a Wisp-owned lifecycle.
Depends on: 01; select framework after native-window feasibility evidence.
Target membership: inside the selected macOS release target. Out: full skin catalog and Windows implementation.


### 03 Wisp management and menu-bar shell
Goal: manage the same companion through Wisp-owned windows and quick controls.
Provides: General, Models, Voice, Pets, Plugins, Connections, Skills, Memory, Permissions, Proactivity and Diagnostics navigation; menu-bar wake, mute, change pet/model, Settings, memory and quit. Unbuilt capabilities are honestly unavailable.
Depends on: 02. No Harness interface fallback; no chat composer or conversation history.
Target membership: inside the selected macOS release target. Out: implementing every section's underlying capability in this slice.

### 04 Local home and durable memory
Goal: retain useful, user-editable knowledge without creating a chat-history product.
Provides: a user-chosen Wisp folder for files/memory, preferences/projects/standing instructions/facts, persistence across restart and a Wisp memory management view; internal sessions/trajectories remain secondary.
Depends on: 01, 03. Protect credentials separately from editable memory and diagnostic output.
Target membership: inside the selected macOS release target. Out: cloud sync and additional identities.

### 05 Reasoning model and provider management
Goal: select the same agent's local or cloud reasoning backend from Wisp.
Provides: compatible Harness model/provider configuration, protected optional cloud API keys, and connection to an existing local Ollama model without a required cloud account.
Depends on: 01, 03. Switching the reasoning model preserves identity and does not replace speech engines.
Target membership: inside the selected macOS release target. Out: hardware-based recommendation and downloads, handled in 08.

### 06 Permission and approval enforcement
Goal: Wisp owns permission decisions across every tool execution route.
Provides: clear scoped pre-execution confirmations for sending, deletion, purchases and privileged operations; denial/cancellation prevent execution; capability and credential management are represented in Wisp.
Depends on: 01, 03. Validate direct tools, plugins, MCP, skills and delegated sub-agents as those routes become available.
Target membership: inside the selected macOS release target. Out: granting broad automatic consent or building later computer-control tools.

## Now
### 13 Interchangeable mascot bodies
Goal: change the pet without changing the underlying companion.
Provides: pet selection and body assets/animation integration; prove identity, memory, tools, models, connections and skills persist across changes.
Depends on: 02–05, 07. Fox, robot and bird are illustrative designs; selected starter assets are decided when this slice is contracted.
Target membership: inside the selected macOS release target. Out: the eventual approximately twenty official skins.

## Later
### 12 Reusable skills for the same Wisp
Goal: install or learn reusable behaviors on the existing identity.
Provides: Wisp skill management backed by Harness; a skill can orchestrate tools/connections and use internal sub-agents with inherited permission constraints.
Depends on: 04, 06, 07, 10–11 as required by the selected skill. Example meeting preparation checks calendar, researches attendees, retrieves relevant documents, summarizes and speaks; choose a supported demonstration when contracting this slice.
Target membership: inside the selected macOS release target. Out: separate assistants and a mandatory meeting integration bundle.

### 14 macOS integrated readiness
Goal: verify a coherent local-first macOS product across slices 01–13.
Provides: end-to-end evidence, Wisp Diagnostics, launch/quit/recovery behavior, no required account or unnecessary telemetry, voice resource headroom and continued ordinary desktop usability.
Depends on: 01–13. Apply the release gates above and document supported macOS hardware/versions and reproducible local installation. External distribution/signing remains a separate decision.
Target membership: inside the selected macOS release target. Out: implied publication, signing credentials, invented performance thresholds or automatic inclusion of every future slice.

### 15 macOS accessibility computer control
Goal: act on applications primarily through structured macOS Accessibility APIs.
Provides: focus/move windows, read focused interfaces, click named controls, type and search the desktop, with visible permission guidance and action-specific approval enforcement.
Depends on: 06, 09. Re-scope into coherent sub-slices before execution if discovery shows multiple substantial independent outcomes.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14). Out: silent privilege escalation and visual fallback implementation.

### 16 Visual computer-control fallback
Goal: complete an authorized action when structured accessibility cannot reach a control.
Provides: bounded visual targeting and failure handling tied to the same task, with the same confirmation rules.
Depends on: 15. Use only when structured access is insufficient; verify the actual target before a consequential action.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14). Out: replacing structured APIs with visual clicking by default.

### 17 Windows companion
Goal: bring the same Wisp identity and product model to Windows.
Provides: transparent always-on-top body, click-through, global shortcut, tray controls, voice/local-model management and parity for the chosen release; prefer UI Automation for structured control.
Depends on: accepted macOS architecture and an authorized Windows scope. Keep platform differences behind evidenced boundaries.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); subsequent substantial contracts must be split before execution. Out: assuming macOS tests prove Windows behavior.

### 18 Optional voice wake
Goal: optionally wake the existing voice companion by voice.
Provides: explicit opt-in, mute behavior and resource/privacy evidence, once the listening design is agreed.
Depends on: 07 and platform-specific evidence.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); future until listening design is agreed. Out: making always-listening mandatory.

### 19 Official skin collection
Goal: expand interchangeable bodies to around twenty official skins.
Provides: a coherent catalog with the same required animation states and unchanged agent identity/capabilities.
Depends on: 13. Around twenty is the user's eventual scale, not an exact first-release requirement.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); future catalog scale. Out: pet-specific assistants or memories.

### 20 Proactivity behavior, scope to be decided
Goal: define and then implement any explicitly chosen proactive behaviors through Wisp Settings.
Provides: a future contract only after triggers, permission scope and interruption behavior are specified by the user.
Depends on: 03, 06, 07 and the required capability slices.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); behavior unspecified. Out: inferring autonomous actions from the Settings section name.

### 21 Optional remote doorway
Goal: later allow a service such as Telegram or WhatsApp to reach the same Wisp.
Provides: a separately authorized access path with the same identity, memory and permission policy; communication-channel details remain undecided.
Depends on: mature local companion and an explicitly scoped remote-access contract.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); much later possibility, not a committed integration.
Out: making remote chat the main product, creating another agent or requiring a chat-history desktop UI.

## Implemented, verification pending
### 07 Shortcut-to-voice agent loop
Goal: wake, speak, reason and hear a response from the same companion.
Provides: global shortcut → microphone → replaceable recognition → Harness agent/model → replaceable synthesis → speaker; synchronized mascot listening/speaking states, mute and recoverable voice failures.
Depends on: 02–06. Prove permission requests use Wisp surfaces and no text-chat fallback is introduced.
Target membership: inside the selected macOS release target. Out: optional wake word and proactive listening.

### 08 Hardware-aware local-model onboarding
Goal: guide users to local reasoning models that run comfortably alongside speech, or a cloud API key.
Provides: RAM, CPU, GPU/VRAM, unified-memory and disk inspection as applicable; Faster, Recommended and Stronger choices; Ollama download/setup feedback; explain unavailable hardware readings and model-fit uncertainty.
Depends on: 05, 07. Avoid double-counting unified memory; recommendation evidence must include speech headroom and available disk. No fixed numeric thresholds have been specified.
Target membership: inside the selected macOS release target. Out: guaranteeing every tier on every machine.

### 09 Initial safe computer actions
Goal: spoken requests produce useful, bounded desktop actions.
Provides: open a URL, open a file and tell time through the same agent, with scoped inputs and appropriate permission handling. File/URL opening must not become an arbitrary command-execution bypass.
Depends on: 06, 07. Actions and failures are communicated through voice/Wisp surfaces.
Target membership: inside the selected macOS release target. Out: broad application manipulation, sending or deletion automation.

### 10 Compatible plugin management
Goal: expose Harness plugins through Wisp while preserving compatibility and permissions.
Provides: plugin discovery/configuration and installation/lifecycle operations supported by the verified engine; compatibility status and honest handling of unsupported plugins.
Depends on: 01, 03, 06. Assess plugin-supplied models/providers, tools and dependent capabilities without exposing its engine UI.
Target membership: inside the selected macOS release target. Out: promising every upstream plugin works unchanged.

### 11 Connections and custom MCP
Goal: configure external capabilities through friendly Wisp Connections or advanced MCP configuration.
Provides: connection setup/status/removal, protected credentials, permissions and compatible custom MCP servers; enforce approvals through external tool routes.
Depends on: 01, 03, 06; 10 when a connection is plugin-delivered. GitHub, Google Drive, Notion, Calendar and Slack are examples, not a promise to ship all connectors together.
Target membership: inside the selected macOS release target. Out: a required online account or unconfirmed external writes.

## Implementation ledger
Bookkeeping only (excluded from contract identity). Status is one of: unstarted; in progress; implemented with verification pending; accepted; blocked. Gap class is one of: none; human-test; missing-platform; external-resource; product-decision; implementation-defect; missing-prerequisite.

- 01 Hidden engine feasibility proof — accepted (archive `slices/01-hidden-engine-feasibility.md`).
- 02 macOS desktop body — accepted (archive `slices/02-macos-desktop-body.md`).
- 03 Wisp management and menu-bar shell — accepted (archive `slices/03-wisp-management-and-menu-bar-shell.md`).
- 04 Local home and durable memory — accepted (archive `slices/04-local-home-and-durable-memory.md`).
- 05 Reasoning model and provider management — accepted (archive `slices/05-reasoning-model-and-provider-management.md`).
- 06 Permission and approval enforcement — accepted (archive `slices/06-permission-and-approval-enforcement.md`).
- 07 Shortcut-to-voice agent loop — implemented with verification pending. Linux 07-build-059 seams independently reviewed; 07-review-060 verdict HUMAN_REQUIRED unchanged (not REJECT; counters 0/0). Parked 2026-09-10 after loop-plan-061 APPROVE_PLAN. Not Shipped. Unaccepted copy `evidence/07-contract-wip.md`. Unaccepted prerequisite for 08, 09, 12, 13. Builds on accepted 02–06.
- 08 Hardware-aware local-model onboarding — implemented with verification pending. 08-review-069 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 68/68 supplemental; NativeChecks/Mac GUI/IOKit/live Ollama/07 Apply retest open. Unaccepted copy `evidence/08-contract-wip.md`. Depends on accepted 05 and unaccepted 07. Parked 10 is not an 08 dependency. Not Shipped.
- 09 Initial safe computer actions — implemented with verification pending. 09-review-073 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 109/109 supplemental; NativeChecks/Mac GUI/NSWorkspace/live Ollama/07 retest/pin-runtime initialize open. Unaccepted copy `evidence/09-contract-wip.md`. Depends on accepted 06 and unaccepted 07. Not Shipped.
- 10 Compatible plugin management — implemented with verification pending. 10-review-065 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 49/49 supplemental; NativeChecks/Mac GUI/live Ollama/pin-runtime initialize open. Unaccepted copy `evidence/10-contract-wip.md`. CompanionController applyPlugins creates 07 Apply/Quit retest obligation. Not Shipped.
- 11 Connections and custom MCP — implemented with verification pending. 11-review-077 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 130/130 supplemental; NativeChecks/Mac GUI/Keychain/live Ollama/07 retest/10 overlay retest/pin-runtime initialize open. Unaccepted copy `evidence/11-contract-wip.md`. Depends on accepted 01, 03, 06; parked 10 obligation for plugin-delivered Connections. Not Shipped.
- 12 Reusable skills for the same Wisp — unstarted. Depends on accepted 04, 06, unaccepted 07, and 10–11 as required by the chosen demo skill (choose when contracting).
- 13 Interchangeable mascot bodies — in progress (Building 13-build-080 after 13-plan-079 APPROVE_PLAN). Depends on accepted 02–05 and unaccepted 07. Contracted starter set is orb/fox/robot (bird not in this slice).
- 14 macOS integrated readiness — unstarted. Depends on 01–13. Last among the 01–14 acceptance target. Mostly Mac evidence.
- 15 macOS accessibility computer control — unstarted. Depends on accepted 06 and 09. Linux native work is uncompiled/unverified here.
- 16 Visual computer-control fallback — unstarted. Depends on 15. Not eligible before 15.
- 17 Windows companion — unstarted. Depends on accepted macOS architecture. Linux may author sources marked uncompiled/unverified. macOS tests do not prove Windows.
- 18 Optional voice wake — blocked (product-decision). Depends on 07 and an agreed listening design. Do not make always-listening mandatory.
- 19 Official skin collection — unstarted. Depends on 13.
- 20 Proactivity behavior — blocked (product-decision). Triggers unspecified. Settings may keep “no configured behavior.” Do not invent autonomous actions.
- 21 Optional remote doorway — blocked (product-decision). Channel undecided. Do not add a paid/external messaging integration.

Recommended eligible order after 07 park: 10 → 08 → 09 → 11 → 13 → 12 → 15 → 17 → 16 → 19; skip 18/20/21; 14 last among 01–14.

## Verification backlog
Bookkeeping only (excluded from contract identity). Batch human checks for a later session. Do not repeatedly request the authorizing user's participation. Code revision for current 07 Linux increment: `ec2e76c402c254be517efa722f699d749913095e`; candidate `fb4e181e561bf4401b8285322f08451ea0653b87b55da7db44fee1a6b157357e` (164 files) on the pre-amendment contract. After this amendment the contract identity changes; 07 product files are unchanged until a later Builder dispatch. Invalidation: any change to Voice/Companion/permission/shortcut/speech sources, identity.py rules, or Harness pin.

1. Slice 07 / Done when 1 — global shortcut while another owned app is focused; Voice settings locale/voice UI and restart persistence; live local/cloud route disclosure. Requires declared Mac, participant, registered hotkey. Automated: Linux-supplemental Wake/mute/conflict copy (`sh tools/linux-js-tests.sh`, 37/37). Procedure: from another focused owned app, press the registered shortcut; confirm listening; check Voice settings labels. Expected: capture starts without focus theft; Wake still works. Invalidated by VoiceShortcut/VoiceActivation/VoiceState/settings persistence edits.

2. Slice 07 / Done when 2 — Wisp TCC microphone, physical on-device recognition, denied/restricted presentation. Requires declared Mac, microphone, OS permission dialog. Automated: RecognitionDouble only; SpeechProviders on-device flags unchanged. Procedure: first-use permission UI then speak a nonempty phrase. Expected: one on-device final submitted; no Apple server fallback. Invalidated by SpeechProviders or capture-lifecycle edits.

3. Slice 07 / Done when 3 — real local Ollama/Harness turn and audible installed-voice start/finish callbacks. Requires declared Mac, local model, speakers/listener. Automated: voice-protocol JS committed-text-only tests. Procedure: bounded spoken request → qwen3:8b/Harness → installed voice heard. Expected: speaking state tracks actual audio, not a WAV write. Invalidated by voice-protocol, TTS, or session-correlation edits. Historical spoken turns remain historical.

4. Slice 07 / Done when 4 — cancel during an actual live provider turn; pending-approval Apply/Quit on the real app; mute/conflict while the real shortcut is registered. Requires declared Mac and live model. Automated: Linux-supplemental processing-cancel/Apply/Quit analogues. Procedure: start a real turn, cancel; with a pending native approval, Apply and Quit; register conflict then use Wake. Expected: settle/idle, no grant revival, Wake usable. Invalidated by VoiceLifecycle/VoiceController/CompanionController cancel paths.

5. Slice 07 / Done when 5 — recognized harmless-tool withhold/deny/cancel/allow-once is 0/0/0/1 on the real registry/native path. Requires declared Mac, developer verification tool, participant. Automated: analogue only (pending approval suppresses speech). Procedure: speak the harmless tool request; use native buttons. Expected: 0/0/0/1; voice is not a grant. Invalidated by permission/bridge/voice-approval edits.

6. Slice 07 / Done when 6 — declared-Mac full roundtrip, second local request, continuity/no-orphan, NativeChecks compile, Keychain attach of saved DeepSeek (access denial, not invalid key). Requires declared Mac, participant Keychain prompt, NativeChecks. Reserved DeepSeek agent greeting 0/1 unspent — do not spend it on Linux. Procedure: `desktop/scripts/test-native.sh`; attach DeepSeek via normal Keychain; two local requests; quit and confirm no orphan processes. Expected: NativeChecks pass; attach succeeds after user approval; no leftover engine. Invalidated by native test sources, bootstrap/keychain, or lifecycle teardown edits.

7. Slice 07 / Tests 1, 3, 8 native — compile and run NativeChecks / registered-shortcut tests on macOS. Requires macOS SDK / Xcode. Automated on Linux: none (uncompiled). Procedure: `desktop/scripts/test-native.sh /absolute/external/native-tests` and `desktop/scripts/build-macos.sh`. Expected: native assertions pass. Invalidated by any `desktop/macos` source change.

8. Slice 10 / Done when 1–2 — declared-Mac Settings → Plugins: catalog labels, keyboard traversal, Install confirm vs cancel (zero overlay change on Cancel), Configure note, Apply, restart persistence, Remove, unsupported rows not enableable. Requires declared Mac and participant. Automated: Linux-supplemental catalog/overlay tests (`sh tools/linux-js-tests.sh`, 49/49 at candidate `f8b24da610370c9575e04ef1d2d9dff54c9d552951812eb60df06b2029489fb8`). Procedure: isolated app, navigate Plugins, enable demo, Apply, relaunch, Remove. Expected: saved/active match; cancel install changes nothing. Invalidated by PluginsView/PluginStore/overlay composer edits.

9. Slice 10 / Tests 2 — prepared pin runtime: `desktop/tests/plugin-overlay-runtime.mjs --runtime-root … --scratch …`. Requires pnpm 11.7.0 and a prepared `.wisp-spike.json` runtime (missing-external-resource here). Automated on this host: not run. Expected: default excludes demo tool; enabled inventory includes only admitted names; disable removes it; hostile extra tool fails initialize; 06 fixture still admits `wisp_plugin_check` when developer fixtures are on. Invalidated by overlay/admission/product-sdk inventory edits.

10. Slice 10 / Done when 4 — live local Ollama demonstration-tool withhold/deny/cancel/allow-once 0/0/0/1; post-Remove absence; Install confirmation produces no ledger record; developer-mode `wisp_plugin_check` still 0/0/0/1 with demo disabled. Requires declared Mac, local model, native approval UI. Automated: protocol allowlist Linux-supplemental only. Procedure: after install, request the demo tool; native buttons; then Remove. Expected: 0/0/0/1; install is not a grant. Invalidated by admission/permission-protocol/compatible-plugin edits.

11. Slice 10 / Tests 4 native — compile and run NativeChecks including PluginStoreTests. Requires macOS SDK. Automated on Linux: none (uncompiled). Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Expected: persist/reload, confirm-cancel, incompatible rows, draft vs saved, Apply while busy, no Allow Always. Invalidated by any `desktop/macos` source change.

12. Shared Apply/restart after 10 — CompanionController `applyPlugins` uses `stopReasoning`/`startAttachment`. Re-run 07 backlog Apply/Quit/continuity/no-orphan and 06 pending-approval Apply. Do not treat 07 as accepted. Invalidated by CompanionController apply/lifecycle sources. Also confirm plugin save-failure after stopReasoning shows unavailable.

13. Slice 11 obligation — plugin-delivered Connections remain unavailable after 10; 11 must not assume 10 mounted MCP. Invalidated if 10 later enables an MCP-class plugin (that would be a contract change).

14. Slice 08 / Done when 1 — Settings → Models onboarding panel, keyboard tab order, Refresh, confirm vs cancel Apply, Diagnostics snapshot. Requires declared Mac and participant. Automated: Linux-supplemental hardware/ollama inspect (`sh tools/linux-js-tests.sh`, 68/68 at candidate `94f7b01f0738f573470eca4c2be1bd93dffb2ffec76f0de95117ae29f920d729`; product `9b8bd595487c40a0f8e27b374a0ee636bffec9ef`). Procedure: isolated app, Settings → Models, keyboard through onboarding controls, Refresh, Cancel Apply. Expected: four rows; cancel leaves route unchanged; no Harness UI. Invalidated by ModelsView/ModelsFocus/CompanionController onboarding edits.

15. Slice 08 / Done when 2–3 — live IOKit/Metal/ProcessInfo/disk snapshot; unified not summed with VRAM; speech-headroom copy visible. Requires declared Mac. Automated: Linux `/proc` schema only. Procedure: Settings → Models and Diagnostics; record CPU, physicalMemory, hasUnifiedMemory, GPU name, disk available. Expected: per-field available or unavailable+reason; no `0` for missing GPU. Invalidated by HardwareProbe/recommend schema edits.

16. Slice 08 / Done when 4 — live GET `/api/tags` includes existing `qwen3:8b` when present; Use Recommended applies that identifier without pull; Install disabled without plan. Requires declared Mac and local Ollama. Automated: loopback fixture only. Procedure: Refresh with Ollama up and stopped; Use Recommended. Expected: tags include installed names; stopped ⇒ unreachable; zero `/api/pull`. Invalidated by ollama-inspect/OnboardingInstall/endpoint parsing edits.

17. Slice 08 / Tests 4 native — compile and run NativeChecks including HardwareProbe/OnboardingState. Requires macOS SDK. Automated on Linux: none (uncompiled). Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Expected: decode fixtures, unified-not-summed, confirm-cancel, no-op Apply, Install disabled without plan, Diagnostics omit secrets. Invalidated by any `desktop/macos` source listed in `test-native.sh`.

18. Slice 08 / Done when 5 — 07 retest after onboarding Apply: shortcut/Wake still usable, no auto-listen, mute preserved, no grant revival, no orphan engine; restart persistence of the chosen 05 route. Requires declared Mac, participant, microphone/speakers as in 07 backlog. Do not spend reserved DeepSeek 0/1. Automated: Linux-supplemental applyModels no-op / reuse only. Procedure: Use Recommended confirm; then 07 shortcut/Wake, mute, no auto-listen, continuity/no-orphan (backlog items 1, 3, 4, 6). Expected: saved route is the recommended identifier; 07 still not Shipped. Invalidated by `applyModels`/`startAttachment`/VoiceLifecycle/onboarding Apply edits.

19. Slice 08 download path — live pull remains unauthorized until a coordinator-recorded consented resource plan (source, purpose, size/location, consent). This Linux host must not run it. Control stays disabled without the plan. Invalidated by pull-transport/OnboardingInstall edits.

20. Slice 09 / Done when 2–4 — declared-Mac native Allow Once / Deny / Cancel for URL, file, and time; exact destination visible; deny/cancel zero effect; Allow Once one platform open or one clock read. Requires declared Mac and participant. Automated: Linux-supplemental recording opener (`sh tools/linux-js-tests.sh`, 109/109 at candidate `acf317bbb2645a832daec8db54248cd870c4d69b22b4fbdd5dc393fb630b3714`; product `3fbedef8cd46bd3017751d7b184ae8c0c793215f`). Procedure: isolated app; request each action; native buttons. Expected: 0/0/0/1 per tool; `file:` and `/etc` never succeed. Invalidated by safe-actions/permission-protocol/PermissionState/SafeActionOpener edits.

21. Slice 09 / Done when 5 — 07 retest after 09 bridge/permission/opener edits: shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Requires declared Mac. Do not spend DeepSeek 0/1. Automated: Linux voice-seams analogue. Invalidated by CompanionController/EngineBridge/VoiceLifecycle/opener edits.

22. Slice 09 / Tests 4 native — compile NativeChecks including SafeActionOpener assertions. Requires macOS SDK. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by any `desktop/macos` source listed in `test-native.sh`.

23. Slice 09 / Tests 2 — prepared pin runtime initialize: inventory includes the three 09 names; excludes `wisp_compatible_check` unless enabled; hostile extra tool fails initialize. Requires pnpm 11.7.0 and prepared `.wisp-spike.json` (missing-external-resource here). Invalidated by product-sdk inventory/seal or overlay composer.

24. Slice 15 obligation — Accessibility computer control remains unavailable after 09; 11/15 must not assume 09 admitted AX APIs. Invalidated if 09 later admits those tools (that would be a contract change).

25. Slice 11 / Done when 1–2 — declared-Mac Settings → Connections: catalog labels, keyboard traversal, Enable confirm vs cancel (zero overlay change on Cancel), Advanced Wisp-fixed fields, Apply, restart persistence, Remove, unsupported rows not enableable. Requires declared Mac and participant. Automated: Linux-supplemental catalog/overlay tests (`sh tools/linux-js-tests.sh`, 130/130 at candidate `ded171f18adafe167b7df0ddb5fdaa256e36b818633969f46a0125cccbcd1ca0`; product `f58ac2f10c1f3b331ab601f17c355ca481c2ec6d`). Procedure: isolated app, navigate Connections, enable demo, Apply, relaunch, Remove. Expected: saved/active match; cancel install changes nothing. Invalidated by ConnectionsView/ConnectionStore/overlay composer edits.

26. Slice 11 / Done when 3–4 — live local stdio fixture withhold/deny/cancel/allow-once 0/0/0/1 on actual tools/call + ledger; list-change after seal yields zero further RPC; connection save is not a grant. Requires declared Mac, native approval UI; live Ollama when claiming model-path 0/0/0/1. Automated: real stdio analogue in linux-js-tests. Invalidated by mcp-connection/mcp-wrap/admission/permission-protocol edits.

27. Slice 11 / Tests 4 native — compile NativeChecks including ConnectionStore and isolated-test-keychain CRUD. Requires macOS SDK. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by any `desktop/macos` source listed in `test-native.sh`.

28. Slice 11 / Tests 2 — prepared pin runtime initialize: default excludes `mcp__` names; enabled inventory includes only admitted names; disable removes them; hostile extra tool fails initialize. Requires pnpm 11.7.0 and prepared `.wisp-spike.json` (missing-external-resource here). Invalidated by overlay/admission/product-sdk inventory edits.

29. Slice 11 / credential isolation (Mac) — isolated test Keychain: save/remove opaque connection credential; overlay/memory.json/Diagnostics contain no secret; disabled connection injects nothing. Never inspect production keys. Invalidated by ConnectionStore/credential inject/overlay compose edits.

30. Shared 07 retest after 11 — CompanionController `applyConnections` uses `stopReasoning`/`startAttachment`. Re-run 07 backlog Apply/Quit/continuity/no-orphan and 06 pending-approval Apply. Do not treat 07 as accepted. Do not spend DeepSeek 0/1. Invalidated by CompanionController apply/lifecycle, EngineBridge, VoiceLifecycle, or permission allowlists.

31. Shared 10 overlay/inventory retest after 11 — demonstration plugin still absent until enabled; extra unadmitted tools still fail initialize; `mcp-connection-plugin` still not enableable; 09 Direct names still present when 09 sources load. Invalidated by overlay composer, `classifyInsert`, `wisp.inventory`, or startAttachment snapshot attach.
