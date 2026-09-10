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
Finalization pending.01–06 independentlyaccepted/archived. loop-plan-061 APPROVE_PLAN. 07, 08, 09, 10, 11, 12, 13, 15, 16, 17 and 19 parked implemented-with-verification-pending; NOT Shipped; no slices/07-*.md through slices/19-*.md. 16-review-097 IMPLEMENTATION_READY (Linux 241/241; Mac raster/NSEvent/GUI backlog). 17-review-093 IMPLEMENTATION_READY (Linux 199/199; Win32/MSVC/GUI backlog). 15-review-089 IMPLEMENTATION_READY (Linux 185/185; Mac/runtime backlog). 12-review-085 IMPLEMENTATION_READY (Linux 151/151; Mac/runtime backlog). 11-review-077 IMPLEMENTATION_READY (Linux 130/130; Mac/runtime backlog). 13-review-081 IMPLEMENTATION_READY (Linux 136/136; Mac/runtime backlog). 09-review-073 IMPLEMENTATION_READY (Linux 109/109; Mac/runtime backlog). 08-review-069 IMPLEMENTATION_READY (Linux 68/68; Mac/runtime backlog). 10-review-065 IMPLEMENTATION_READY (Linux 49/49; Mac/runtime backlog). Historical 07-review-060 HUMAN_REQUIRED unchanged. 16-review-097 IMPLEMENTATION_READY parked 16 verification-pending; NOT Shipped; no slices/16-*.md. 19-review-101 IMPLEMENTATION_READY parked 19 verification-pending; NOT Shipped; no slices/19-*.md. Next Now 14 (14-draft-102 pending). 19 candidate bfd2fb9dd8b770baf5babaa204024354158b4a71e0649c7ca06a0894d189dd79 (293 files); Linux 241/241 independently reproduced. User-authorized source checkpoint ce014ffa20caab3e7c3d90ee9defd77faeb6740a published to feat/macos-release-loop. WIPpublication doesnotmean07or08or09or10or11or12or13or15or16or17or19accepted or releasecomplete. Existing05cloud6/6historical; extraagentallowanceunused.
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
### 14 macOS integrated readiness
Goal: verify a coherent local-first macOS product across slices 01–13.
Provides: end-to-end evidence, Wisp Diagnostics, launch/quit/recovery behavior, no required account or unnecessary telemetry, voice resource headroom and continued ordinary desktop usability.
Depends on: 01–13. Apply the release gates above and document supported macOS hardware/versions and reproducible local installation. External distribution/signing remains a separate decision.
Target membership: inside the selected macOS release target. Out: implied publication, signing credentials, invented performance thresholds or automatic inclusion of every future slice.

## Later
### 18 Optional voice wake
Goal: optionally wake the existing voice companion by voice.
Provides: explicit opt-in, mute behavior and resource/privacy evidence, once the listening design is agreed.
Depends on: 07 and platform-specific evidence.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); future until listening design is agreed. Out: making always-listening mandatory.

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

### 12 Reusable skills for the same Wisp
Goal: install or learn reusable behaviors on the existing identity.
Provides: Wisp skill management backed by Harness; a skill can orchestrate tools/connections and use internal sub-agents with inherited permission constraints.
Depends on: 04, 06, 07, 10–11 as required by the selected skill. Example meeting preparation checks calendar, researches attendees, retrieves relevant documents, summarizes and speaks; choose a supported demonstration when contracting this slice.
Target membership: inside the selected macOS release target. Out: separate assistants and a mandatory meeting integration bundle.

### 13 Interchangeable mascot bodies
Goal: change the pet without changing the underlying companion.
Provides: pet selection and body assets/animation integration; prove identity, memory, tools, models, connections and skills persist across changes.
Depends on: 02–05, 07. Fox, robot and bird are illustrative designs; selected starter assets are decided when this slice is contracted.
Target membership: inside the selected macOS release target. Out: the eventual approximately twenty official skins.

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

### 19 Official skin collection
Goal: expand interchangeable bodies to around twenty official skins.
Provides: a coherent catalog with the same required animation states and unchanged agent identity/capabilities.
Depends on: 13. Around twenty is the user's eventual scale, not an exact first-release requirement.
Target membership: inside the authorized 01–21 implementation target (2026-09-10); outside the macOS first-release acceptance gates (01–14); future catalog scale. Out: pet-specific assistants or memories.

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
- 12 Reusable skills for the same Wisp — implemented with verification pending. 12-review-085 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 151/151 supplemental; NativeChecks/Mac GUI/live Ollama skill-then-time/pin-runtime initialize/07/09/10/11 retest open. Unaccepted copy `evidence/12-contract-wip.md`. Chosen demo `wisp-local-time-briefing` then 09 `wisp_tell_time`. Depends on accepted 04, 06; unaccepted 07; parked 09/10/11/13. Not Shipped.
- 13 Interchangeable mascot bodies — implemented with verification pending. 13-review-081 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 136/136 supplemental; NativeChecks/Mac GUI/raster/click-through/restart/PID/07 retest open. Unaccepted copy `evidence/13-contract-wip.md`. Depends on accepted 02–05 and unaccepted 07. Not Shipped.
- 14 macOS integrated readiness — unstarted (Now selected; 14-draft-102 pending). Depends on 01–13 (07–13 implemented with verification pending, not assumed working). Last among the 01–14 acceptance target. Mostly Mac evidence. Record 07–13 retest. Not Shipped.
- 15 macOS accessibility computer control — implemented with verification pending. 15-review-089 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 185/185 supplemental; NativeChecks/Mac AX/TCC/GUI/live Ollama/pin-runtime initialize/06/07/09/10/11/12 retest open. Unaccepted copy `evidence/15-contract-wip.md`. Closed fixture-only Direct AX catalog. Depends on accepted 06 and parked 09. Not Shipped.
- 16 Visual computer-control fallback — implemented with verification pending. 16-review-097 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 241/241 supplemental; NativeChecks/Mac owned-window raster/NSEvent/fixture GUI/TCC-non-prompt/live Ollama/pin-runtime initialize/06/07/09/10/11/12/15 retest open. Unaccepted copy `evidence/16-contract-wip.md`. Closed Drawn Canary visual click inside the 15 fixture; AX remains Fixture Button path. Depends on accepted 06 and parked 09/15. Not Shipped.
- 17 Windows companion — implemented with verification pending. 17-review-093 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 199/199 supplemental; NativeChecks/MSVC/Win32 GUI/tray/hotkey/DACL open. Unaccepted copy `evidence/17-contract-wip.md`. Closed body/tray/shortcut/same-home identity increment; UIA/voice/engine deferred 17.x. macOS tests do not prove Windows. Not Shipped.
- 18 Optional voice wake — blocked (product-decision). Depends on 07 and an agreed listening design. Do not make always-listening mandatory.
- 19 Official skin collection — implemented with verification pending. 19-review-101 IMPLEMENTATION_READY (not APPROVE_IMPLEMENTATION; counters 0/0). Linux 241/241 supplemental; NativeChecks/Mac GUI/raster/click-through/restart/PID/13 retest/07 retest open. Unaccepted copy `evidence/19-contract-wip.md`. Closed wave 1: keep orb/fox/robot; add bird/cat/owl/sprout/capsule. official-skins remainder. Depends on accepted 02–05 and parked 13/07. Not Shipped.
- 20 Proactivity behavior — blocked (product-decision). Triggers unspecified. Settings may keep “no configured behavior.” Do not invent autonomous actions.
- 21 Optional remote doorway — blocked (product-decision). Channel undecided. Do not add a paid/external messaging integration.

Recommended eligible order after 07 park: 10 → 08 → 09 → 11 → 13 → 12 → 15 → 17 → 16 → 19; skip 18/20/21; 14 last among 01–14. 19 parked; next Now 14 (14-draft-102 pending).

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

32. Slice 13 / Done when 1 — declared-Mac Settings → Pets and menu Change Pet…; keyboard traversal; confirm vs cancel (zero snapshot write, zero silhouette change); Apply fox then robot then orb; folder-required copy without a home. Requires declared Mac and participant. Automated: Linux-supplemental catalog/schema (`sh tools/linux-js-tests.sh`, 136/136 at candidate `8308bd8c484d25bc89671639477d14005039547b1db8a349e299a00db97ad511`; product `edb3537b57bea0200065a1fa24945fd02a05cb0c`). Procedure: isolated app, navigate Pets, select fox, Cancel, then Apply with confirm. Expected: cancel changes nothing; Apply persists catalog id and swaps the drawing. Invalidated by PetsView/PetStore/ManagementState/SettingsWindowController edits.

33. Slice 13 / Done when 2 — per-body developer `raster` (corner alpha 0, gap alpha 0, unique opaque > 0), click-through corners and interior gap, drag visible pixels, Reduce Motion, non-key/non-main always-on-top, idle/listening/speaking distinct on orb/fox/robot. Requires declared Mac. Automated on Linux: none (uncompiled). Procedure: developer `raster`/`listen`/`speak`/`sequence` per id; click through corners/gap. Expected: three distinguishable silhouettes; 02 geometry class. Invalidated by MascotView/replaceBody/raster sample table edits.

34. Slice 13 / Done when 3 — restart restores last saved catalog id with the same companion UUID, home path, memory revision, Models route, Voice mute/locale, plugin snapshot, and connection snapshot; `runtimePID`/`sessionId` unchanged across pet Apply when an engine is attached. Requires declared Mac. Automated: Linux sibling-isolation only. Invalidated by PetStore/applyPets/prepareModels/CompanionController identity paths.

35. Slice 13 / Tests 4 native — compile NativeChecks including PetStore persist/reload, default orb, unknown id rejected, confirm-cancel, draft vs saved, Apply while homeBusy/ending refused, Apply allowed when modelBusy analogue is true, unsupported skins row not enableable, ManagementState Pets copy. Requires macOS SDK. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by any `desktop/macos` source listed in `test-native.sh`.

36. Shared 07 retest after 13 — CompanionController `replaceBody`/`applyPets`/`prepareModels`/`render` and MascotView changed. Re-run 07 backlog shortcut/Wake, no auto-listen after pet Apply, mute preserved, new body tracks listening/speaking, pending-approval speech suppression, no grant/reply revival, no orphan. Do not treat 07 as accepted. Do not spend DeepSeek 0/1. Invalidated by CompanionController body-swap, MascotView, VoiceLifecycle, EngineBridge, or permission allowlists.

37. Slice 19 obligation — additional official skins remain the unsupported `official-skins` row after 13; 19 must not assume a marketplace or a fourth starter (bird) shipped here. Invalidated if 13 later enables extra catalog ids (that would be a contract change).

38. Slice 12 / Done when 1–2 — declared-Mac Settings → Skills: catalog labels, keyboard traversal, Enable confirm vs cancel (zero snapshot/overlay change on Cancel), Apply, restart persistence, Remove, unsupported rows not enableable, no marketplace-empty implication. Requires declared Mac and participant. Automated: Linux-supplemental catalog/overlay tests (`sh tools/linux-js-tests.sh`, 151/151 at candidate `35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416`; product `bef1bdd8d452adc4fd6abfc6e710d45e89bc7fcf`). Procedure: isolated app, navigate Skills, enable demo, Apply, relaunch, Remove. Expected: saved/active match; cancel changes nothing; Pets copy still same Wisp. Invalidated by SkillsView/SkillStore/overlay composer/ManagementState Skills or Pets copy edits.

39. Slice 12 / Done when 3 — live local Ollama: `skill` withhold/deny/cancel/allow-once 0/0/0/1 (instruction load only, zero clock canary); then `wisp_tell_time` 0/0/0/1; Enable produces no ledger/clock record. Requires declared Mac, local model, native approval UI. Automated: protocol allowlist Linux-supplemental only. Do not spend DeepSeek 0/1. Invalidated by skill-wrap/admission/permission-protocol/safe-actions edits.

40. Slice 12 / Tests 2 — prepared pin runtime initialize: default excludes `skill`; enabled includes `skill` and the 09 Direct names; disable removes `skill`; hostile extra unadmitted tool fails initialize. Requires pnpm 11.7.0 and prepared `.wisp-spike.json` (missing-external-resource here). Invalidated by overlay/admission/product-sdk inventory/skill-register/skill-wrap edits.

41. Slice 12 / Tests 4 native — compile NativeChecks including SkillStore persist/reload, default disabled, unknown id rejected, confirm-cancel, draft vs saved, Apply while busy refused, unsupported rows, ManagementState Skills copy, PermissionState `skill` case. Requires macOS SDK. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by any `desktop/macos` source listed in `test-native.sh`.

42. Shared 07 retest after 12 — CompanionController `applySkills` uses `stopReasoning`/`startAttachment`. Re-run 07 backlog shortcut/Wake, no auto-listen after skill Apply, mute preserved, pending-approval Apply, no orphan. Do not treat 07 as accepted. Do not spend DeepSeek 0/1. Invalidated by CompanionController apply/lifecycle, EngineBridge, VoiceLifecycle, or permission allowlists.

43. Shared 09 retest after 12 — Direct names still present when 09 sources load; `wisp_tell_time` still 0/0/0/1; `file:` and `/etc` still fail. Invalidated by permission-protocol, PermissionState, SafeActionOpener, or Direct admission.

44. Shared 10 overlay/inventory retest after 12 — demonstration plugin still absent until enabled; extra unadmitted tools still fail initialize; `skill` absent until Skills enabled; `mcp-connection-plugin` still not enableable. Invalidated by overlay composer, `classifyInsert`, `wisp.inventory`, or startAttachment snapshot attach.

45. Shared 11 MCP retest after 12 — default excludes `mcp__` names; enabled connection inventory still only admitted MCP names; skill enablement does not admit MCP tools. Invalidated by overlay/admission/product-sdk inventory edits.

46. Slice 13 copy obligation — Pets “has not queried” skills assertion is replaced by same-Wisp persistence copy. Pet Apply still must not restart the engine or change skill snapshot bytes. Invalidated by PetStore/applyPets/replaceBody or SkillStore sibling isolation.

47. Slice 14/19/20 — additional skills, marketplaces, learned-skill authoring, and proactivity remain unavailable rows after 12. Invalidated if 12 later enables extra catalog ids (that would be a contract change).

48. Slice 15 / Done when 1–3 — declared-Mac native Allow Once / Deny / Cancel for each of the six AX tools against the fixture; exact destination visible; deny/cancel zero canary; Allow Once one corresponding AX effect; unknown names never allowable. Requires declared Mac, participant, Accessibility TCC as specified per case. Automated: Linux-supplemental recording driver (`sh tools/linux-js-tests.sh`, 185/185 at candidate `0756b7da7e25273c3a6b25eacc77dacfce6062c4e9f764f9a0fee05ec3998eea`; product `7a276bac81b102fdba8b2d3c9595aac63a51ad22`). Procedure: isolated app; request each tool; native buttons; observe fixture canaries. Expected: 0/0/0/1 per tool; other-app titles never returned. Invalidated by ax-actions/permission-protocol/PermissionState/AccessibilityDriver edits.

49. Slice 15 / Done when 2 — TCC denied: zero `AXUIElement` calls and `untrusted` complete; Settings Permissions copy + user-initiated open of Accessibility settings does not execute a tool; granting TCC is not Allow Once. Requires declared Mac and participant. Automated: none on Linux. Invalidated by AccessibilityDriver TCC branch or ManagementState Permissions copy.

50. Slice 15 / Done when 4 — 07 retest after 15 bridge/permission edits: shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Requires declared Mac. Do not spend DeepSeek 0/1. Automated: Linux voice-seams analogue. Invalidated by CompanionController/EngineBridge/VoiceLifecycle/permission-protocol edits.

51. Slice 15 / Tests 4 native — compile NativeChecks including PermissionRequest AX tuples, confirm-cancel zero driver calls, ManagementState TCC copy. Requires macOS SDK. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by any `desktop/macos` source listed in `test-native.sh`.

52. Slice 15 / Tests 2 — prepared pin runtime initialize: inventory includes six AX + three 09 names; excludes gated 10/11/12 names; hostile extra tool fails initialize. Requires pnpm 11.7.0 and prepared `.wisp-spike.json` (missing-external-resource here). Invalidated by product-sdk inventory/seal or overlay composer.

53. Shared 09 retest after 15 — Direct names still present; `wisp_tell_time` still 0/0/0/1; `file:` and `/etc` still fail; recording-opener 0/0/0/1; open-request still independent of ax-request. Invalidated by permission-protocol, PermissionState, SafeActionOpener, Direct admission, or body-bridge open path.

54. Shared 06 retest after 15 — permission-protocol / PermissionState / consume() still fail-closed for fixtures; queue 8; Cancel-first; no Allow Always. Invalidated by those sources.

55. Shared 10/11/12 overlay/inventory retest after 15 — demonstration plugin / `mcp__` / `skill` still absent until enabled; extra unadmitted tools still fail initialize; AX names present in default inventory. Invalidated by overlay composer, `classifyInsert`, `wisp.inventory`, or startAttachment snapshot attach.

56. Slice 16/17 obligation — visual click and Windows UI Automation remain unavailable after 15; 15 must not add screenshot targeting or UIA. Invalidated if 15 later admits those tools (that would be a contract change).

57. Slice 15.x remainder — other apps, Spotlight, menu bar/Dock, drag/scroll beyond ±64 remain unavailable. Invalidated if 15 later expands the closed title/name enum or target beyond the fixture (that would be a contract change).

58. Slice 17 / Done when 1 — declared Windows desktop: MSVC/CMake `Wisp.exe`; layered per-pixel click-through of even-odd `wisp-orb` corners and interior gap onto an independent titled target; opaque drag; always-on-top without activation theft; no rectangular backing. Requires Windows MSVC runner and participant. Automated: Linux-supplemental orb/BodyPhase/clamp tests (`sh tools/linux-js-tests.sh`, 199/199 at candidate `28bc82ae285d081a0d6639a093eeb7d023bdcddfcb51552f709cba15527f5e47`; product `da52341b72e6d3c5b6d88f1c6337949aa1c2b74e`). Procedure: `desktop/tests/gui/windows/README.md` over Notepad (or equivalent) including edge cross. Expected: transparent pixels pass clicks; opaque pixels drag; no `WS_EX_TRANSPARENT` whole-window punch. Invalidated by `desktop/windows` body/orb/geometry sources or manifest uiAccess.

59. Slice 17 / Done when 2 — tray Show Companion / Choose Folder / Settings/General / Quit; Wake Voice and Mute present and disabled; no last-window exit; startup failure still has tray. Requires Windows desktop. Automated: Linux tray string tests only. Procedure: isolated `--test-support`; Show Companion without foreground theft; Quit removes icon. Expected: one notify icon “Wisp”; voice items do not capture audio. Invalidated by WinShell/WinApp tray sources.

60. Slice 17 / Done when 3 — Ctrl+Alt+W while another owned app is focused shows the body without capture; conflict copy if registration fails; Alt+Space is not registered; no WH_KEYBOARD_LL fallback. Requires Windows desktop. Automated: Linux chord-constant tests. Procedure: focus Notepad, press Ctrl+Alt+W. Expected: body revealed/clamped; no system window menu chord. Invalidated by WinShell hotkey sources.

61. Slice 17 / Done when 4 — Choose Folder cancel changes nothing; empty folder mints one UUID once; existing `wisp-home.json` UUID reused; relaunch via AppData/`--test-support` pointer restores the same companion; owner-only DACL; exclusive lock refuse. Requires Windows desktop. Automated: Linux marker/pointer schema tests. Procedure: isolated test-support child of marked scratch. Expected: same UUID; no second companion. Invalidated by windows-home.mjs / HomeIdentity / WinHome sources.

62. Slice 17 / Tests 4 native — MSVC compile of `Wisp.exe` and `WispNativeChecks` (pointer decode, marker reuse, hotkey constants, `uiAccess="false"`). Requires Windows SDK/MSVC. Automated on Linux: skip/`missing-platform` (`desktop/scripts/build-windows.sh`). Optional g++ portable NativeChecks is not Win32 proof. Procedure: `desktop/scripts/build-windows.ps1`. Expected: compile succeeds; assertions pass. Invalidated by `desktop/windows` sources or CMakeLists.

63. Slice 17 / Tests 5 GUI — full isolated GUI/tray/shortcut/identity checklist in `desktop/tests/gui/windows/README.md`. Requires Windows desktop and participant. Do not spend DeepSeek 0/1. Do not enable UI Access. Invalidated by Win32 body/shell/home sources.

64. Slice 17 protocol non-touch — `desktop/macos/**`, `permission-protocol.mjs`, `body-bridge.mjs`, overlay `DISABLED_STOCK_IDS`, and `product.patch.yml` remain unchanged vs 17 Building dispatch `ee2491abb2b10cb9a8e4622311f9c42c3602626d`. 06/07/09/10/11/12/15 protocol retest is not required unless those seams later change. Invalidated by edits to those paths.

65. Slice 17.x remainder — engine attach, voice, models, eleven-section Settings, 09 openers, UIA, installer remain Out. Invalidated if 17 later starts Node, admits `wisp_uia_*`, or enables `tool-pwsh` (that would be a contract change).

66. Slice 16 obligation after 17 — visual click stays 16; this Windows body must not add screenshot targeting or `SendInput`. Invalidated if 17 later uses those effect paths.

67. Slice 16 / Done when 1–3 — declared-Mac native Allow Once / Deny / Cancel for `wisp_visual_click_drawn` against Drawn Canary; exact destination visible; deny/cancel zero `Drawn Count`; Allow Once unique match then one owned-window click; `Fixture Count` unchanged. Requires declared Mac and participant. Automated: Linux-supplemental recording driver (`sh tools/linux-js-tests.sh`, 241/241 at candidate `7315ae33627073403688c685d34677d8216243ccf388a6ab812cbb45c6dbb96c`; product `597d9b45cc36ba4ec6a145e5b373ec0b0874c3d1`). Procedure: isolated app; open fixture; visual Deny/Cancel then Allow Once; observe counts. Expected: 0/0/0/1; Fixture Count unchanged on visual; Drawn Count +1 only after Allow Once. Invalidated by visual-actions / VisualClickDriver / AccessibilityFixtureWindow / permission-protocol edits.

68. Slice 16 / Done when 2 — no Screen Recording / Input Monitoring prompt at launch/initialize/describe/execute; in-process owned-window raster only; missing/ambiguous/hidden canary completes `failed` with zero click. Requires declared Mac. Automated: none on Linux. Invalidated by capture APIs or TCC prompt sites.

69. Slice 16 / prefer-AX — `wisp_ax_click_named` still increments only `Fixture Count`; visual refuses `Fixture Button` before prompt; Drawn Canary is not an accessibility element. Requires declared Mac. Automated: Linux FIND_NAMES / Fixture Button refusal tests. Invalidated by ax-actions FIND_NAMES, ax click destination, or fixture accessibility flags.

70. Slice 16 / Tests 4 native — compile NativeChecks including visual PermissionRequest tuples, confirm-cancel zero driver calls, accessibility-ignored canary. Requires macOS SDK. Linux: missing-platform. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by VisualClickDriver / AccessibilityFixtureWindow / PermissionState / test-native.sh list.

71. Slice 16 / Tests 2 — prepared pin runtime initialize includes visual + six AX + three 09 names; excludes gated 10/11/12 names; hostile extra tool fails initialize. Requires pnpm 11.7.0 and prepared `.wisp-spike.json` (missing-external-resource here). Invalidated by product-sdk inventory/seal or overlay composer.

72. Shared 06 retest after 16 — permission-protocol / PermissionState / consume() still fail-closed; queue 8; Cancel-first; no Allow Always; Deny/Cancel zero visual-driver calls. Invalidated by those sources.

73. Shared 07 retest after 16 — CompanionController/EngineBridge/VoiceLifecycle: shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, visual-request not TTS, no orphan. Requires declared Mac. Do not spend DeepSeek 0/1. Automated: Linux voice-seams analogue. Invalidated by CompanionController/EngineBridge/VoiceLifecycle/permission-protocol edits.

74. Shared 09 retest after 16 — Direct names still present; recording-opener 0/0/0/1; `file:` / `/etc` fail; open-request independent of visual-request. Invalidated by permission-protocol, PermissionState, SafeActionOpener, Direct admission, or body-bridge open path.

75. Shared 15 retest after 16 — six AX tools still 0/0/0/1; unknown AX names fail before prompt; ax-request independent of visual-request; fixture canaries do not cross-increment. Invalidated by ax-actions, AccessibilityFixtureWindow, AccessibilityDriver, or body-bridge ax path.

76. Shared 10/11/12 overlay/inventory retest after 16 — demonstration plugin / `mcp__` / `skill` still absent until enabled; extra unadmitted tools still fail initialize; visual name present in default inventory. Invalidated by overlay composer, `classifyInsert`, `wisp.inventory`, or startAttachment snapshot attach.

77. Slice 16.x remainder — other apps, drag, multi-monitor HID, OCR, Windows SendInput remain unavailable. Invalidated if 16 later expands `target` beyond Drawn Canary or adds `CGEventPost` / `SendInput`.

78. Slice 17 obligation after 16 — parked Windows body must remain without `SendInput` / screenshot targeting. Invalidated if 16 or a later 17 edit adds those effect paths.

79. Slice 19 / Done when 1 — declared-Mac Settings → Pets and menu Change Pet…; keyboard traversal across all eight selectable bodies; confirm vs cancel (cancel: zero snapshot write, zero silhouette change); Apply each wave-1 id then fox then robot then orb. Requires declared Mac and participant. Automated: Linux-supplemental catalog/schema (`sh tools/linux-js-tests.sh`, 241/241 at candidate `bfd2fb9dd8b770baf5babaa204024354158b4a71e0649c7ca06a0894d189dd79`; product `3b45452cefe07dd5e43c46c4ae0f8455f9483682`). Procedure: isolated app; Pets; Cancel then Apply wave-1. Expected: catalog-driven radios for eight ids; cancel unchanged; Apply persists catalog id. Invalidated by PetsView/PetStore/ManagementState.

80. Slice 19 / Done when 2 — each of eight bodies: distinct idle/listening/speaking; Reduce Motion; developer `raster` per id (corner alpha 0, gap alpha 0, unique opaque > 0); click-through corners and interior gap; drag visible pixels; panel non-key/non-main always-on-top. Requires declared Mac. Automated: Linux raster uniqueness only. Invalidated by MascotView/PetRaster/replaceBody.

81. Slice 19 / Done when 3 — restart restores last saved id (including a wave-1 id) with the same companion UUID, home, memory revision, Models route, Voice mute/locale, plugin snapshot, connection snapshot, and skill snapshot; `runtimePID` / `sessionId` unchanged across pet Apply if an engine is attached. Requires declared Mac. Automated: Linux sibling isolation only. Invalidated by PetStore/applyPets/prepareModels/home identity.

82. Slice 19 / Tests 4 native — compile NativeChecks including wave-1 PetStore / ManagementState assertions. Requires macOS SDK. Linux: missing-platform. Procedure: `desktop/scripts/test-native.sh` and `desktop/scripts/build-macos.sh`. Invalidated by PetStore.swift / PetsView / MascotView / ManagementState / test-native.sh list.

83. Slice 19 / Tests 2 — prepared pin-runtime initialize is not a new 19 resource while overlay/admission stay untouched. Existing missing-external-resource initialize backlog remains. Requires pnpm 11.7.0 and prepared `.wisp-spike.json`. Invalidated by overlay composer, `classifyInsert`, `wisp.inventory`, or product-sdk admission.

84. Shared 13 retest after 19 — Settings → Pets still selects orb, fox, and robot; Cancel still zero snapshot / zero silhouette change; developer `raster` for those three ids still reports corner alpha 0, existing gap samples alpha 0, and unique opaque > 0; click-through; pet Apply must not restart the engine. Requires declared Mac. Do not treat 13 as accepted. Invalidated by PetStore, PetsView, MascotView, `replaceBody` / `applyPets` / `prepareModels`.

85. Shared 07 retest after 19 — shortcut/Wake, no auto-listen after pet Apply (including wave-1), mute preserved, new body tracks listening/speaking, pending-approval speech suppression, no grant/reply revival, no orphan. Requires declared Mac. Do not spend DeepSeek 0/1. Do not treat 07 as accepted. Invalidated by CompanionController body-swap / `replaceBody` / `render` / `applyPets`, MascotView, EngineBridge, VoiceLifecycle.

86. Slice 19.x-catalog remainder — further official Wisp-authored programmatic bodies toward the eventual around-twenty collection remain unavailable. Invalidated if 19 later adds selectable ids beyond the eight (that would be a contract change).

87. Slice 17.x-skins obligation after 19 — Windows drawings of non-orb catalog ids remain Out; `desktop/windows/**` tree `271c0570446ffaf3a2e7dffcd96fc6cf9595a131`. Invalidated if 19 or a later 17 edit draws non-orb ids on Windows.

88. Slice 19 protocol non-touch — overlay, `product-sdk.ts`, `permission-protocol.mjs`, `ax-actions.mjs`, `visual-actions.mjs`, and `desktop/windows/**` remain unchanged vs 19 Building dispatch `06f0079419db7d50879e931499f69171baf2c14b`. 10/11/12/15/16 retest is not required unless those seams later change. Invalidated by edits to those paths.
