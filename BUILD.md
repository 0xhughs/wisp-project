# BUILD — active contract

Slice: 19 Official skin collection
Archive: (none; not shipped)

## Goal

Expand interchangeable bodies with one closed official catalog wave on macOS, without changing the underlying companion.

Wisp remains one persistent desktop AI companion. The mascot is its interchangeable visual body, never a second agent. Settings → Pets and menu-bar Change Pet… already exist as a parked-13 closed starter catalog (`wisp-orb`, `wisp-fox`, `wisp-robot`) plus an unsupported `official-skins` row. This slice makes that row honest by **adding skins**: five additional original Wisp-authored programmatic bodies that share the same required idle / listening / speaking presentation, 02 click-through geometry class, and unchanged agent identity, memory, tools, models, connections, and skills.

**Chosen demonstration (closed; this is the contract choice).** Official collection, wave 1. Selectable catalog ids, in this order:

| Catalog id | Title | Role |
|---|---|---|
| `wisp-orb` | Wisp orb | Keep. Default. Existing accepted-02 even-odd oval. |
| `wisp-fox` | Fox | Keep. Existing parked-13 fox silhouette. |
| `wisp-robot` | Robot | Keep. Existing parked-13 robot silhouette. |
| `wisp-bird` | Bird | New. 13 illustrative leftover, now an official body. |
| `wisp-cat` | Cat | New. Sitting-cat silhouette. |
| `wisp-owl` | Owl | New. Round owl with ear tufts. |
| `wisp-sprout` | Sprout | New. Two-leaf plant companion. |
| `wisp-capsule` | Capsule | New. Vertical rounded capsule with a porthole gap (geometric sibling of orb/robot). |

One explicit unsupported row, still not enableable: `official-skins` — further official skins toward the eventual around-twenty collection remain later (**19.x-catalog**). No marketplace, third-party pack, or extra skins were queried.

Around twenty is eventual scale, not this slice’s quota. Eight selectable official bodies is the closed increment. Remaining official bodies toward that eventual collection are **19.x-catalog**, not this contract.

Parked 13 is implemented with verification pending, **not Shipped** (13-review-081 IMPLEMENTATION_READY). Do not assume Pets GUI, per-body raster, click-through, NativeChecks, restart persistence, or 07 retest work. This slice builds on that unaccepted prerequisite and must record **13/07 retest**. Do not treat orb/fox/robot Mac drawings as proven.

The pinned DeepSeek Harness at `d347e703908d0406b7a7ef80e3a0e594d86b2215` has **no** mascot, skin, Live2D, or pet-catalog APIs. Inspected `packages/sdk/server/src/server.ts` `handleRequest` remains `initialize` / `session/prompt` / `shutdown`. Inspected pin source has no Live2D/mascot/skin-pack matches. Pet selection stays a Wisp-native visual concern. An integration gap is not permission to invent supported Harness RPCs or a `dsh` skin install.

Parked 17 Windows body draws `wisp-orb` only. This slice must **not** edit `desktop/windows/**`. Windows drawings of non-orb official ids are **17.x-skins**. If `pets/config.json` names a wave-1 id, Windows may keep showing that catalog id as nonsecret text and must still draw the orb.

This slice is inside the authorized 01–21 implementation target (2026-09-10) and **outside** the macOS first-release acceptance gates (01–14). Gate 10 still says approximately twenty skins are not a first-release requirement.

## Done when

1. **Working Pets surface; closed wave-1 catalog; honest remainder row.** Settings → Pets lists exactly the eight selectable ids above, in that order, with truthful status among at least: current, saved, applying, available, unavailable. Menu Change Pet… still opens the same retained Settings window on Pets. Keyboard-accessible selection covers every selectable id (catalog-driven from the closed enum — do not leave PetsView as three hardcoded orb/fox/robot radios). Apply Body, Revert Draft, and scoped confirmation exist only for those eight ids. Confirm copy states that this is the same Wisp and that identity, memory, models, voice, plugins, connections, and skills stay the same. Cancel / Escape / Revert Draft leaves the saved snapshot and the on-screen drawing unchanged (zero file write, zero view replacement). Applying the already-saved id is a no-op. Without a chosen Wisp folder, Apply explains that a folder is required to save a body and does not invent a second identity.

   `official-skins` remains one unsupported row, not enableable, `canManage` false. Its detail must **not** say that additional official skins remain slice 19 as if this increment added none. Honest copy: further official skins toward the eventual collection remain later; no marketplace, third-party pack, or extra skins were queried. No empty-list implication that ~20 skins or a store were queried. No composer, transcript, Harness web/chat UI, `dsh` CLI, user-imported skins, or pet-specific chat.

   Starter three remain selectable. Wave-1 ids are additional, not replacements. Default remains `wisp-orb`. `PetConfiguration.normalized` still maps unknown ids to `wisp-orb` for drawing only; it must not persist an unknown id.

2. **Body assets and animation integration; 02 presentation and click-through preserved for every selectable id.** Each selectable body is original in-repo programmatic vector artwork drawn by AppKit (`NSBezierPath` / even-odd fills), with rights recorded in `docs/pets.md` as Wisp-authored programmatic artwork. No PNG/JPEG/WebP/SVG asset packs, no Live2D/Spine, no network fetch, no spend, no third-party file. Panel size remains 160×160. Each body has genuinely clear pixels in the window corners **and** an interior transparent gap (02 Done when 2 geometry class). Visible silhouette pixels accept native drag. Idle transparent regions pass clicks and scrolls to an underlying application by native alpha hit-testing; no `ignoresMouseEvents` polling, event injection, or Accessibility/Input Monitoring product permission. Always-on-top, nonactivating, non-key/non-main `MascotPanel` rules stay.

   Closed silhouette classes for the five new bodies (original drawings; not copies of orb/fox/robot paths):

   - **Bird** — winged body with a pointed beak/tail; even-odd eye or wing-window gap; listening/speaking reactions that are bird-specific (for example wing or beak motion), not orb ticks.
   - **Cat** — sitting cat with two pointed ears; even-odd belly or eye gap; cat-specific listening/speaking reactions (for example ear or tail motion).
   - **Owl** — round body with ear tufts; even-odd eye-ring gap; owl-specific listening/speaking reactions (for example eye-ring or body bob).
   - **Sprout** — two leaves on a stem; even-odd between-leaf or stem-window gap; sprout-specific listening/speaking reactions (for example leaf sway or stem stretch).
   - **Capsule** — vertical rounded capsule; even-odd porthole gap; capsule-specific listening/speaking reactions (for example porthole pulse or end-cap motion), not a second oval-orb.

   Existing orb/fox/robot drawings stay the parked-13 silhouettes (do not abandon those paths). Each of the eight bodies renders visibly distinct **idle**, **listening**, and **speaking**. Processing, approval, muted, unavailable, starting, and stopped keep the existing 07 `fillColor()` / presentation mapping on whatever body is current so VoiceLifecycle does not need new `BodyPhase` values. Idle has restrained animation; listening and speaking have distinct reactions. Invalid/stale transitions cannot leave a stuck listening/speaking reaction after stop, failure, or view replacement. Pause or dispose animation when the body is hidden/destroyed; honor Reduce Motion. Body change recreates the drawing view inside the **existing** controller-owned panel (`replaceBody`: one panel, generation bump, no second window). Developer `recreate` recreates the **current** pet, not a silent reset to orb. Developer `raster` reports `catalogId`, corner alpha, interior-gap alpha, and one body-unique opaque sample so all eight silhouettes are distinguishable.

   Raster sample points per id are part of the closed catalog (Linux `RASTER_SAMPLES` + native `PetRaster`). Existing orb/fox/robot samples stay exactly:

   - `wisp-orb` — corner `[0,0]`, gap `[80,98]`, uniqueOpaque `[40,80]`
   - `wisp-fox` — corner `[0,0]`, gap `[80,78]`, uniqueOpaque `[52,20]`
   - `wisp-robot` — corner `[0,0]`, gap `[80,34]`, uniqueOpaque `[80,8]`

   Each new id gets a closed `(corner, gap, uniqueOpaque)` triple recorded in `pet-config.mjs` / `PetRaster` when the drawing is authored. Corner is `[0,0]`. Gap and uniqueOpaque are integer points inside 160×160, not `[0,0]`, not equal to each other, and not colliding with any other selectable id’s gap or uniqueOpaque pair. Exact new coordinates are routine implementation choices bound by those uniqueness rules.

3. **Identity, memory, tools, models, connections, and skills persist; pet Apply does not restart the engine.** After a confirmed body change to a wave-1 id (and after switching back to orb/fox/robot), and again after ordinary Quit and relaunch that restores the saved catalog id:

   - Exactly one companion UUID (`wisp-home.json` / `MemorySnapshot.companionId`) and the same chosen Wisp home path.
   - Durable memory: `memory.json` bytes and revision unchanged by the pet write (pet snapshot remains a sibling store, not a memory entry). No pet-specific memory file, no per-body facts, no body id written into memory instructions.
   - Models route (provider/model/selected) and protected reasoning-key references unchanged.
   - Voice settings (locale, voice identifier, rate, mute) unchanged; mute is not flipped; speech engines stay independent of the body.
   - Plugin snapshot, connection snapshot, and skill snapshot bytes and revisions unchanged. Skills remain the same Wisp (parked 12 Local time briefing catalog); a body is not a second assistant and does not get its own skills.
   - Tools: admitted inventory, overlay YAML, and persona unchanged. Pet Apply **must not** call `stopReasoning` / `startAttachment`, must not replace the Harness process, and must not change `sessionId` / `runtimePID` when an engine is already attached. Pet id is not a second `companionId`, is not written into overlay YAML, argv, `product.patch.yml` persona, or memory instructions, and is not a permission grant.

   Changing the pet never starts a second agent, never mounts tools, and never grants Allow Once. Connection save / plugin install / Skill Enable / spoken yes / memory instruction / pet Apply / visual click / Accessibility TCC are not grants.

4. **Product invariants, parked-13/07 retest, and later-slice boundaries.** Transparent-region click-through, body movement, Settings close/reopen, menu navigation, General Show Companion, and Quit remain. The mascot does not become key/main. No chat window, prompt composer, conversation history, or Harness UI. Models remains the sole owner of reasoning keys. 09 URL/file/time stay Direct; 15 AX stays Direct; 16 visual click stays Drawn Canary only and is not a pet. 10/11/12 stay on their existing gates when those parked routes are loaded; stock `tool-bash` / `tool-fs` / `tool-web` / `tool-pwsh` stay disabled.

   **Retest 13** (do not assume it passed): Settings → Pets still selects orb, fox, and robot; Cancel still zero snapshot / zero silhouette change; developer `raster` for those three ids still reports corner alpha 0, their existing gap samples alpha 0, and unique opaque > 0; click-through corners and interior gap still hold on those three; pet Apply still must not restart the engine. Invalidation: PetStore, PetsView, MascotView, `replaceBody` / `applyPets` / `prepareModels`.

   **Retest 07** after CompanionController body-swap / `replaceBody` / `render` / `applyPets`, MascotView, EngineBridge, VoiceLifecycle, or permission allowlists: shortcut/Wake, no auto-listen after pet Apply (including a wave-1 Apply), mute preserved, new body tracks listening/speaking, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend the reserved DeepSeek greeting. Do not treat 07 as accepted.

   **Do not** retest 10 overlay/inventory, 11 MCP admission, 15 AX, or 16 visual as a 19 obligation unless overlay composition, `classifyInsert`, `wisp.inventory`, `startAttachment` snapshot attach, `permission-protocol`, or visual/AX drivers actually change (they must not). If implementation accidentally touches those seams, stop and return a contract repair.

   Slice 14 release, 18 wake-word, 20 proactivity behavior, and 21 remote are not implemented. Open decisions (18/20/21) stay unresolved. Visual click stays 16. Wake-word stays 18. `desktop/windows/**` stays byte-unchanged.

   Honest remainder (not this contract, not 14/18/20/21):

   - **19.x-catalog** — further official Wisp-authored programmatic bodies toward the eventual around-twenty collection (not an exact quota). Keep `official-skins` as the unsupported remainder row until a later approved contract adds more ids.
   - **17.x-skins** — Windows drawings of non-orb catalog ids (including parked-13 fox/robot and this wave). This increment does not start that work.

5. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS catalog, snapshot-schema, raster uniqueness, and sibling-file isolation tests pass on this host. Native Swift sources may be written on Linux but remain **uncompiled/unverified** here (`missing-platform`). Actual macOS Settings/keyboard Pets (eight radios or catalog-driven equivalents), NativeChecks compile, per-body raster/click-through for all eight ids, restart persistence of a wave-1 catalog id, live companion UUID / home / engine PID proof, 13 retest, and 07 shortcut/mic/TTS retest are Mac/human backlog items, not Linux passes. Isolated pin-runtime initialize is **not** a new 19 resource if overlay/product-sdk/admission stay untouched; existing missing-external-resource initialize backlog stays recorded and is not claimed passed. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07–17 Shipped.

## Out

- Shipping exactly twenty skins in this increment; treating around twenty as a quota; leaving `official-skins` unavailable without adding any selectable skins.
- A skin marketplace, user-imported image/Live2D/Spine/PNG packs, purchased/stock art, network-fetched bodies, or `dsh` skin install.
- Replacing or abandoning `wisp-orb` / `wisp-fox` / `wisp-robot`; making any of those three unselectable; changing the default away from `wisp-orb`.
- A second companion UUID, a second Wisp home, pet-specific memory, pet-specific models, pet-specific plugins/connections/skills, or a second user-facing assistant identity.
- Restarting the hidden engine, replacing overlay/persona, or injecting catalog id into Harness as a different agent because the body changed.
- Chat composer, transcript UI, Harness web UI, `dsh` CLI, or a chatbot as the Pets surface.
- Weakening 02 click-through, always-on-top, nonactivating panel, Reduce Motion, or transparent-gap requirements for any catalog body. A solid opaque rectangle is a defect.
- Editing `desktop/windows/**`; adding `SendInput`; requiring Windows to draw wave-1 bodies in this increment (17.x-skins).
- Voice-loop acceptance (07), onboarding (08), safe-action acceptance (09), plugins (10), Connections (11), skills (12), pets acceptance (13), release (14), Accessibility (15), visual click (16), Windows companion acceptance (17), wake-word (18), proactivity behavior (20), remote doorways (21).
- Implementing 14, 18, 20, or 21. Resolving SLICES Open decisions. Inventing numeric performance targets.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Editing accepted `spike/`, slice archives 01–06, or writing `slices/07-*.md` through `slices/19-*.md`. Marking 07–17 Shipped.
- Enabling stock `tool-bash`, `tool-fs`, `tool-web`, `tool-pwsh`, general sub-agents, Allow Always, or disabling permission, privacy, credential, cancellation, or release safeguards to make tests pass.
- Treating pet Apply as Allow Once. Persisting `official-skins`, `wisp-dragon`, marketplace ids, or empty id as `catalogId`.

## Constraints

**Chosen official wave (closed; this is the contract choice).** SLICES Goal “around twenty official skins” is eventual scale. Discovery shows a full remaining-seventeen drawing-and-Mac-raster campaign is several independent outcomes. This contract covers **wave 1: five new original bodies plus keep-three**, catalog-driven Pets selection, and the same 13 identity/Apply rules. Honest remainder is 19.x-catalog and 17.x-skins. Do not pretend this slice ships every Provides reading of “around twenty.” Do not leave the official-skins row as the only 19 outcome.

Rights: all eight selectable bodies are Wisp-authored programmatic/vector drawings in covered source. No third-party file, no recorded commercial license, no download. `docs/pets.md` states that origin. Bird is in this catalog (it was Out of 13). User skins and further official bodies stay the unsupported `official-skins` row / 19.x-catalog. Do not add raster assets to the candidate to “look finished.”

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Pet selection is a Wisp-native visual concern: **do not** add a pet insert to `composeOverlay`, `product.patch.yml`, `product-sdk.ts` admission, or `prepare-product.mjs` `productFiles`. `pet-config.mjs` stays out of `productFiles`. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Do not call Harness web settings controllers. Do not enable disabled overlay rows.

**Visual body, not a second agent.** `CompanionController.identity` and durable `companionId` stay independent of catalog id. `replaceBody()` already recreates `MascotView` inside one `MascotPanel`. Wave-1 Apply extends that path with the expanded closed enum; it does not allocate a second panel, second `EngineBridge`, or second home. `render()` continues to map `VoiceLifecycle` / `BodyPhase` onto the current view. Developer `sequence` / `listen` / `speak` / `interrupt` remain labeled simulated presentation when 07 is not driving live voice.

**Do not use the plugin/connection/skill Apply path.** `applyPlugins` / `applyConnections` / `applyModels` / `applySkills` call `stopReasoning` then `startAttachment`. Pet Apply follows the Voice-settings pattern (`saveVoice` / parked-13 `applyPets`): persist on `homeQueue` under the existing support lock, then swap the view on the main queue. It may refuse when `homeBusy` or `ending`; it **must** remain allowed while a model turn is in progress (`modelBusy`) and while voice is listening/speaking. Do not set `modelBusy` for pet Apply.

**Accepted 02 body rules remain.** Borderless nonactivating panel, `isOpaque = false`, clear background, no rectangular shadow, ordinary floating level, non-key/non-main. Native drag only from drawn pixels. Clamp after display change. No private WindowServer APIs. Each new silhouette must pass the 02 transparent-corner + interior-gap class.

**Unaccepted 13 (required catalog/Apply/drawing pattern; do not assume working).** 13-review-081 IMPLEMENTATION_READY, not Shipped. Reuse `pets/config.json` version 1, `PetStore`, `applyPets`, `replaceBody`, developer `raster`. Expand the closed selectable enum; do not invent a second snapshot file or bump `version` solely to add ids. Existing valid orb/fox/robot snapshots must remain valid. **13 retest** as in Done when 4. Linux JS currently rejects `wisp-bird`; this slice makes `wisp-bird` selectable and must move the unknown-id canary to a non-catalog id such as `wisp-dragon`.

**Unaccepted 07 (record, do not assume).** Historical `07-review-060` HUMAN_REQUIRED is unchanged. Voice is the intended user path but is not accepted. 19 must not add a text composer. Committed assistant text remains the only speakable payload. Body-swap events must not be treated as voice-result text. **07 retest** after body-swap / MascotView edits. Do not spend the reserved DeepSeek spoken greeting. Linux must not claim audible proof.

**Parked 08, 09, 10, 11, 12, 15, 16 (record, do not assume working).** Do not implement onboarding, NSWorkspace, plugin-catalog, MCP, skill-register, AX, or visual-click work. Do not clear plugin/connection/skill enablement or reasoning keys because a pet changed. Drawn Canary is not a pet. If overlay/inventory/`startAttachment`/permission-protocol accidentally change, that is a contract defect; stop and propose a repair.

**Parked 17.** Windows body/tray/shortcut/identity stays verification-pending and orb-only. **Do not edit `desktop/windows/**`.** Keep orb `RASTER_SAMPLES['wisp-orb']` bytes identical so parked-17 Linux `windows-body-state` tests remain valid. macOS may still draw wave-1 ids while Windows ignores them.

**Accepted 03/04/05/06 surfaces.** Pets stays inventory-backed. Unbuilt capabilities stay unavailable. Durable identity/home remain 04’s store. Pet Apply is not a tool execution and must not create a grant, skip Allow Once, or admit new tools. Native Allow Once / Deny / Cancel Request remain the only action gate.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host authors JS catalog/schema/isolation tests and may author native Swift sources. Linux checks do not establish macOS Settings, AppKit click-through, raster alpha, shortcut, microphone, or audible behavior. Mocks, doubles, screenshots of this host, and source inspection are supplemental, not native proof. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not mark 07–17 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Confirmation scope.** Changing the visible body is not sending, deleting, purchasing, or a privileged tool. Still require a scoped confirmation so Cancel is observable (parked-13 pattern, without engine restart). Copy must not call the change a new companion. Material catalog-id change confirms again; no-op Apply does not.

**Catalog-driven Pets UI (routine implementation choice bound by Done when 1).** `PetsView` today wires three `ModelsButton` radios (`pickOrb` / `pickFox` / `pickRobot`) under the heading “Starter bodies.” Wave 1 must not extend that by five more independently named pick methods as the required shape. Generate selection controls from `PetCatalog.selectable` / `PetConfiguration.selectable`, keep keyboard tab order over every selectable control plus Apply Body and Revert Draft, and retitle the group to official bodies (starters remain in the same list). Unsupported `official-skins` stays text-catalog only, not a radio.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- Evolve `desktop/engine/pet-config.mjs` — eight selectable ids, default `wisp-orb`, expanded `RASTER_SAMPLES`, catalog rows including unsupported `official-skins` remainder copy. Not an overlay insert; **not** added to `prepare-product.mjs` `productFiles`.
- Evolve `desktop/macos/Sources/WispBody/PetStore.swift` (selectable enum, titles, rows, `PetRaster`), `PetsView.swift` (catalog-driven selection), `MascotView.swift` (five new `draw*` methods + switch), `ManagementState.swift` Pets copy, `CompanionController.swift` pet description/diagnostics only as needed (`applyPets` / `replaceBody` keep the 13 engine-alive rule).
- Evolve `desktop/macos/Tests/WispBodyTests/PetStoreTests.swift` and ManagementState Pets assertions; `desktop/tests/pet-config.test.mjs`.
- `docs/pets.md`; update `docs/management-shell.md` and `docs/desktop-body.md` catalog lists. Sanitized `evidence/19-official-skins.md` / JSON at implementation.
- Developer `raster` continues to use `PetRaster.samples(catalogId)` so new ids are covered without a new op.

Do not edit `desktop/windows/**`, `permission-protocol.mjs`, `product-sdk.ts`, `product.patch.yml`, `plugin-overlay.mjs`, `ax-actions.mjs`, `visual-actions.mjs`, or accepted `spike/` / `slices/01-*.md` through `slices/06-*.md`.

## Data / state impact

Durable state remains the existing owner-only pet snapshot `pets/config.json` (same descriptor-relative, no-follow, revision, directory-lock pattern). Schema stays version 1:

```json
{"version":1,"catalogId":"wisp-orb"}
```

`catalogId` must be exactly one of `wisp-orb` | `wisp-fox` | `wisp-robot` | `wisp-bird` | `wisp-cat` | `wisp-owl` | `wisp-sprout` | `wisp-capsule`. Unknown version, unknown keys, oversize (>4096), non-string id, `official-skins`, `wisp-dragon`, marketplace ids, `tool-bash`, and empty id fail closed. Default when the file is missing: `wisp-orb`. Invalid file does not migrate silently to a wave-1 id and does not create a new companion UUID; report restore-the-file and keep the in-memory last-good or orb drawing without writing `memory.json`.

Pending selection drafts are process memory until Apply. Restart restores the last saved snapshot, not in-flight drafts. First launch with a home and no file still writes the default orb snapshot on first successful PetStore load.

Pet snapshot stores only catalog id and version — not drawing code, not UUID, not home path, not secrets. Diagnostics may show the nonsecret catalog id and title. Overlay YAML, `memory.json`, plugin notes, connection env, skill snapshot, argv, and Keychain contents are not valid places for pet id as an identity key.

Use fresh `$HOME/wisp-work/wisp-19/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07–17 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, durable memory, Models route, Voice settings, plugin snapshot, connection snapshot, and skill snapshot survive 19 pet use. Enabling a pet does not write `memory.json` and does not inspect keys.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed catalog and JS schema (Linux).** Expand `SELECTABLE_IDS` to the eight ids in the contracted order. Keep default `wisp-orb`. Add five `RASTER_SAMPLES` entries that satisfy uniqueness vs orb/fox/robot and each other (coordinates may be placeholders until drawings exist, then freeze them in the same change as the paths). Update catalog rows and `official-skins` remainder copy. Unit-test: wave-1 ids validate; `wisp-dragon` / `official-skins` / extra keys / oversize still throw; `wisp-bird` is no longer a reject canary; rows are eight selectable + one unsupported; `canManage` false for unsupported; sibling isolation still leaves memory/reasoning/voice/plugins/connections/skills bytes unchanged; `pet-config.mjs` still not in `productFiles`; `RASTER_SAMPLES['wisp-orb']` remains `[0,0]` / `[80,98]` / `[40,80]` so parked-17 Linux orb tests stay valid. Do not fetch assets. Do not HTTP.

2. **Native store + drawings + catalog-driven PetsView (sources on Linux, uncompiled here).** Expand `PetConfiguration.selectable`, titles, rows, and `PetRaster`. `MascotView` draws the five new original even-odd silhouettes with idle/listening/speaking reactions and interior gaps; keep orb/fox/robot paths. `PetsView` builds radios (or equivalent) from the selectable list; keyboard traversal covers all eight plus Apply/Revert; unsupported row remains catalog text. `replaceBody` / `applyPets` stay the 13 engine-alive path. Restore saved id in `prepareModels` without `stopReasoning`. Mark NativeChecks uncompiled on Linux.

3. **Copy, docs, 13/07 regressions, identities.** ManagementState Pets copy names the eight titles, same-Wisp persistence, and 19.x remainder (not “skins remain slice 19” as if none shipped). Update `docs/pets.md`, `docs/management-shell.md`, `docs/desktop-body.md`. Keep 06/09/10/11/12/15/16 protocol tests green without overlay/permission edits. Recheck voice-seams analogue if `render` / body facts change. Recheck `windows-body-state` orb samples without editing `desktop/windows/**`. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac Settings/raster/click-through/13/07 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames above are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend existing `desktop/tests/pet-config.test.mjs` (keep `sh tools/linux-js-tests.sh` as the runner) covering: closed enum exactly `wisp-orb`, `wisp-fox`, `wisp-robot`, `wisp-bird`, `wisp-cat`, `wisp-owl`, `wisp-sprout`, `wisp-capsule` in that order; default `wisp-orb`; unknown version, extra keys, oversize, empty id, `official-skins`, `wisp-dragon`, `marketplace-fox`, `tool-bash` rejected; `wisp-bird` accepted; catalog rows: eight selectable + one unsupported skins row; `canManage` false for unsupported; remainder copy does not claim slice 19 added zero skins and does not imply a marketplace query; raster sample table has distinct unique-opaque points and a gap sample per selectable id; existing three samples unchanged; writing `pets/config.json` with a wave-1 id in a temporary support tree does not modify sibling fixture bytes for memory, reasoning, voice, plugins, connections, or skills; `pet-config.mjs` is not a product overlay file. Parked-17 `windows-body-state` orb sample assertions remain applicable without Windows source edits. Label results Linux-supplemental. They cannot satisfy Mac Settings GUI, AppKit alpha, or live identity/PID Done when items.

2. **Isolated product runtime.** No new 19 initialize obligation while overlay, `classifyInsert`, `wisp.inventory`, and admission stay untouched. Do not claim 09/10/11/12/15/16 pin-runtime initialize. If implementation accidentally changes those sources, stop and return a contract repair rather than silently adding MCP/plugin/AX/visual tests. No cloud, no key read, no model download.

3. **13 / 07 / body regression obligations (Linux analogue + Mac backlog).** Existing voice-protocol / voice-seams: body facts and pet catalog id must not enter TTS; pending approval still suppresses speech; stale generation cannot speak. `replaceBody` still interrupts stale presentation tokens for developer `sequence`, while live `render()` still follows current voice phase on the new view. Orb/fox/robot schema and sibling isolation remain. Invalidation: CompanionController `replaceBody` / `render` / `applyPets` / `prepareModels`, `MascotView`, `PetsView`, PetStore, VoiceLifecycle, EngineBridge. Record 13 and 07 retest if those sources change. Do not treat 07 or 13 as accepted. Plugin/connection/skill 0/0/0/1, 09 recording-opener, 15 recording-AX, and 16 recording-visual remain; they are not pet tests unless those seams change.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains/keeps: pet snapshot persist/reload for a wave-1 id and for orb; default orb; `wisp-dragon` / `official-skins` rejected; `wisp-bird` accepted; confirm-cancel performs zero snapshot change; draft vs saved; Apply while `homeBusy`/`ending` refused; Apply allowed when `modelBusy` analogue is true; unsupported skins row not enableable; catalog row order is the eight ids plus `official-skins`; ManagementState Pets copy names orb, fox, robot, bird, cat, owl, sprout, and capsule, states the companion remains the same Wisp, states skills persist, and does not say body selection is unavailable; raster sample uniqueness including new ids. `desktop/scripts/build-macos.sh` remains Mac-only here. BodyState interruption/stale/failure assertions remain. Live raster alpha is skipped or marked unverified on Linux.

5. **Mac GUI / live / 13+07 retest (verification backlog, not Linux proof).** On the declared Mac, isolated home: Settings → Pets and menu Change Pet…; keyboard traversal across all eight selectable bodies; confirm vs cancel (cancel: zero snapshot write, zero silhouette change); Apply each wave-1 id then Apply fox then robot then orb; each of the eight bodies shows distinct idle/listening/speaking (developer `listen`/`speak`/`sequence` and, if 07 hardware is present, live voice reactions — do not claim 07 acceptance); Reduce Motion pauses animation; developer `raster` per id: corner alpha 0, gap alpha 0, unique opaque > 0; click-through corners and interior gap on **each** body; drag visible pixels; panel stays non-key/non-main, always-on-top; Show Companion / Settings close-reopen do not reset catalog id. Restart restores the last saved id (including a wave-1 id) with the **same** companion UUID, home path, memory revision, Models route, Voice mute/locale, plugin snapshot, connection snapshot, and skill snapshot. If an engine is attached, `runtimePID` / `sessionId` are unchanged across pet Apply. Then **13 retest** on orb/fox/robot as in Done when 4, and **07 retest**: shortcut/Wake, no auto-listen after pet Apply, mute preserved, pending-approval speech suppression, no orphan; new body tracks listening/speaking. NativeChecks pass. Do not spend DeepSeek 0/1. Do not assume parked-13 Mac raster already passed.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, `connection-config`, `skill-config`, `pet-config`, hardware/ollama inspect, voice-protocol/seams, safe-actions, ax-actions, visual-actions, windows-home/body-state, and spike client tests remain applicable. Pristine pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`, byte-identical spike and archives 01–06. `desktop/windows/**` unchanged. No 07, 08, 09, 10, 11, 12, 13, 15, 16, or 17 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
## Proof
Coordinator persisted Builder 19-draft-098 Proposed contract (worker bc-deb5021d-a57f-5be3-9412-195522570e6a). No application code. Not plan approval. Not 19 acceptance. Slices 07, 08, 09, 10, 11, 12, 13, 15, 16 and 17 remain implemented with verification pending; unaccepted copies `evidence/07-contract-wip.md` through `evidence/17-contract-wip.md`; historical 07-review-060 HUMAN_REQUIRED unchanged; parked IMPLEMENTATION_READY reviews unchanged; no `slices/07-*.md` through `slices/19-*.md`.

## Review
Pending 19-plan-099 plan review of the slice 19 Proposed contract. Not consumed. Not implementation approval.

19-draft-098 Builder draft-proposal complete (bc-deb5021d-a57f-5be3-9412-195522570e6a). Handback $HOME/wisp-work/loop-state/19-draft-098.md. Not plan approval. Consumed.

16-review-097 IMPLEMENTATION_READY — independent reviewer bc-464b7da6-8861-5a0d-b387-2192a37c6bda. Contract a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98. Linux 241/241 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

17-review-093 IMPLEMENTATION_READY — independent reviewer bc-efc175aa-9c93-5e5b-9fb5-dda53741fd30. Contract 691b64a52b69ed54447cb1e399c8ac85004c8165cf571c953f958f28a7fbf195. Linux 199/199 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

15-review-089 IMPLEMENTATION_READY — independent reviewer bc-dac81f09-21ff-5116-8729-1a43f2c26b35. Contract eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539. Linux 185/185 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

loop-plan-061 APPROVE_PLAN — independent reviewer bc-d950b4e9-45b7-5209-ba88-2af0e6247466. Amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. Consumed.

## Loop state
Tool adapter: Cursor Task generalPurpose subagent; coordinator persists dispatch ID then launches; waits for confirmed completion; Reviewer context is independent of Builder reasoning. One active worker per checkout. This Linux host cannot actuate macOS CUA; Mac physical tests remain participant-gated.
Coordinator: cursor-cloud bc-81f7c99b-f70d-4a0a-83e5-180597760926
Worker / role / phase: none (pending launch) / Reviewer / Proposed
Dispatch ID / launch state / input identity: 19-plan-099 / pending launch / proposed contract a26250063c5be1242d3789990fef1b32ce5d841734df018b872048bc40bb4f2d; candidate 3b93f7084b96d0c91b8a6fc85cfb03fc47a56149c8c3b3ded2321a5fb0ff8991 (291 files)
Pending result / last consumed dispatch: none / 19-draft-098
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 tools/identity.py --repo .` from repository root (replacement of unavailable ../../work/loop-state/identity.py). SHA-256 sorted relative file manifest includes git tracked and non-ignored untracked files, bytes, types, executable bits, symlink targets. Excludes .git, tools/identity.py (hashed only into contract identity), and the WISP_LOOP_STATE store if it lies inside the checkout. BUILD.md and SLICES.md contribute canonicalized bytes: BUILD stops before ## Proof; SLICES omits Run status, Release evidence, Shipped/Now/Later/Implemented-verification-pending placement headings, Implementation ledger and Verification backlog while keeping mapped slice bodies and target membership ordered by slice ID. Contract hashes BUILD through Tests, the Loop-state snapshot capture line, that SLICES canonicalization, full AGENTS/LOOP/BUILDER/REVIEWER, and tools/identity.py bytes. Manifest JSON stored outside coverage at $WISP_LOOP_STATE (default $HOME/wisp-work/loop-state). No other dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source remains an external reference; when present verify `git -C "$WISP_HARNESS" rev-parse HEAD` and porcelain status, default $HOME/wisp-work/deepseek-harness; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Historical identities below are records only and cannot be recomputed on this host. Changing identity.py rules requires plan re-review.
Baseline snapshot: 3b93f7084b96d0c91b8a6fc85cfb03fc47a56149c8c3b3ded2321a5fb0ff8991 (291 files; proposed 19-plan-099 baseline if approved). Parked 16 implementation candidate 7315ae33627073403688c685d34677d8216243ccf388a6ab812cbb45c6dbb96c (290 files) retained as record; parked tree after evidence/16-contract-wip.md was 3545b164efe513153e3ffe39aa326415b548e1136613557dadac01b4ebcb4f4a (291 files, 16 page).
Contract identity: a26250063c5be1242d3789990fef1b32ce5d841734df018b872048bc40bb4f2d (proposed 19-plan-099).
Candidate snapshot: 3b93f7084b96d0c91b8a6fc85cfb03fc47a56149c8c3b3ded2321a5fb0ff8991 (291 files).
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: Slice 19 is Proposed only. 07–17 Mac/Windows/runtime gates remain backlog and do not block this plan review. Native Swift skins uncompiled here. Wave 1 eight bodies; further official skins remain 19.x-catalog. Parked 13 is unaccepted; record retest.
Repair awaiting review: false
Review events: 19-plan-099 pending plan review of slice 19; not consumed. 19-draft-098 draft-proposal complete builder bc-deb5021d-a57f-5be3-9412-195522570e6a; not a review verdict. 16-review-097 IMPLEMENTATION_READY contract a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98 candidate 7315ae33627073403688c685d34677d8216243ccf388a6ab812cbb45c6dbb96c; reviewer bc-464b7da6-8861-5a0d-b387-2192a37c6bda. loop-plan-061 APPROVE_PLAN amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. 07-review-060 HUMAN_REQUIRED remains the last 07 implementation review (not rewritten). Accepted06 final1/0 archived.
Budget limit / consumed / measurement: no global execution budget. Cloud05 allowance6/6 exhausted and immutable. Separate one-small-agent-cloud-greeting allowance0/1spent, max1024tokens/retry0, requires explicit physicalactivation and ledger reservation beforedispatch. Four user-operated successful connectiontests050 recorded separately, not agent calls. No extra connectiontest/keyinspection/download; local per-scenario modelnoncompliancecap2. Linux host must not consume the reserved cloud greeting.
Blocker / resume status / resume action / recheck condition / deadline: none for this slice-19 plan review. Recheck: independent Reviewer verdict on 19-plan-099. No automatic paid calls/downloads. Counters0/0.
Advance phase: none
Next slice ID / draft: 19 / 19-draft-098 consumed; 19-plan-099 pending

## Status
Proposed

## Next
Independent plan review of dispatch 19-plan-099 (slice 19 official skin collection wave 1). Do not start 19 code before APPROVE_PLAN. Do not mark 07, 08, 09, 10, 11, 12, 13, 15, 16, or 17 Shipped. Counters 0/0.
