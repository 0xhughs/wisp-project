# BUILD — active contract

Slice: 12 Reusable skills for the same Wisp
Archive: (none; not shipped)

## Goal

Install or learn reusable behaviors on the existing identity.

Wisp remains one persistent desktop AI companion. Skills are reusable behaviors of that same Wisp, never a second assistant, never a second companion UUID, and never a pet-specific agent. Settings → Skills becomes working management of a closed, Wisp-authored catalog backed by the pinned DeepSeek Harness skill registry (`ctx.skills` / `@deepseek-ai/dsh-skill`) and the stock model-facing `skill` tool (`@deepseek-ai/dsh-tool-skill`). Enabling the demonstration skill does not grant tool permission. Subsequent tool calls, including those a skill’s instructions describe, still use the accepted 06 native Allow Once / Deny / Cancel Request gate. Internal sub-agents stay the same Wisp identity with inherited permission constraints; they are not a second user-facing identity.

The contracted demonstration is one in-repo SKILL.md that tells the same Wisp to call `wisp_tell_time` once. It does not require Calendar, attendees, documents, Google Drive, Notion, or any named SaaS connector. Parked 07, 09, 10, 11, and 13 are unaccepted: record retest obligations below; do not treat voice, Plugins GUI, MCP GUI, live Ollama, NativeChecks, or pet Apply as working.

## Done when

1. **Working Skills surface; closed catalog; honest unavailable rows.** Settings → Skills is a working management section, not the 03 placeholder that reports “Skill management is unavailable. This build has not queried installed or learned behaviors.” The closed catalog lists exactly one selectable Wisp-authored skill, plus explicit unsupported rows that cannot be enabled. Truthful status among at least: not installed, saved, applying, active, incompatible, unavailable:

   - `wisp-local-time-briefing` — “Local time briefing”. Wisp-authored in-repo skill. Instructs the same Wisp to call the already-admitted Direct tool `wisp_tell_time` exactly once and to wait for Wisp confirmation. Harmless clock read only.

   Unsupported rows, not enableable (copy may vary; ids are closed):

   - `meeting-prep-bundle` — Meeting preparation (calendar, attendees, documents, summarize) remains an illustrative example, not a shipping service bundle.
   - `skill-marketplace` — Named marketplaces, `dsh` skill install, npm/git skill packs, and `dsh-skill-badge` stay unavailable. No empty-list implication that a marketplace of skills was queried.
   - `ambient-skill-folders` — Project `.dsh/skills`, user `~/.dsh/skills`, `~/.agents/skills`, and arbitrary folders stay unavailable. Stock `skill-filesystem` stays disabled so this build does not scan those roots.
   - `learned-user-authored` — Learning or authoring a new skill from conversation, a skill editor, or a slash-command composer stays unavailable.
   - `skill-plugin` — Cordis skill plugins remain unavailable in Settings → Plugins; skill management is this Skills page.
   - `general-subagents` — Stock `tool-subagent`, `tool-subagent-fork`, `tool-subagent-control`, and `tool-subagent-list-agents` stay disabled. Internal delegated consequential child asks remain denied under the 06 `never` policy.

   Keyboard-accessible Enable/Install, Remove/Disable, Apply, and Revert Draft exist only for `wisp-local-time-briefing`. Confirm copy states that this is the same Wisp, that a skill is instructions not a second assistant, and that Enable is not Allow Once. Cancel / Escape / Revert Draft leaves the saved snapshot and overlay unchanged (zero file write of a new enabled snapshot, zero overlay enable of `tool-skill`). Applying the already-saved enabled or disabled state is a no-op. Without a chosen Wisp folder, Apply explains that a folder is required to save skill enablement and does not invent a second identity. No composer, transcript, Harness web/chat UI, `dsh` CLI, `ctx.remote.skills` marketplace list, or `/skill` picker as the Skills surface.

2. **Install uses overlay-and-restart; one reusable skill on the same identity.** Enabling the demonstration persists a versioned Wisp skill snapshot, then reuses the existing owned engine replacement path (`stopReasoning` then `startAttachment`, same generation ownership as Plugins/Connections Apply). The composed product overlay, when enabled, does two pin-supported things and no others:

   - **Id-patch (not a new insert):** set stock row `tool-skill` (`@deepseek-ai/dsh-tool-skill`) to `disabled: false`. Pin `applyEntryPatches` (`vendor/include/src/index.ts`) applies later same-id patches onto the existing base row. This is not `classifyInsert` of a second `tool-skill`. `DISABLED_STOCK_IDS` still rejects inserting `tool-skill` / `skill-filesystem` / `tool-subagent*` as new plugins.
   - **Covered insert:** one Wisp-owned plugin (suggested id `wisp-skill-register`) that `inject: ['skills']` and during `apply()` reads the covered in-repo SKILL.md and calls pin `ctx.skills.register({ name, description, content, source, invocation })` (`packages/skill/skill/src/index.ts` `SkillRegistry.register`). Name is kebab-case `wisp-local-time-briefing` (`isSkillName`). Invocation is `{ modelInvocable: true, userInvocable: false }` so the slash-command `/name` user-message gesture is not a Wisp UI. Source is `'bundled'` (prompt-visible origin for Wisp-authored covered content; not `dsh-skill-badge`).

   Stock `skill-filesystem` stays **disabled** (`includeDefaultRoots` never true here). This slice does not discover project, user, or marketplace skills. The `skill` registry plugin (`id: skill`) remains enabled as today so `ctx.skills` exists.

   After `initialize`, `wisp.inventory` reports a skills array: when enabled, one entry with catalog id, skill name, revision, contributed tool name `skill`, and a nonsecret config digest; when disabled, `skills: []` and tool name `skill` is absent. Native status matches that snapshot. Disabling removes the insert and the `tool-skill` enable patch, restarts, and `skill` is absent. Failed start leaves an honest unavailable engine with the saved snapshot retained. Identity, selected home, durable memory, Models route, Voice settings, plugin snapshot, connection snapshot, and pet catalog id survive Skills Apply.

3. **06 gate on skill load and on the subsequent Direct tool; install is not a grant.** The stock `skill` tool is a real registry tool (`packages/skill/tool-skill/src/index.ts` `defineTool({ name: 'skill', ...})`). Wisp binds the **actual registered** ToolDefinition object after `loader.await()` and before `seal()`, same-object wrap so `consume()` runs immediately before the pin execute returns instruction markdown (MCP wrap pattern; do not fork a second loader). Source id is the closed origin `wisp-skill` (Skill route in the 06 table; not Direct, not a 10 plugin, not MCP, not stock shell). Native confirmation for `skill` shows a trusted label, operation `load-skill-instructions`, exact skill name as destination, and that loading instructions does not run other tools. Controls remain Allow Once, Deny, and Cancel Request; initial focus Cancel Request; no Allow Always.

   **Zero** skill-body delivery (and **zero** `wisp_tell_time` clock reads) before approval of that `skill` call and after deny, cancel, Escape/close, timeout, stale generation, or missing grant. One scoped Allow Once yields **one** pin `skill` execute for name `wisp-local-time-briefing` and returns instruction content only. That grant is not permission to call `wisp_tell_time`. A later `wisp_tell_time` is a new Direct call (source `wisp-safe-action`, operation `read-local-clock`) and still 0/0/0/1 on its own. Skill instructions, persona text, and the engine’s `<available_skills>` catalog message cannot authorize an effect. A spoken or typed “yes”, saved key, plugin install, connection save, pet Apply, memory instruction, or skill Enable is not a grant.

   Settings → Permissions lists `skill` as Ask-each-time when the demonstration is mounted, otherwise skill invocation unavailable; `wisp_tell_time` remains Ask-each-time whenever 09 sources load. Meeting-prep, Calendar, named SaaS, Accessibility (15), visual click (16), Windows (17), and stock shell/fs/web stay unavailable.

4. **Same Wisp; sub-agents inherit constraints; pet remains a visual body.** After confirmed skill Enable/Disable, and again after ordinary Quit and relaunch:

   - Exactly one companion UUID and the same chosen Wisp home.
   - Durable memory bytes/revision unchanged by the skill snapshot write (sibling store, not a memory entry).
   - Models route, Voice settings, plugin snapshot, connection snapshot, and pet catalog id unchanged.
   - Skills belong to that same Wisp: Settings → Skills is inventory-backed; Pets copy no longer says skill management is unqueried. Changing the pet (13) remains a visual body swap and must not become a skill identity, a second `companionId`, or a reason to restart the engine.
   - Stock `tool-subagent*` stay disabled. Enabling the demonstration skill must not admit `skill` plus a subagent tool. Existing 06 in-process spawn/fork developer proof (`wisp/verification.child`) still records `approvalPolicy: never`, no parent-grant transfer, and parent cancel settling child work when the skill overlay is on (developer fixtures). Consequential child asks remain rejected. Internal children are not a second user-facing companion.

5. **Product invariants and later-slice boundaries.** Transparent-region click-through, body movement, Settings close/reopen, menu navigation, General Show Companion, and Quit remain. The mascot does not become key/main. No chat window, prompt composer, conversation history, or Harness UI. Models remains the sole owner of reasoning keys. 09 URL/file/time stay Direct (`wisp-safe-action`); 10 demonstration plugin and 11 demonstration MCP stay on their existing gates when those parked routes are loaded; stock `tool-bash` / `tool-fs` / `tool-web` stay disabled. Slice 14 release, 15–17 computer control, 18 wake-word, 19 skins, 20 proactivity, and 21 remote are not implemented. Open decisions (18/20/21) stay unresolved. **Retest 07** after CompanionController Apply/lifecycle / `startAttachment` / EngineBridge / VoiceLifecycle / permission-allowlist edits. **Retest 09** if permission-protocol, PermissionState, SafeActionOpener, or Direct admission change. **Retest 10** overlay/inventory and **11** MCP admission because overlay composition, `classifyInsert`, `wisp.inventory`, and `startAttachment` snapshot attach will change. Do not treat 07–11 or 13 Done when as satisfied. Do not spend the reserved DeepSeek greeting.

6. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS catalog, snapshot-schema, overlay composition, permission-protocol, and skill-register tests pass on this host. Native Swift sources may be written on Linux but remain **uncompiled/unverified** here. Actual macOS Settings/keyboard Skills, NativeChecks compile, live local Ollama skill-then-time 0/0/0/1, audible confirmation, and 07 shortcut/mic/TTS retest are Mac/human backlog items, not Linux passes. Isolated pin-runtime initialize remains **missing-external-resource** until a prepared `.wisp-spike.json` product runtime exists (none found under `$HOME` in this dispatch). This host’s nvm `pnpm` is 11.7.0; that does not by itself create a prepared runtime. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07–13 Shipped.

## Out

- Separate assistants, a second companion UUID, pet-specific skills, or treating an internal sub-agent as a second user-facing identity.
- A mandatory meeting-integration bundle (Calendar + attendees + documents, Google Drive, Notion, or “summarize the meeting”).
- Enabling stock `skill-filesystem` with default roots, scanning `~/.dsh/skills` / `.agents/skills` / project skills, `dsh-skill-badge`, or a marketplace-queried empty list.
- Enabling stock `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-fs-search`, `tool-web`, `web-fetch-http`, `web-search-deepseek`, jobs, workflows, goals, or general `tool-subagent*`.
- Allow Always, spoken-yes grants, treating skill Enable / plugin install / connection save / pet Apply / saved key as Allow Once.
- Chat composer, transcript UI, Harness web UI, `ui-skill`, `dsh` CLI, or `ctx.remote.skills` / `SessionSkillCatalog` as the Skills surface.
- A skill-authoring editor or “learn from this conversation” composer (learned/user-authored row stays unavailable).
- Voice-loop acceptance (07), hardware onboarding acceptance (08), safe-action acceptance (09), plugin-management acceptance (10), Connections/MCP acceptance (11), pets acceptance (13), release (14), Accessibility (15), visual click (16), Windows (17), wake-word (18), proactivity behavior (20), remote doorways (21).
- Resolving SLICES Open decisions (18/20/21). Inventing numeric performance targets or GB/VRAM cutoffs.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Editing accepted `spike/`, slice archives 01–06, or writing `slices/07-*.md` through `slices/13-*.md`.
- Inventing stock SDK skill list/install/remove RPCs (dispatch remains initialize / `session/prompt` / shutdown). Calling Harness web settings controllers.
- Disabling permission, privacy, credential, cancellation, or release safeguards to make tests pass.

## Constraints

**Chosen demonstration (closed; this is the contract choice).** SLICES example “meeting preparation checks calendar, researches attendees, retrieves relevant documents, summarizes and speaks” is illustrative. Open decision: “Meeting preparation is an illustrative skill, not a mandatory service bundle.” This slice ships **one** Wisp-authored skill:

| Catalog id (closed enum) | Title | Pin load path | Subsequent admitted tool | Default |
|---|---|---|---|---|
| `wisp-local-time-briefing` | Local time briefing | Covered `SKILL.md` registered with `ctx.skills.register()`; model loads it via stock tool `skill` after `tool-skill` is enabled | `wisp_tell_time` (09 Direct, source `wisp-safe-action`) | Not installed (`enabled: false`) |

Skill body (normative intent; exact markdown is an implementation choice, must stay in-repo and covered): you are the same Wisp; for a local-time briefing call `wisp_tell_time` exactly once; do not open URLs or files; do not spawn sub-agents; do not call plugin or MCP tools; wait for Wisp confirmation; never retry denied or cancelled actions.

Rights: Wisp-authored in-repo markdown. No third-party skill pack, no download, no spend.

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Inspected pin dispatch (`packages/sdk/server/src/server.ts` `handleRequest`) remains initialize / `session/prompt` / shutdown. Skill lifecycle is **not** a stock SDK method. Do not call Harness web settings controllers or `ctx.sessionSkillCatalog` / `ctx.remote.skills` as a Wisp UI.

**Verified skill seam (do not invent APIs).** Inspected pin facts at `d347e703908d0406b7a7ef80e3a0e594d86b2215`:

- `docs/subsystems/skills.md` and `packages/skill/skill/src/index.ts`: `ctx.skills` is host+per-scope `SkillRegistry`. `registerProvider`, `register`, `list`, `snapshot`, `get`. Runtime `register()` accepts `SkillRegistration` (name kebab-case, nonempty description, `content`, `source`; optional `invocation` / `provider`). Default invocation if omitted would be both model and user invocable — this slice **must pass** `{ modelInvocable: true, userInvocable: false }`. Default provider is `'runtime'`. `get()` is not cached; it rereads the winning provider. Runtime `get()` returns the registered definition (locator).
- `packages/skill/tool-skill/src/index.ts`: consumer plugin `tool-skill`, `inject: ['agents','tools','skills']`. Registers tool name `skill` with parameter `name`. Execute lists, requires `isModelInvocable`, then `ctx.skills.get`, returns `{ name, provider, resourceBase?, content }` and renders `<skill_content>`. Catalog injects durable `<available_skills>` into **session history** (not World State, not a Wisp transcript UI). `/name` user-message injection is only for `isUserInvocable` skills; this demo sets user-invocable false.
- `packages/skill/skill-filesystem/src/index.ts`: local provider ranks include project `.dsh/skills`, `.agents/skills`, `customSkillDirs`, user DSH/agents homes, and `bundledSkillDir`. `includeDefaultRoots` default **true**. `watch` default **true**. With `includeDefaultRoots: false`, project and user roots are omitted; `bundledSkillDir` still mounts if set. **This slice leaves `skill-filesystem` disabled** so those roots are not queried. Closed catalog is Wisp’s Settings list plus `register()` of one covered skill, not a filesystem crawl.
- `packages/bundle/base/cordis.patch.yml`: `skill` registry enabled; `skill-filesystem` and `tool-skill` present; `skill-badge` already disabled. Product `desktop/engine/product.patch.yml` currently disables `tool-skill` and `skill-filesystem`.
- Overlay enable of an existing disabled row is pin-supported: `applyEntryPatches` copies `disabled` / `config` onto the targeted id (`vendor/include/src/index.ts`). Architecture: a `--patch` overlay is applied in the same flattened patch list as bundle layers (`docs/architecture.md`). SDK `patchReload: startup`; HMR stays disabled. Enable is Apply/restart, not live `loader.create`.
- Stock SDK has no skill install RPC. `SessionSkillCatalog.list` (`packages/api/session-controller/src/skill-catalog.ts`) is a Remote for user-invocable skills of a Session; it is not Wisp Settings.

Therefore slice 12 wraps **overlay enable of stock `tool-skill` + covered `ctx.skills.register()` of one SKILL.md + Wisp admission of the actual `skill` tool**. It does not claim `dsh` skill add, skill-filesystem discovery, or a marketplace.

**06 gate (do not weaken).** Native Allow Once / Deny / Cancel Request remain the only action gate for skill-orchestrated and sub-agent tool calls. Skill Enable is not a grant. Loading skill markdown is not a grant for `wisp_tell_time`. Parent grants do not transfer to children. Child `approvalPolicy: never` unchanged. Sending, deleting, purchasing, and privileged ops still confirm; this demo includes none of those. Wrap stock `skill` execute with `consume()` on the same object before content is returned (11 `wrapMcpExecute` pattern). Extra unadmitted tools still fail initialize (`WISP_INVENTORY`). Expand `Admission` source union with `'wisp-skill'`. Expand `permission-protocol.mjs` and native `PermissionState` for tool name `skill`, source `wisp-skill`, operation `load-skill-instructions`, arguments exactly `{name}` matching `^wisp-local-time-briefing$`.

**Unaccepted 07 (record, do not assume).** Historical `07-review-060` HUMAN_REQUIRED is unchanged. Voice is the intended user path but is not accepted. 12 must not add a text composer. Committed assistant text remains the only speakable payload. Pending native approval still maps to voice phase `approval`. Skill catalog session messages must not be treated as speakable voice-result text. Skills Apply uses `stopReasoning` / `startAttachment` (unlike pet Apply). **07 retest** after those CompanionController / EngineBridge / VoiceLifecycle / permission-protocol edits: shortcut/Wake, no auto-listen after skill Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend the reserved DeepSeek spoken greeting. Linux must not claim audible proof.

**Parked 09 (required by this demo; do not assume working).** Subsequent effect is `wisp_tell_time`. 09-review-073 IMPLEMENTATION_READY, not Shipped. Do not treat NSWorkspace, live Ollama, or NativeChecks as passed. If 12 edits permission allowlists, PermissionState, or Direct admission, record 09 retest. Default skill-disabled inventory must still include the three 09 Direct names when 09 sources load and must still exclude `skill`.

**Parked 10 and 11 (overlay will change; do not assume working).** 10-review-065 and 11-review-077 IMPLEMENTATION_READY, not Shipped. Demo does **not** require the 10 plugin tool or 11 MCP tool to be enabled. Still **retest 10 overlay/inventory and 11 MCP** because `composeOverlay`, `classifyInsert` COVERED/INJECT, `wisp.inventory`, body-bridge env (`WISP_SKILL_SNAPSHOT`), and `startAttachment` staging will change. Default (skill disabled) must keep 10/11 tests green: no demo plugin tool unless enabled; no `mcp__` names unless connection enabled; no `skill` tool; hostile extra unadmitted tools still fail initialize; `skill-plugin` Plugins row stays not enableable. Update that row’s detail from “until slice 12” to “Skills are managed in Settings → Skills; Cordis skill plugins stay unavailable.”

**Parked 13 (visual body, not a skill identity).** 13-review-081 IMPLEMENTATION_READY, not Shipped. Pet Apply must still not call `stopReasoning` / `startAttachment`. Skill snapshot is a sibling store; pet write must not modify it. Update Pets/ManagementState copy so skills persist as the same Wisp (the 13 line “this build has not queried” becomes false after 12). That copy change invalidates 13 ManagementStateTests “skills still has not queried” only; it is not a 13 raster/click-through obligation unless `MascotView` / `replaceBody` change (they must not).

**Accepted 03/04/05/06 surfaces.** Skills becomes inventory-backed like Plugins/Connections. Proactivity stays “no configured behavior.” Durable identity/home remain 04’s store. Models remains the sole owner of reasoning keys.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host authors JS catalog/schema/overlay/protocol tests and may author native Swift sources. Linux checks do not establish macOS Settings, AppKit, shortcut, microphone, or audible behavior. Mocks, doubles, and source inspection are supplemental. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not mark 07–11 or 13 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Confirmation scope.** Enabling a skill is not sending, deleting, purchasing, or a privileged tool. Still require a scoped Enable confirmation so Cancel is observable (Plugins Enable/Remove pattern, with engine restart). Copy must not call the skill a new companion. Material enabled-bit change confirms again; no-op Apply does not. Each later `skill` tool call and each `wisp_tell_time` still asks.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- `desktop/engine/skill-config.mjs` — closed catalog id, JSON schema, default disabled, catalog rows including unsupported classes, inventory helper.
- Covered skill fixture `desktop/engine/skills/wisp-local-time-briefing/SKILL.md` (or equivalent leaf) copied by `prepare-product.mjs`.
- `desktop/engine/skill-register.ts` (or similar) — `ctx.skills.register()` of that body; inject `['skills']`.
- `desktop/engine/skill-wrap.mjs` — same-object `consume()` wrap of stock `skill` execute.
- Evolve `plugin-overlay.mjs` `composeOverlay` with a `skill=` parameter; id-patch `tool-skill` disabled false when enabled; insert the register plugin; `extraInserts` still empty.
- Evolve `product-sdk.ts` inventory payload, `WISP_SKILL_SNAPSHOT`, admit/wrap `skill` after `loader.await()` when enabled, seal.
- Evolve `body-bridge.mjs` and `CompanionController.startAttachment` to stage the skill snapshot like plugins/connections.
- `desktop/macos/Sources/WispBody/SkillStore.swift`, `SkillsView.swift`; evolve `ManagementState.swift` Skills copy, `SettingsWindowController.swift` wiring, `PermissionState.swift` `skill` / `wisp-skill` case, Permissions copy.
- `desktop/macos/Tests/WispBodyTests/SkillStoreTests.swift` (and ManagementState Skills assertions); `desktop/scripts/test-native.sh` lists the new Swift sources.
- `desktop/tests/skill-config.test.mjs`; extend `tools/linux-js-tests.sh`.
- `docs/skills.md`; update `docs/management-shell.md`, `docs/permissions.md`, `docs/engine-capabilities.md` Skills row, `docs/pets.md` same-Wisp skills line, Plugins `skill-plugin` detail. Sanitized `evidence/12-skills.md` / JSON at implementation.

## Data / state impact

New durable state is a versioned, bounded, owner-only skill snapshot under existing application-support (same descriptor-relative, no-follow, revision, directory-lock pattern as plugins/connections). Suggested leaf: `skills/config.json` (name is a choice). Schema is closed:

```json
{"version":1,"catalogId":"wisp-local-time-briefing","enabled":false}
```

`catalogId` must be exactly `wisp-local-time-briefing`. `enabled` is a JSON boolean. Unknown version, unknown keys, oversize (>4096), empty id, `meeting-prep-bundle`, marketplace ids, `tool-bash`, and empty catalogId fail closed. Default when the file is missing: disabled demonstration id. Invalid file does not migrate silently to enabled and does not create a new companion UUID; report restore-the-file and keep last-good in-memory without writing memory.json.

Pending Enable drafts are process memory until Apply. Restart restores the last saved snapshot, not in-flight drafts. First launch with a home and no file writes the default disabled snapshot on first successful SkillStore load (create-on-load like Voice/Plugins), not on every render.

Skill snapshot stores catalog id, enabled, version — not SKILL.md bytes as identity, not UUID, not home path, not secrets. Diagnostics may show the nonsecret catalog id, title, and enabled/active. Overlay YAML, `memory.json`, plugin notes, connection env, argv, and Keychain contents are not valid places for a second identity key. Launch may pass `WISP_SKILL_SNAPSHOT` (nonsecret JSON, same spirit as `WISP_PLUGIN_SNAPSHOT`).

Use fresh `$HOME/wisp-work/wisp-12/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07/08/09/10/11/13 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, durable memory, Models route, Voice settings, plugin snapshot, connection snapshot, and pet catalog id survive 12 skill use. Enabling a skill does not write `memory.json` and does not inspect keys.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed catalog, SKILL.md, JS schema (Linux).** Add `skill-config.mjs` and the in-repo SKILL.md. Unit-test: unknown version/keys/oversize/meeting-prep/marketplace/`tool-bash` throw; default disabled; rows mark only `wisp-local-time-briefing` `canManage`; unsupported rows cannot enable; sibling isolation: writing a skill snapshot in a temp support tree leaves fixture `memory.json`, reasoning, voice, plugins, connections, and pets bytes unchanged. Parse SKILL.md name/description. Do not HTTP. Do not fetch packs.

2. **Overlay composition + register insert + skill wrap (Linux).** Extend `composeOverlay` with `skill=` (disabled: no `tool-skill` enable patch, no register insert; enabled: id-patch `tool-skill` disabled false plus covered register insert). `classifyInsert` still rejects `DISABLED_STOCK_IDS` including `tool-skill` and `skill-filesystem` as inserts; allow the new register id with inject `['skills']` only. `extraInserts` remains empty. Wrap helper: same-object execute wrap calling `consume()` then original execute. product-sdk: when snapshot enabled, after `loader.await()`, require `ctx.tools.get('skill')`, wrap, admit source `wisp-skill`, then seal; when disabled, `skill` must be absent. Inventory payload gains `skills`. Extend permission-protocol. Do not enable `skill-filesystem` or `tool-subagent*`.

3. **Native store + SkillsView + shell copy (sources on Linux, uncompiled here).** `SkillStore` persist/reload/conflict like `PluginStore`. `SkillsView` lists the closed catalog; keyboard traversal; confirm vs cancel; Revert Draft; Apply; unsupported rows not enableable. `ManagementState` Skills copy becomes inventory-backed (demonstration title + “same Wisp” + marketplace not queried). Permissions copy: `skill` Ask-each-time when mounted. Pets copy: skills persist; same Wisp. Diagnostics mentions nonsecret skill id/status and omits secrets. `applySkills` follows `applyPlugins` (`stopReasoning` / `startAttachment`). `startAttachment` stages the skill snapshot. Mark NativeChecks uncompiled on Linux.

4. **Docs, 07/09/10/11 regressions, identities.** Add `docs/skills.md`. Update management-shell / permissions / engine-capabilities / pets / plugins skill-plugin detail. Keep 06/09/10/11 protocol tests green when the demonstration is disabled. Recheck voice-seams analogue if Apply/lifecycle facts change. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac Settings / NativeChecks / live Ollama / 07–11 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames above are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with `desktop/tests/skill-config.test.mjs` covering: closed enum `wisp-local-time-briefing`; default `enabled: false`; unknown version, extra keys, oversize, empty id, `meeting-prep-bundle`, marketplace ids, `tool-bash` rejected; catalog rows: one selectable + unsupported meeting-prep, marketplace, ambient folders, learned/user-authored, skill-plugin, general-subagents; `canManage` false for unsupported; SKILL.md name is kebab-case and user-invocable false; writing `skills/config.json` in a temporary support tree does not modify sibling fixture bytes for memory, reasoning, voice, plugins, connections, or pets; `composeOverlay` default keeps `tool-skill` disabled and does not insert the register plugin and does not mention `wisp-local-time-briefing` as an enabled insert; enabled composition contains an id-patch `tool-skill` with `disabled: false` and one register insert; `classifyInsert` still throws for `tool-skill` / `skill-filesystem` / `tool-subagent` inserts and `extraInserts`; permission-protocol accepts `skill` / `wisp-skill` / `load-skill-instructions` / `{name:'wisp-local-time-briefing'}` and rejects other names and extra keys; inventory helper: disabled ⇒ no `skill` tool and empty skills array; enabled requires `skill` present. Label results Linux-supplemental. They cannot satisfy Mac Settings GUI or live model Done when items.

2. **Isolated product runtime (missing-external-resource here).** `desktop/tests/skill-overlay-runtime.mjs --runtime-root … --scratch …` when a prepared `.wisp-spike.json` exists: default initialize inventory excludes `skill`; enabled includes `skill` and the 09 Direct names still present; disable removes `skill`; hostile extra unadmitted tool fails initialize; 10 demo tool still absent unless plugin enabled; `mcp__` names still absent unless connection enabled; `wisp/verification.skill` (or equivalent) 0/0/0/1 on `skill` then independent 0/0/0/1 on `wisp_tell_time`; allow `skill` does not increment a clock canary; developer child verification still `never` with skill overlay on. This host has nvm pnpm 11.7.0 but **no** prepared `.wisp-spike.json`; record missing-external-resource; do not claim 09/10/11/12 initialize passed. No cloud, no key read, no model download.

3. **07 / 09 / 10 / 11 regression obligations (Linux analogue + Mac backlog).** Existing voice-protocol / voice-seams: skill catalog text and skill names must not enter TTS as if they were assistant replies; pending approval still suppresses speech; stale generation cannot speak. Invalidation: CompanionController `applySkills` / `startAttachment` / EngineBridge / VoiceLifecycle / permission-protocol. Record 07 retest if those sources change. Do not treat 07 as accepted. 09 recording-opener and Direct names remain. 10 overlay/inventory and 11 MCP seal remain when skill is off. Plugin/connection 0/0/0/1 remain; they are not this skill’s demonstration.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains: skill snapshot persist/reload; default disabled; unknown id rejected; confirm-cancel performs zero snapshot change; draft vs saved; Apply while `modelBusy`/`homeBusy`/`ending` refused; unsupported rows not enableable; ManagementState Skills copy names local time briefing, states the companion remains the same Wisp, does not say “has not queried”, and does not imply a marketplace; Pets copy says skills persist / same Wisp; Permissions copy lists `skill` Ask-each-time when mounted; `PermissionRequest` accepts `skill` / `wisp-skill` and still accepts `wisp_tell_time`. `desktop/scripts/build-macos.sh` remains Mac-only here.

5. **Mac GUI / live (verification backlog, not Linux proof).** On the declared Mac, isolated home: Settings → Skills; keyboard traversal; confirm vs cancel (cancel: zero snapshot write, zero overlay enable); Enable, Apply, relaunch, Remove. Native Allow Once / Deny / Cancel for `skill` then for `wisp_tell_time`; exact skill name visible; deny/cancel zero clock effect; Allow Once on `skill` does not read the clock; Allow Once on `wisp_tell_time` is one clock read. Restart restores enabled/disabled with the **same** companion UUID, home path, memory revision, Models route, Voice mute/locale, plugin snapshot, connection snapshot, and pet catalog id. Skills Apply restarts the engine (new `runtimePID` / `sessionId` is expected, unlike pet Apply). Then **07 retest**: shortcut/Wake, no auto-listen after skill Apply, mute preserved, pending-approval speech suppression, no orphan. NativeChecks pass. Do not spend DeepSeek 0/1.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, `connection-config`, `pet-config`, hardware/ollama inspect, voice-protocol/seams, safe-actions, and spike client tests remain applicable. Pristine pin, byte-identical spike and archives 01–06. No 07, 08, 09, 10, 11, or 13 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
## Proof
12-build-084 Building complete. Product HEAD bef1bdd8d452adc4fd6abfc6e710d45e89bc7fcf. Candidate 35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416 (238 files). Contract unchanged 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b. Linux-supplemental 151/151 claimed. Native Swift uncompiled. Not 12 acceptance. Slices 07–11 and 13 remain implemented with verification pending; historical 07-review-060 HUMAN_REQUIRED unchanged; 08-review-069, 09-review-073, 10-review-065, 11-review-077 and 13-review-081 IMPLEMENTATION_READY unchanged; no `slices/07-*.md` through `slices/13-*.md`.

Builder 12-build-084 (worker bc-775532ea-072b-599a-9f04-2e81dc80d502) implemented closed catalog wisp-local-time-briefing, overlay id-patch of tool-skill plus covered register insert, same-object skill wrap, applySkills overlay-and-restart, SkillsView, docs/skills.md, evidence/12-skills.md. Handback $HOME/wisp-work/loop-state/12-build-084.md. Claims only until independent review.

12-plan-083 APPROVE_PLAN consumed. Baseline 75126a52b07b7dca7fe9e5acc3d3c4cc1b1a18f615adad3faef1f0827f3f91e3 (226 files). Not 12 acceptance.

Coordinator persisted Builder 12-draft-082 Proposed contract (worker bc-b4ad70b8-fb17-5c65-b7c0-69423d82cee1). No application code in the proposal commits.

## Review
Pending independent implementation review 12-review-085 of candidate 35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416. Not consumed.

12-plan-083 APPROVE_PLAN — independent reviewer bc-3d9e519e-ec0a-5342-a0e2-cceec80bbd93. Contract 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b and candidate 75126a52b07b7dca7fe9e5acc3d3c4cc1b1a18f615adad3faef1f0827f3f91e3 match before/after (226 files). Not implementation approval. Counters 0/0. Full verbatim $HOME/wisp-work/loop-state/12-plan-083.md. Consumed.

12-draft-082 Builder draft-proposal complete (bc-b4ad70b8-fb17-5c65-b7c0-69423d82cee1). Handback $HOME/wisp-work/loop-state/12-draft-082.md. Not plan approval. Consumed.

13-review-081 IMPLEMENTATION_READY — independent reviewer bc-c6ed81fc-4c5a-5699-8ea5-8bdec600c62d. Contract 10a33ba06c391c205ddbf579b33f2a6ccd1e3226a88b46f9fbdaa5be5d0c6d91. Linux 136/136 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

loop-plan-061 APPROVE_PLAN — independent reviewer bc-d950b4e9-45b7-5209-ba88-2af0e6247466. Amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. Consumed.

## Loop state
Tool adapter: Cursor Task generalPurpose subagent; coordinator persists dispatch ID then launches; waits for confirmed completion; Reviewer context is independent of Builder reasoning. One active worker per checkout. This Linux host cannot actuate macOS CUA; Mac physical tests remain participant-gated.
Coordinator: cursor-cloud bc-81f7c99b-f70d-4a0a-83e5-180597760926
Worker / role / phase: none (pending launch) / Reviewer / Ready for review
Dispatch ID / launch state / input identity: 12-review-085 / pending launch / approved contract 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b; implementation candidate 35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416 (238 files); baseline 75126a52b07b7dca7fe9e5acc3d3c4cc1b1a18f615adad3faef1f0827f3f91e3 (226 files)
Pending result / last consumed dispatch: none / 12-build-084
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 tools/identity.py --repo .` from repository root (replacement of unavailable ../../work/loop-state/identity.py). SHA-256 sorted relative file manifest includes git tracked and non-ignored untracked files, bytes, types, executable bits, symlink targets. Excludes .git, tools/identity.py (hashed only into contract identity), and the WISP_LOOP_STATE store if it lies inside the checkout. BUILD.md and SLICES.md contribute canonicalized bytes: BUILD stops before ## Proof; SLICES omits Run status, Release evidence, Shipped/Now/Later/Implemented-verification-pending placement headings, Implementation ledger and Verification backlog while keeping mapped slice bodies and target membership ordered by slice ID. Contract hashes BUILD through Tests, the Loop-state snapshot capture line, that SLICES canonicalization, full AGENTS/LOOP/BUILDER/REVIEWER, and tools/identity.py bytes. Manifest JSON stored outside coverage at $WISP_LOOP_STATE (default $HOME/wisp-work/loop-state). No other dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source remains an external reference; when present verify `git -C "$WISP_HARNESS" rev-parse HEAD` and porcelain status, default $HOME/wisp-work/deepseek-harness; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Historical identities below are records only and cannot be recomputed on this host. Changing identity.py rules requires plan re-review.
Baseline snapshot: 75126a52b07b7dca7fe9e5acc3d3c4cc1b1a18f615adad3faef1f0827f3f91e3 (226 files; approved 12-plan-083 baseline). Parked 13 implementation candidate 8308bd8c484d25bc89671639477d14005039547b1db8a349e299a00db97ad511 (225 files) retained as record.
Contract identity: 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b (approved 12-plan-083).
Candidate snapshot: 35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416 (238 files; 12-build-084).
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: Linux 151/151 supplemental claimed by Builder; independent Reviewer must reproduce. Remaining: NativeChecks/Mac GUI/live Ollama skill-then-time (missing-platform/human-test); pin-runtime initialize (missing-external-resource); 07/09/10/11 retest. Not 12 Shipped.
Repair awaiting review: false
Review events: 12-build-084 Building complete candidate 35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416 contract 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b; builder bc-775532ea-072b-599a-9f04-2e81dc80d502; not a review verdict. 12-plan-083 APPROVE_PLAN contract 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b candidate 75126a52b07b7dca7fe9e5acc3d3c4cc1b1a18f615adad3faef1f0827f3f91e3; reviewer bc-3d9e519e-ec0a-5342-a0e2-cceec80bbd93; not implementation approval; counters 0/0; verbatim $HOME/wisp-work/loop-state/12-plan-083.md. 12-draft-082 draft-proposal complete builder bc-b4ad70b8-fb17-5c65-b7c0-69423d82cee1; not a review verdict. 13-review-081 IMPLEMENTATION_READY contract 10a33ba06c391c205ddbf579b33f2a6ccd1e3226a88b46f9fbdaa5be5d0c6d91; reviewer bc-c6ed81fc-4c5a-5699-8ea5-8bdec600c62d. loop-plan-061 APPROVE_PLAN amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. 07-review-060 HUMAN_REQUIRED remains the last 07 implementation review (not rewritten). Accepted06 final1/0 archived.
Budget limit / consumed / measurement: no global execution budget. Cloud05 allowance6/6 exhausted and immutable. Separate one-small-agent-cloud-greeting allowance0/1spent, max1024tokens/retry0, requires explicit physicalactivation and ledger reservation beforedispatch. Four user-operated successful connectiontests050 recorded separately, not agent calls. No extra connectiontest/keyinspection/download; local per-scenario modelnoncompliancecap2. Linux host must not consume the reserved cloud greeting.
Blocker / resume status / resume action / recheck condition / deadline: none for 12-review-085. Recheck: independent implementation review. No automatic paid calls/downloads. Counters0/0.
Advance phase: none
Next slice ID / draft: 12 / ready for review

## Status
Ready for review

## Next
Independent implementation review of dispatch 12-review-085. Do not mark 07, 08, 09, 10, 11, 12, or 13 Shipped. Counters 0/0.
