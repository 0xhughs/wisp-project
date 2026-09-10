# NOT ACCEPTED — unaccepted slice 13 working contract

This file is **not** an accepted-slice archive. Slice 13 is **not Shipped**.
Do not treat this path as `slices/13-interchangeable-mascot-bodies.md`.

Parked 2026-09-10 after independent **13-review-081 IMPLEMENTATION_READY** (reviewer `bc-c6ed81fc-4c5a-5699-8ea5-8bdec600c62d`). Remaining Mac/runtime/human gaps are backlog only. Historical **07-review-060** remains **HUMAN_REQUIRED**. Linux 13-build-080 seams are implemented with verification pending.

Approved slice-13 contract: `10a33ba06c391c205ddbf579b33f2a6ccd1e3226a88b46f9fbdaa5be5d0c6d91`.
Implementation candidate: `8308bd8c484d25bc89671639477d14005039547b1db8a349e299a00db97ad511` (225 files).
Verbatim reviews: `$HOME/wisp-work/loop-state/13-review-081.md`, `$HOME/wisp-work/loop-state/13-plan-079.md`.

The body below is BUILD Slice through Tests at park time.

---

# BUILD — active contract

Slice: 13 Interchangeable mascot bodies
Archive: (none; not shipped)

## Goal

Change the pet without changing the underlying companion.

Wisp remains one persistent desktop AI companion. The mascot is its interchangeable visual body, never a second agent or an observer of a separate agent. Settings → Pets and the menu-bar Change Pet… action become working selection of a small closed starter catalog, with original programmatic body artwork and the same idle / listening / speaking presentation states as slice 02. One companion UUID, the chosen Wisp home, durable memory, Models route, Voice settings, plugin snapshot, and connection snapshot survive the body change. Skills remain the same Wisp; skill management stays unavailable because slice 12 is unstarted.

Slice 07 is an unaccepted shared lifecycle: record retest after body-swap / CompanionController Apply/lifecycle / VoiceLifecycle / EngineBridge / permission-allowlist edits; do not treat the voice loop as working. Do not spend DeepSeek 0/1. Approximately twenty official skins remain slice 19 and are not this slice.

## Done when

1. **Working Pets surface; closed starter catalog; honest unavailable row.** Settings → Pets is a working management section, not the 03 placeholder that reports “Additional bodies and body selection are unavailable.” Menu Change Pet… still opens that same retained Settings window on Pets. The closed catalog lists exactly three selectable Wisp-authored bodies, in this order, with truthful status among at least: current, saved, applying, unavailable:

   - `wisp-orb` — “Wisp orb” (default). The existing accepted-02 even-odd oval with interior gap (teal idle, amber listening, cyan speaking). Catalog id is a choice only in spelling; this row **is** the current starter drawing in `MascotView.swift`, not a replacement that abandons the proven silhouette.
   - `wisp-fox` — “Fox”. Original programmatic fox silhouette (in-repo `NSBezierPath`, no raster pack).
   - `wisp-robot` — “Robot”. Original programmatic robot silhouette (in-repo `NSBezierPath`, no raster pack).

   One explicit unsupported row, not enableable: `official-skins` — “Additional official skins” / around twenty official skins remain later (slice 19). No empty-list implication that a marketplace, third-party pack, or ~20 skins were queried. Keyboard-accessible selection, Apply Body, Revert Draft, and a scoped confirmation exist only for the three selectable ids. Confirm copy states that this is the same Wisp and that identity, memory, models, voice, plugins, and connections stay the same. Cancel / Escape / Revert Draft leaves the saved snapshot and the on-screen drawing unchanged (zero file write, zero view replacement). Applying the already-saved id is a no-op. Without a chosen Wisp folder, Apply explains that a folder is required to save a body and does not invent a second identity. No composer, transcript, Harness web/chat UI, `dsh` CLI, user-imported skins, or pet-specific chat.

2. **Body assets and animation integration; 02 presentation and click-through preserved.** Each selectable body is original in-repo programmatic vector artwork drawn by AppKit (`NSBezierPath` / even-odd fills), with rights recorded in `docs/pets.md` as Wisp-authored programmatic artwork. No PNG/JPEG/Live2D/Spine/downloaded packs, no network fetch, no spend. Panel size remains 160×160. Each body has genuinely clear pixels in the window corners **and** an interior transparent gap (02 Done when 2 geometry class). Visible silhouette pixels accept native drag. Idle transparent regions pass clicks and scrolls to an underlying application by native alpha hit-testing; no `ignoresMouseEvents` polling, event injection, or Accessibility/Input Monitoring product permission. Always-on-top, nonactivating, non-key/non-main `MascotPanel` rules stay. Each body renders visibly distinct **idle**, **listening**, and **speaking**. Processing, approval, muted, unavailable, starting, and stopped keep the existing 07 color/presentation mapping on whatever body is current so VoiceLifecycle does not need new `BodyPhase` values. Idle has restrained animation; listening and speaking have distinct reactions (orb: existing taller eyes / ticks / mouth; fox and robot: original equivalent reactions, not copies of the orb). Invalid/stale transitions cannot leave a stuck listening/speaking reaction after stop, failure, or view replacement. Pause or dispose animation when the body is hidden/destroyed; honor Reduce Motion. Body change recreates the drawing view inside the **existing** controller-owned panel (same 02 `replaceBody` ownership: one panel, generation bump for the view, no second window). Developer `recreate` recreates the **current** pet, not a silent reset to orb. Developer `raster` reports `catalogId`, corner alpha, interior-gap alpha, and one body-unique opaque sample so the three silhouettes are distinguishable.

3. **Identity, memory, tools, models, connections, and skills persist; pet Apply does not restart the engine.** After a confirmed body change, and again after ordinary Quit and relaunch that restores the saved catalog id:

   - Exactly one companion UUID (`wisp-home.json` / `MemorySnapshot.companionId`) and the same chosen Wisp home path.
   - Durable memory: `memory.json` bytes and revision are unchanged by the pet write (pet snapshot is a sibling store, not a memory entry).
   - Models route (provider/model/selected) and protected reasoning-key references are unchanged.
   - Voice settings (locale, voice identifier, rate, mute) are unchanged; mute is not flipped; speech engines stay independent of the body.
   - Plugin snapshot (catalog id, enabled, note, revision) is unchanged.
   - Connection snapshot (catalog id, enabled, serverName, note, opaque credential id, revision) is unchanged.
   - Skills remain the same Wisp: Settings → Skills still reports that skill management is unavailable and that this build has not queried installed or learned behaviors. Slice 12 is unstarted; do not imply a pet has its own skills or that an inventory was queried.
   - Tools: admitted inventory, overlay YAML, and persona are unchanged. Pet Apply **must not** call `stopReasoning` / `startAttachment`, must not replace the Harness process, and must not change `sessionId` / `runtimePID` when an engine is already attached. Pet id is not a second `companionId`, is not written into overlay YAML, argv, `product.patch.yml` persona, or memory instructions, and is not a permission grant.

   Changing the pet never starts a second agent, never mounts tools, and never grants Allow Once. Connection save / plugin install / spoken yes / memory instruction / pet Apply are not grants.

4. **Product invariants and later-slice boundaries.** Transparent-region click-through, body movement, Settings close/reopen, menu navigation, General Show Companion, and Quit remain. The mascot does not become key/main. No chat window, prompt composer, conversation history, or Harness UI. Models remains the sole owner of reasoning keys. 09 URL/file/time stay Direct; 10 demonstration plugin and 11 demonstration MCP stay on their existing gates when those parked routes are loaded; stock `tool-bash` / `tool-fs` / `tool-web` stay disabled. Slice 12 skills, 14 release, 15–17 computer control, 18 wake-word, 19 skins, 20 proactivity, and 21 remote are not implemented. Open decisions (18/20/21) stay unresolved. **Retest 07** after any edit to CompanionController body-swap / `replaceBody` / `render` / Apply/lifecycle, EngineBridge, VoiceLifecycle, voice-result filtering, or permission allowlists: shortcut/Wake, no auto-listen after pet Apply, mute preserved, listening/speaking reactions map onto the new body, pending-approval speech suppression, no grant/reply revival, no orphan. Do not treat 07, 08, 09, 10, or 11 Done when as satisfied. Do not spend the reserved DeepSeek greeting. **Do not** retest 10 overlay/inventory or 11 MCP admission as a 13 obligation unless overlay composition, `classifyInsert`, `wisp.inventory`, or `startAttachment` snapshot attach actually change (they must not).

5. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS catalog, snapshot-schema, and sibling-file isolation tests pass on this host. Native Swift sources may be written on Linux but remain **uncompiled/unverified** here. Actual macOS Settings/keyboard Pets, NativeChecks compile, per-body raster/click-through, restart persistence of catalog id, live companion UUID / home / engine PID proof, and 07 shortcut/mic/TTS retest are Mac/human backlog items, not Linux passes. Isolated pin-runtime initialize is **not** a new 13 resource if overlay/product-sdk/admission are untouched; existing 09/10/11 missing-external-resource initialize backlog stays recorded and is not claimed passed. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07–11 Shipped.

## Out

- Approximately twenty official skins, a skin marketplace, user-imported image/Live2D packs, purchased/stock art, or treating fox/robot/bird as a license to ship third-party assets (slice 19).
- Bird as a fourth starter in this slice. The contracted set is orb, fox, and robot only.
- A second companion UUID, a second Wisp home, pet-specific memory, pet-specific models, pet-specific plugins/connections, or pet-specific skills.
- Restarting the hidden engine, replacing overlay/persona, or injecting catalog id into Harness as a different agent because the body changed.
- Chat composer, transcript UI, Harness web UI, `dsh` CLI, or a chatbot as the Pets surface.
- Weakening 02 click-through, always-on-top, nonactivating panel, Reduce Motion, or transparent-gap requirements for any catalog body.
- Voice-loop acceptance (07), hardware onboarding acceptance (08), safe-action acceptance (09), plugin-management acceptance (10), Connections/MCP acceptance (11), skills (12), release (14), Accessibility (15), visual click (16), Windows (17), wake-word (18), proactivity behavior (20), remote doorways (21).
- Resolving SLICES Open decisions. Inventing numeric performance targets or GB/VRAM cutoffs.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Editing accepted `spike/`, slice archives 01–06, or writing `slices/07-*.md` through `slices/13-*.md`.
- Enabling stock `tool-bash`, `tool-fs`, `tool-web`, skills, general sub-agents, Allow Always, or disabling permission, privacy, credential, cancellation, or release safeguards to make tests pass.

## Constraints

**Chosen starter assets and rights (closed; this is the contract choice).** Illustrative SLICES copy named fox, robot, and bird; those names are not a shipping quota. This slice ships **three** original Wisp-authored programmatic vector bodies:

| Catalog id (closed enum) | Title | Artwork | Default |
|---|---|---|---|
| `wisp-orb` | Wisp orb | Existing accepted-02 even-odd oval in `MascotView.swift` (teal idle / amber listening / cyan speaking; interior gap). Recorded original Wisp artwork. | Yes (first launch and missing/invalid snapshot) |
| `wisp-fox` | Fox | New original in-repo `NSBezierPath` fox silhouette with idle/listening/speaking reactions and an interior gap. | No |
| `wisp-robot` | Robot | New original in-repo `NSBezierPath` robot silhouette with idle/listening/speaking reactions and an interior gap. | No |

Rights: all three are Wisp-authored programmatic/vector drawings in covered source. No third-party file, no recorded commercial license, no download. `docs/pets.md` states that origin. Bird, additional official skins, and user skins are the unsupported `official-skins` row / slice 19. Do not add raster assets to the candidate to “look finished.”

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Pet selection is a Wisp-native visual concern: **do not** add a pet insert to `composeOverlay`, `product.patch.yml`, `product-sdk.ts` admission, or `prepare-product.mjs` `productFiles` unless a later approved contract says otherwise. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Do not call Harness web settings controllers. Do not enable disabled overlay rows.

**Visual body, not a second agent.** `CompanionController.identity` (per-launch controller id) and durable `companionId` stay independent of catalog id. `replaceBody()` already recreates `MascotView` inside one `MascotPanel` while retaining the controller, bridge, and session (accepted 02). Pet Apply extends that path with a `PetId` / catalog id argument; it does not allocate a second panel, second `EngineBridge`, or second home. `render()` continues to map `VoiceLifecycle` / `BodyPhase` onto the current view so a swap during listening/speaking shows the new body’s matching reaction rather than stuck orb frames. Developer `sequence` / `listen` / `speak` / `interrupt` remain labeled simulated presentation when 07 is not driving live voice.

**Do not use the plugin/connection Apply path.** `applyPlugins` / `applyConnections` / `applyModels` call `stopReasoning` then `startAttachment`. Pet Apply follows the Voice-settings pattern (`saveVoice`): persist on `homeQueue` under the existing support lock, then swap the view on the main queue. It may refuse when `homeBusy` or `ending`; it **must** remain allowed while a model turn is in progress (`modelBusy`) and while voice is listening/speaking, because a visual swap is not an engine restart. Do not set `modelBusy` for pet Apply. A brief `homeBusy` around the file write is acceptable and already blocks Wake in the Voice save path; keep it short and do not cancel an in-flight turn.

**Accepted 02 body rules remain.** Borderless nonactivating panel, `isOpaque = false`, clear background, no rectangular shadow, ordinary floating level, non-key/non-main. Native drag only from drawn pixels. Frame calculations remain screen-coordinate aware; clamp after display change. No private WindowServer APIs. Each new silhouette must still pass the 02 transparent-corner + interior-gap class; a solid opaque rectangle is a defect. Raster sample points per id are part of the closed catalog (Linux schema + native `raster`), not ad-hoc magic numbers in one test.

**Unaccepted 07 (record, do not assume).** Historical `07-review-060` HUMAN_REQUIRED is unchanged. Voice is the intended user path but is not accepted. 13 must not add a text composer. Committed assistant text remains the only speakable payload. Pending native approval still maps to voice phase `approval`. Body-swap events must not be treated as voice-result text. **07 retest** after CompanionController body-swap/`replaceBody`/`render`/lifecycle, EngineBridge, VoiceLifecycle, or permission-protocol edits: shortcut/Wake, no auto-listen after pet Apply, mute preserved, new body shows listening/speaking, no grant/reply revival, no orphan. Do not spend the reserved DeepSeek spoken greeting. Linux must not claim audible proof.

**Parked 08, 09, 10, 11 (record, do not assume working).** Do not implement onboarding, NSWorkspace, plugin-catalog, or MCP work. Do not clear plugin enablement, connection enablement, or reasoning keys because a pet changed. If overlay/inventory/`startAttachment` accidentally change, that is a contract defect, not a silent 10/11 expansion; record the extra retest and stop to propose a contract fix rather than invent overlay APIs.

**Accepted 03/04/05 surfaces.** Pets becomes inventory-backed like Plugins/Connections. Skills, Proactivity, and 03-era honesty rules stay: unbuilt capabilities stay unavailable. Durable identity/home remain 04’s store; pet snapshot is additional support-directory state keyed to the same install, loaded in `prepareModels` next to Voice/Models/Plugins/Connections. Default body before a home exists is `wisp-orb` (already drawn at launch). After a home loads, restore the saved catalog id without restarting the engine.

**Accepted 06 gate (do not weaken).** Pet Apply is not a tool execution and must not create a grant, skip Allow Once, or admit new tools. Native Allow Once / Deny / Cancel Request remain the only action gate. Skills/external children/nested PTC stay disabled.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host authors JS catalog/schema/isolation tests and may author native Swift sources. Linux checks do not establish macOS Settings, AppKit click-through, raster alpha, shortcut, microphone, or audible behavior. Mocks, doubles, and source inspection are supplemental. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not claim macOS Settings or click-through proof from Linux. Do not mark 07–11 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Confirmation scope.** Changing the visible body is not sending, deleting, purchasing, or a privileged tool. Still require a scoped confirmation so Cancel is observable (Plugins Enable/Remove pattern, without engine restart). Copy must not call the change a new companion. Material catalog-id change confirms again; no-op Apply does not.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- `desktop/engine/pet-config.mjs` — closed catalog ids, JSON schema, default `wisp-orb`, raster sample table, catalog rows including unsupported `official-skins`. Not an overlay insert; **not** added to `prepare-product.mjs` `productFiles`.
- `desktop/macos/Sources/WispBody/PetStore.swift`, `PetsView.swift`; evolve `MascotView.swift` (catalog id + three drawings), `CompanionController.swift` (`applyPets` / restore on home load / `replaceBody` current id), `ManagementState.swift` Pets copy, `SettingsWindowController.swift` wiring, `MenuBarController.swift` only if status copy must show the current title.
- `desktop/macos/Tests/WispBodyTests/PetStoreTests.swift` (and ManagementState Pets assertions); `desktop/scripts/test-native.sh` lists the new Swift sources.
- `desktop/tests/pet-config.test.mjs`; extend `tools/linux-js-tests.sh`.
- `docs/pets.md`; update `docs/management-shell.md` Pets/Change Pet copy and `docs/desktop-body.md` current-body note. Sanitized `evidence/13-pets.md` / JSON at implementation.
- Developer `raster` payload gains `catalogId` / gap / unique-opaque samples. Optional developer `pet` op is an implementation choice, gated like other developer ops, absent from ordinary UI.

## Data / state impact

New durable state is a versioned, bounded, owner-only pet snapshot under existing application-support (same descriptor-relative, no-follow, revision, directory-lock pattern as Voice/Models/plugins/connections). Suggested leaf: `pets/config.json` (name is a choice). Schema is closed:

```json
{"version":1,"catalogId":"wisp-orb"}
```

`catalogId` must be exactly one of `wisp-orb` | `wisp-fox` | `wisp-robot`. Unknown version, unknown keys, oversize (>4096), non-string id, `wisp-bird`, `official-skins`, marketplace ids, and empty id fail closed. Default when the file is missing: `wisp-orb`. Invalid file does not migrate silently to fox/robot and does not create a new companion UUID; report restore-the-file and keep the in-memory last-good or orb drawing without writing memory.json.

Pending selection drafts are process memory until Apply. Restart restores the last saved snapshot, not in-flight drafts. First launch with a home and no file writes the default orb snapshot on first successful PetStore load (same create-on-load pattern as `VoiceStore`), not on every render.

Pet snapshot stores only catalog id and version — not drawing code, not UUID, not home path, not secrets. Diagnostics may show the nonsecret catalog id and title. Overlay YAML, `memory.json`, plugin notes, connection env, argv, and Keychain contents are not valid places for pet id as an identity key.

Use fresh `$HOME/wisp-work/wisp-13/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07/08/09/10/11 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, durable memory, Models route, Voice settings, plugin snapshot, and connection snapshot survive 13 pet use. Enabling a pet does not write `memory.json` and does not inspect keys.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed catalog and JS schema (Linux).** Add `pet-config.mjs` with the three ids, default orb, raster sample table (corner, interior gap, one unique opaque point per id), and catalog rows including unsupported `official-skins`. Unit-test: unknown version/keys/oversize/bird/official-skins throw; default is `wisp-orb`; rows mark only the three ids `canManage`; sibling isolation: writing a pet snapshot in a temp support tree leaves fixture `memory.json`, reasoning, voice, plugins, and connections bytes unchanged. Do not fetch assets. Do not HTTP. Do not add the module to `productFiles`.

2. **Native store + drawings + view swap (sources on Linux, uncompiled here).** `PetStore` persist/reload/conflict like `VoiceStore`. `MascotView` takes catalog id and draws the matching original vector; default orb remains pixel-class compatible with accepted 02 (even-odd oval + gap). `replaceBody` / pet Apply swap the view inside the existing panel, resume animation, `render()` current voice/body phase onto the new view, emit developer facts including `catalogId`. Restore saved id in `prepareModels` after home load without `stopReasoning`. Mark NativeChecks uncompiled on Linux.

3. **PetsView + shell copy (sources on Linux, uncompiled here).** Settings → Pets lists the closed catalog; keyboard traversal; confirm vs cancel; Revert Draft; Apply Body; unsupported row not enableable. `ManagementState` Pets copy becomes inventory-backed (current title + “same Wisp” + skins unavailable). Diagnostics mentions nonsecret current body id and omits secrets. Menu Change Pet… already routes to `.pets`; keep that. Show Companion still does not change catalog id.

4. **Docs, 02/03/07 regressions, identities.** Add `docs/pets.md` (rights, catalog, persist-across-restart, not-a-second-agent). Update management-shell / desktop-body copy so Pets is no longer “unavailable.” Keep 06/09/10/11 protocol tests green without overlay edits. Recheck voice-seams analogue if `render` / body facts change. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac Settings/raster/click-through/07 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames above are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with `desktop/tests/pet-config.test.mjs` covering: closed enum `wisp-orb` / `wisp-fox` / `wisp-robot`; default `wisp-orb`; unknown version, extra keys, oversize, empty id, `wisp-bird`, `official-skins`, `tool-bash` rejected; catalog rows: three selectable + one unsupported skins row; `canManage` false for unsupported; raster sample table has distinct unique-opaque points and a gap sample per id; writing `pets/config.json` (or chosen leaf) in a temporary support tree does not modify sibling fixture bytes for memory, reasoning, voice, plugins, or connections. Label results Linux-supplemental. They cannot satisfy Mac Settings GUI, AppKit alpha, or live identity/PID Done when items.

2. **Isolated product runtime.** No new 13 initialize obligation while overlay, `classifyInsert`, `wisp.inventory`, and admission stay untouched. Do not claim 09/10/11 pin-runtime initialize. If implementation accidentally changes those sources, stop and return a contract repair rather than silently adding MCP/plugin tests. No cloud, no key read, no model download.

3. **07 / body regression obligations (Linux analogue + Mac backlog).** Existing voice-protocol / voice-seams: body facts and pet catalog id must not enter TTS; pending approval still suppresses speech; stale generation cannot speak. `replaceBody` still interrupts stale 02 presentation tokens for developer `sequence`, while live `render()` still follows current voice phase on the new view. Invalidation: CompanionController `replaceBody` / `render` / `applyPets` / `prepareModels`, `MascotView`, VoiceLifecycle, EngineBridge. Record 07 retest if those sources change. Do not treat 07 as accepted. Plugin/connection 0/0/0/1 and 09 recording-opener remain; they are not pet tests.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains: pet snapshot persist/reload; default orb; unknown id rejected; confirm-cancel performs zero snapshot change; draft vs saved; Apply while `homeBusy`/`ending` refused; Apply allowed when `modelBusy` analogue is true; unsupported skins row not enableable; ManagementState Pets copy names orb, fox, and robot, states the companion remains the same Wisp, and does not say selection is unavailable; Skills copy still has not queried inventory. `desktop/scripts/build-macos.sh` remains Mac-only here. BodyState interruption/stale/failure assertions remain.

5. **Mac GUI / live (verification backlog, not Linux proof).** On the declared Mac, isolated home: Settings → Pets and menu Change Pet…; keyboard traversal; confirm vs cancel (cancel: zero snapshot write, zero silhouette change); Apply fox then robot then orb; each body shows distinct idle/listening/speaking (developer `listen`/`speak`/`sequence` and, if 07 hardware is present, live voice reactions — do not claim 07 acceptance); Reduce Motion pauses animation; developer `raster` per id: corner alpha 0, gap alpha 0, unique opaque > 0; click-through corners and interior gap on **each** body; drag visible pixels; panel stays non-key/non-main, always-on-top; Show Companion / Settings close-reopen do not reset catalog id. Restart restores the last saved id with the **same** companion UUID, home path, memory revision, Models route, Voice mute/locale, plugin snapshot, and connection snapshot. If an engine is attached, `runtimePID` / `sessionId` are unchanged across pet Apply. Skills still unavailable. Then **07 retest**: shortcut/Wake, no auto-listen after pet Apply, mute preserved, pending-approval speech suppression, no orphan; new body tracks listening/speaking. NativeChecks pass. Do not spend DeepSeek 0/1.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, `connection-config`, hardware/ollama inspect, voice-protocol/seams, safe-actions, and spike client tests remain applicable. Pristine pin, byte-identical spike and archives 01–06. No 07, 08, 09, 10, or 11 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
