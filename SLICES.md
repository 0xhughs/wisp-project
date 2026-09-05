# Wisp — product map

## Product
Wisp is a local-first desktop AI agent embodied by a small animated mascot. Users speak to it, hear its answers and ask it to perform useful computer actions. DeepSeek Harness supplies the invisible agent capability system; Wisp owns the voice, desktop body, management UI, permissions and durable memory. One identity persists across interchangeable bodies, model changes, installed skills and any future remote entry point.

Current release boundary: full macOS first release, selected by the user. Include slices 01–14: invisible engine integration, desktop body, Wisp Settings/menu bar, local memory, local/cloud reasoning, approvals, shortcut-driven voice, hardware-aware Ollama onboarding, initial safe actions, compatible plugins/Connections/MCP/skills, interchangeable starter pets and integrated macOS readiness. Later capabilities explicitly described as subsequent work remain outside this release.

## Users
People who want a spoken desktop companion without a chat application. Normal users manage friendly Connections and local/cloud model choices; advanced users can configure custom MCP servers and compatible engine capabilities.

## Loop target
Selected target: Full macOS first release — slices 01–14. Stop only after each included slice is independently accepted and all macOS release gates pass. Slice 01 is the first milestone, not the loop stopping point. This turn prepares the pack; execution has not been requested or started. After a run is authorized, inside-target Later entries become successive Now slices; outside-target work never starts automatically.

## Run status
Prepared

## Open decisions
- Runtime source is confirmed below. Its Wisp integration, dependency/distribution constraints and approval bridge still require execution evidence; source inspection is not a passed feasibility test.
- Implementation stack, supported OS/hardware floor, speech engines, model catalog and storage formats are deferred to source inspection and their slices. Do not invent numerical performance targets or universal model support.
- Proactivity is a requested Settings area, but triggers and autonomous behavior are unspecified. Define material behavior with the user before implementing proactive actions. Meeting preparation is an illustrative skill, not a mandatory service bundle.

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
Pending finalization; no implementation or review has occurred.
Failed release reviews for this target: 0
Pending release result: none
Release review events / last consumed dispatch: none

## Shipped
- (none)

## Now
### 01 Hidden engine feasibility proof
Goal: establish an evidenced, Wisp-owned boundary to the exact DeepSeek Harness source without exposing its interface.
Provides: a repeatable headless integration spike, capability map, approval round trip and separation contract for later clients.
Depends on: execution authorization; selected target and upstream source are identified above.
Target membership: inside the selected macOS release target.
Out: product UI, voice, model downloads, production credentials and computer control.

## Later
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

### 14 macOS integrated readiness
Goal: verify a coherent local-first macOS product across slices 01–13.
Provides: end-to-end evidence, Wisp Diagnostics, launch/quit/recovery behavior, no required account or unnecessary telemetry, voice resource headroom and continued ordinary desktop usability.
Depends on: 01–13. Apply the release gates above and document supported macOS hardware/versions and reproducible local installation. External distribution/signing remains a separate decision.
Target membership: inside the selected macOS release target. Out: implied publication, signing credentials, invented performance thresholds or automatic inclusion of every future slice.

### 15 macOS accessibility computer control
Goal: act on applications primarily through structured macOS Accessibility APIs.
Provides: focus/move windows, read focused interfaces, click named controls, type and search the desktop, with visible permission guidance and action-specific approval enforcement.
Depends on: 06, 09. Re-scope into coherent sub-slices before execution if discovery shows multiple substantial independent outcomes.
Target membership: outside the selected macOS release target. Out: silent privilege escalation and visual fallback implementation.

### 16 Visual computer-control fallback
Goal: complete an authorized action when structured accessibility cannot reach a control.
Provides: bounded visual targeting and failure handling tied to the same task, with the same confirmation rules.
Depends on: 15. Use only when structured access is insufficient; verify the actual target before a consequential action.
Target membership: outside the selected macOS release target. Out: replacing structured APIs with visual clicking by default.

### 17 Windows companion
Goal: bring the same Wisp identity and product model to Windows.
Provides: transparent always-on-top body, click-through, global shortcut, tray controls, voice/local-model management and parity for the chosen release; prefer UI Automation for structured control.
Depends on: accepted macOS architecture and an authorized Windows scope. Keep platform differences behind evidenced boundaries.
Target membership: outside the selected macOS release target; subsequent substantial contracts must be split before execution. Out: assuming macOS tests prove Windows behavior.

### 18 Optional voice wake
Goal: optionally wake the existing voice companion by voice.
Provides: explicit opt-in, mute behavior and resource/privacy evidence, once the listening design is agreed.
Depends on: 07 and platform-specific evidence.
Target membership: outside the selected macOS release target; future. Out: making always-listening mandatory.

### 19 Official skin collection
Goal: expand interchangeable bodies to around twenty official skins.
Provides: a coherent catalog with the same required animation states and unchanged agent identity/capabilities.
Depends on: 13. Around twenty is the user's eventual scale, not an exact first-release requirement.
Target membership: outside the selected macOS release target; future. Out: pet-specific assistants or memories.

### 20 Proactivity behavior, scope to be decided
Goal: define and then implement any explicitly chosen proactive behaviors through Wisp Settings.
Provides: a future contract only after triggers, permission scope and interruption behavior are specified by the user.
Depends on: 03, 06, 07 and the required capability slices.
Target membership: outside the selected macOS release target; behavior unspecified. Out: inferring autonomous actions from the Settings section name.

### 21 Optional remote doorway
Goal: later allow a service such as Telegram or WhatsApp to reach the same Wisp.
Provides: a separately authorized access path with the same identity, memory and permission policy; communication-channel details remain undecided.
Depends on: mature local companion and an explicitly scoped remote-access contract.
Target membership: outside the selected macOS release target; much later possibility, not a committed integration.
Out: making remote chat the main product, creating another agent or requiring a chat-history desktop UI.
