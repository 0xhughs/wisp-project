# BUILD — active contract

Slice: 10 Compatible plugin management
Archive: (none; not shipped)

## Goal

Expose DeepSeek Harness plugins through Wisp-owned Settings while preserving the accepted permission boundary, the pinned SDK/base composition, and honest compatibility. Wisp discovers, shows status for, configures, installs (mounts) and removes (unmounts) only plugin lifecycle operations the verified engine actually supports: the existing product `--patch` overlay plus a clean engine restart. The contracted demonstration is one locally authored, harmless Cordis plugin that Wisp already understands. Unsupported plugins, marketplace catalogs, `dsh plugin`/pnpm registry installs, MCP/skill/web/chat plugins and plugin-supplied reasoning providers remain visibly unavailable. Installing a plugin never grants tool permission; 06 native Allow Once / Deny / Cancel remain the only action gate.

## Done when

1. **Wisp-owned Plugins surface with a real inventory.** Settings → Plugins is a working management section, not the 03 placeholder that has not queried inventory. It lists a closed, Wisp-authored catalog: the installable demonstration plugin; the existing developer-only 06 fixture (visible as not a user plugin, still gated by developer mode); and explicit unsupported classes (registry/marketplace, arbitrary third-party folders, stock executable-tool enablers, MCP/Connection plugins, skills, web/chat UI plugins, plugin-supplied model/provider replacements). Each row shows a truthful status among at least: not installed, saved, applying, active, incompatible, unavailable. Unsupported rows cannot be enabled. No empty-list implication that a marketplace was queried. Keyboard-accessible Install/Enable, Configure, Remove/Disable and Apply controls exist only for the supported demonstration. Cancel/revert leaves the saved composition unchanged. No composer, transcript, Harness web UI, or `dsh` CLI is exposed.

2. **Install, configure, remove and status use the verified overlay-and-restart seam.** Enabling the demonstration plugin persists a versioned Wisp plugin snapshot, then reuses the existing owned engine replacement path (stop old bridge/generation, start a new process with the composed overlay). The running product overlay inserts that local plugin path with bounded JSON `config` (no user YAML interpolation). After `initialize`, a Wisp extension inventory (expanded `wisp.inventory` or equivalent ready payload) reports the mounted plugin id, revision, contributed tool names and a nonsecret config digest. Native status matches that snapshot. Disabling removes the insert, restarts, and the demonstration tool is absent. Configure writes only a bounded nonsecret note/label into the plugin row `config`; Apply restarts so the new config is what the loader sees. SDK `patchReload: startup` and the disabled `hmr` row are respected: there is no live `loader.create` mount/unmount on a live stdio session. Failed start leaves an honest unavailable engine with the saved snapshot retained; Wisp does not silently keep the old process or auto-revert. Identity, selected home, durable memory and Models route survive plugin Apply.

3. **Compatibility is fail-closed before executable load.** A static, Wisp-owned classifier decides mount eligibility from declared plugin id, provenance (covered product path + integrity copy like other product overlay files), inject list, and overlay operations — without executing plugin `apply()`. Only catalog id `wisp-compatible-plugin` may be mounted in normal mode. Attempts to insert disabled stock rows (`tool-bash`, `tool-fs`, `tool-web`, `tool-skill`, `tool-subagent*`, MCP/skill/web/telemetry/HMR rows already disabled in `product.patch.yml`), unknown plugin ids, npm/git specs, or plugins that would register tools without a Wisp admission adapter, are refused and shown as incompatible. Cordis is not an OS sandbox: Wisp does not “try loading” unknown code to inspect it. Arbitrary user-selected JavaScript folders and `dsh plugin --profile sdk add <package>` are unavailable in this slice, not deferred silent enablement. Plugin-supplied models/providers cannot replace or add Models routes; Connections/MCP and Skills remain their own sections and stay unavailable.

4. **Installation is not permission. Startup side effects are explicit.** The demonstration plugin’s `apply()` registers one harmless ledger-append tool and admits it through the existing 06 policy (`ctx.wispPermissions.admit`) with a new closed source id such as `wisp-compatible-plugin` / tool `wisp_compatible_check`. It performs no network, no writes outside the launch-owned ledger, no child spawn, and no credential discovery. A native Install confirmation states that the plugin can register tools and that Wisp will still ask before each action; Cancel performs zero overlay change. After a successful install, withhold/deny/cancel of that tool yield zero ledger effect and Allow Once yields one exact record through the same native buttons as 06. A saved key, plugin installation, model selection or spoken/typed “yes” is not a grant. The 06 developer fixture `wisp-local-permission-plugin` remains `WISP_PERMISSION_FIXTURES` / `--developer` only and is not the Plugins catalog install target. Admission stays sealed after loader settlement: extra unadmitted tools fail initialize (`WISP_INVENTORY`); missing mapped tools fail closed. Unknown/reload/registry replacement still invalidates grants.

5. **Product invariants and later-slice boundaries.** One companion UUID and Wisp home persist across plugin Apply/restart. Transparent-region click-through, body movement, Settings close/reopen, menu navigation and Quit remain. No chat window, prompt composer, conversation history or Harness UI. Models remains the sole owner of reasoning keys and provider choice. Permissions continues to show Ask / unavailable categories, including that a mounted compatible plugin still requires Allow Once and that MCP, skills, general third-party plugins, stock computer-control tools and external children stay blocked. Plugin Apply cancels pending approvals and owned engine work through the existing stop/restart generation rules; it does not add voice features and does not assume slice 07 works. Slice 11 plugin-delivered Connections and slice 12 skills are not implemented; any such plugin class stays unavailable with a recorded 11/12 obligation.

6. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS/protocol/overlay/classifier/admission tests pass on this host. Isolated product-adapter tests (when a prepared pin runtime exists) prove: default composition has no demonstration tool; enabling composes the insert and initialize inventory contains exactly the admitted set; disabling removes it; incompatible overlays are refused before spawn; 06 developer plugin path still 0/0/0/1 when fixtures are on. Native Swift sources may be written on Linux but remain uncompiled/unverified here. Actual macOS Settings pointer/keyboard, NativeChecks, live local Ollama demonstration-tool 0/0/0/1, and restart persistence are Mac/human backlog items, not Linux passes. No reserved DeepSeek call, model download, key inspection, merge, publish or spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07 Shipped.

## Out

- Promising every upstream or third-party Harness plugin works unchanged.
- Named marketplace catalogs, `dsh plugin` pnpm/npm/git install, remote package fetch, or loading arbitrary user JavaScript.
- Treating Cordis as an OS sandbox, or treating Install confirmation as Allow Once.
- MCP / custom Connections (11), skills (12), wake-word (18), proactivity behavior (20), remote doorways (21).
- Plugin-supplied reasoning providers, credential stores, web/chat UI, HMR, stock shell/filesystem/web/job tools, or general sub-agent enablement.
- Voice-loop acceptance, always-listening, computer-control actions (09), hardware onboarding (08), pet catalogs (13), release (14).
- Spending the reserved DeepSeek agent call, downloading models, inspecting keys, merging PRs, publishing, signing or deploying.
- Editing accepted `spike/`, slice archives 01–06, or marking 07 Shipped / writing `slices/07-*.md`.
- Inventing SDK plugin list/install/remove RPCs or calling Harness web settings controllers.

## Constraints

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`; `prepare-product.mjs` continues to copy an explicit file list into the prepared runtime with pin/copy checks. Recovering the pin clone at `$WISP_HARNESS` (default `$HOME/wisp-work/deepseek-harness`) is ordinary external-source recovery, not a new integration. Only a porcelain-clean clone at that revision may support implementation-time source claims.

**Verified plugin seam (do not invent APIs).** Inspected pin facts:

- Architecture: a running `dsh` is a plugin tree composed at boot from ordered bundle layers, then the profile `cordis.patch.yml`, then `--patch` overlays. The SDK template sets `patchReload: startup` because replacing stdio-application dependencies after it owns work would invalidate that lifecycle.
- `packages/boot/app-boot/src/profile.ts` exports `initProfile`, `readProfileManifest`, `writeProfileManifest`, `loadProfile`, `composeEntries`. Those mutate `$DSH_HOME/profiles/<name>`, not the Wisp application-support store.
- `apps/cli/src/plugin.ts` is a thin **pnpm forwarder** (`dsh plugin --profile <name> add|remove|…`) that may network-install and then reconcile `dsh.profile.bundles`. It is **not** a Wisp UX, not exercised by 01/06, and not this slice’s install path. Wisp’s per-launch DSH_HOME is already an ephemeral engine home; durable plugin enablement cannot live only there.
- Stock SDK JSON-RPC dispatch remains initialize / `session/prompt` / shutdown. Plugin inventory/lifecycle RPCs do not exist there. Wisp may add **Wisp extension** notify/fields (as 06 did for approvals), with a closed schema. Do not call web controllers.
- 01/06 already proved: product overlay `--patch` insert of a locally authored plugin path; `ctx.get('loader')?.await()` then admission `seal()`; one developer plugin registering `wisp_plugin_check`. General third-party install remains **conditional** in `docs/engine-capabilities.md`.

Therefore slice 10 wraps **only** overlay insert/remove of a Wisp-owned local plugin path plus process replacement. It does not claim `dsh plugin add`, live HMR, or loader hot-create.

**Demonstration plugin (supported path).** Contracted demo:

- Id: `wisp-compatible-plugin`
- Covered sources under `desktop/engine/` (exact filename is an implementation choice), copied by `prepare-product.mjs`
- Cordis exports `name`, `inject: ['tools','wispPermissions']`, `apply(ctx, config)`
- One tool `wisp_compatible_check` with the same harmless append-test-record contract as 06 (launch-owned 0600 ledger, `O_NOFOLLOW`, consume grant then synchronous write)
- Bounded config: optional nonsecret `note` matching `^[A-Za-z0-9_-]{1,40}$` (or empty), shown in the native approval fields so configure is observable
- Default: **not installed** so normal-mode inventory stays free of this tool
- Distinct from `wisp-local-permission-plugin` / `wisp_plugin_check`

An incompatible fixture used in tests (for example a patch that would insert `tool-bash`, or a plugin that registers `unadmitted_tool`) is catalogued as unavailable and never mounted. Named marketplaces are not required.

**Permissions (06 obligations carried in).** Installing/enabling does not admit arbitrary tools and does not set Allow Always. Native Allow Once / Deny / Cancel Request / Escape/close remain the gate. Expand the closed admission/native/protocol allowlists to the new source/tool pair only when that plugin is actually loaded; do not pre-admit it when unmounted (seal would fail the other way). Keep 06 route table: MCP/skills/external children/nested PTC/stock executable tools stay disabled. Child `approvalPolicy: never` unchanged. Plugin Apply/home/model Apply/Quit still revoke unused grants and wait for owned release. Do not weaken permission, privacy, credential, cancellation or release safeguards to make tests pass. 06 tests that construct their own overlay and expect the developer fixture must keep passing when the 10 catalog plugin is disabled (the default).

**Native management.** Follow Models/Memory: a `PluginsView` in the existing Settings window; `ManagementState` plugins copy becomes inventory-backed; reuse `stopReasoning` / `startAttachment` generation ownership rather than a second bridge. Plugin Apply is frozen while `modelBusy`/`homeBusy`. Unsaved plugin draft is distinct from saved/active. Confirm Install and Remove. Tab order and no affirmative default on confirmation sheets. Diagnostics may show a safe plugin count/id/status, never raw plugin errors, paths that leak homes, or credentials.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host may author JS/protocol tests, overlay/classifier logic and native Swift sources. Linux checks do not establish macOS Settings, AppKit, Keychain, shortcut, microphone or audible behavior. Mocks and source inspection are supplemental. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not claim macOS Settings proof from Linux. Do not mark 07 Shipped. Do not spend the reserved DeepSeek call, download models, inspect keys, merge, publish or spend money. Slice 07 voice is not assumed working; if 10 touches the shared Apply/restart path, record a 07 retest obligation without treating 07 Done when as satisfied.

**Later slices.** Do not implement 11–12, 18, 20, 21. Do not resolve SLICES Open decisions. If a Connection is later plugin-delivered, 11 depends on 10; this slice leaves that class unavailable and records the obligation.

## Data / state impact

New durable state is a versioned, bounded, owner-only plugin snapshot under existing application-support (same descriptor-relative, no-follow, revision, directory-lock pattern as reasoning/memory). It stores catalog id, enabled flag, nonsecret config, revision — not plugin JavaScript (code stays covered product overlay files). No secrets, no marketplace index, no plugin enablement inside editable Wisp-home memory files. Pending Install/Remove drafts are process memory until Apply. Restart restores the last saved snapshot, not in-flight drafts.

Engine overlay is generated at each attach from product.patch.yml + memory insert + optional developer fixture + optional compatible-plugin insert. User strings never form YAML syntax. Unexpected extra inserts fail closed.

Harmless ledgers remain launch-owned private files. Use fresh `$HOME/wisp-work/wisp-10/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Covered evidence: `docs/plugins.md`, updates to `docs/management-shell.md`, `docs/permissions.md` and the Plugins row of `docs/engine-capabilities.md`; sanitized `evidence/10-plugins.md` / JSON. Do not put secrets or raw engine stderr in covered artifacts. Archives 01–06 and accepted spike bytes remain immutable.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed catalog, classifier and overlay composer (Linux).** Add plugin snapshot schema, static compatibility classifier, and overlay composer that emits JSON-data inserts. Unit-test: default overlay has no demo plugin; enable emits one insert with validated config; disable omits it; incompatible ids/disabled-row inserts/unknown fields/oversize notes throw; developer fixture insert remains orthogonal. Extend `prepare-product.mjs` `productFiles` for new overlay sources. Do not execute unknown plugin `apply()` in these tests.

2. **Demonstration plugin + admission (Linux, real loader when runtime exists).** Implement `wisp-compatible-plugin` with side-effect-free apply except tool register + `admit`. Expand `Admission` source and permission wire/native allowlists for `wisp_compatible_check` only when loaded. Expand `wisp.inventory` to include plugin records. Isolated runtime test: initialize default vs enabled vs disabled; seal fails if an unadmitted tool is inserted; 06 fixture overlay still admits `wisp_plugin_check` in developer mode. Registry-level withhold/deny/cancel/allow-once for the new tool (modelCalls0 analogue of `permissions-queue.mjs`).

3. **Native Plugins surface and Apply path (sources on Linux, uncompiled here).** `PluginStore`, `PluginsView`, ManagementState/Settings/CompanionController wiring, confirmation sheets. Reuse engine replacement; pass saved plugin snapshot into bridge bootstrap (nonsecret). Update Permissions/Diagnostics copy. Native assertion sources for schema/status/cancel-install/no extra admission when disabled. Mark NativeChecks uncompiled on Linux.

4. **Docs, 06/03 regressions, identities.** Update docs to the actual supported subset. Keep 06 plugin fixture tests green with default (demo disabled). Recheck identity/memory/models attach across plugin Apply in Linux-supplemental fixtures where possible. Recompute candidate identity. Hand back proposed proof; independent Reviewer decides. Remaining Mac GUI/live/NativeChecks go to the SLICES verification backlog; do not self-approve.

Exact filenames below are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with new `desktop/tests/plugin-config.test.mjs` (and overlay/classifier tests). Cover schema/unknown-version/oversize/invalid note, enable/disable composition, incompatible refusal, no YAML interpolation, developer-fixture orthogonality, inventory schema, admission not granted by enablement flags alone. Label results Linux-supplemental. They cannot satisfy Mac GUI or live Ollama Done when items.

2. **Isolated product runtime (loader/overlay, zero cloud).** When a prepared runtime at the pin exists, run a new `plugin-overlay-runtime.mjs` (name is a choice) with `--runtime-root` / `--scratch`: actual `dsh --profile sdk --patch` initialize; default tools exclude `wisp_compatible_check`; enabled composition’s inventory includes it and only admitted names; disable removes it; hostile overlay with extra tool fails initialize; 06 `permissions-queue.mjs` / permission-protocol tests still pass with demo disabled. No cloud, no key read, no model download. If the runtime is missing, record gap class missing-external-resource / missing-platform for this item and still land Tests 1.

3. **06 plugin-tool retest (Linux analogue + Mac backlog).** Developer fixture `wisp_plugin_check` withhold/deny/cancel/allow-once remains 0/0/0/1. New demonstration tool has its own 0/0/0/1 on the same registry/native path. Install confirmation must not produce a ledger record. Queue bound, stale generation, Apply-during-pending and Quit still close grants (reuse 06 lifecycle oracles; if 10 edits those paths, 06 and 07 Apply/Quit backlog items are invalidated and must be re-run on Mac).

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains plugin snapshot/store/view-model tests: persist/reload, confirm-cancel, incompatible rows disabled, draft vs saved/active, Apply while busy refused, Permissions copy still has no Allow Always. `desktop/scripts/build-macos.sh` remains Mac-only here.

5. **Mac GUI / live (verification backlog, not Linux proof).** On the declared Mac: Settings → Plugins, keyboard traversal, Install confirm vs cancel, Configure note, Apply, restart persistence, Remove, incompatible row not enableable. Isolated home. Live local Ollama: request the demonstration tool → native Allow Once → one ledger record; deny/cancel zero; after Remove the tool is gone. Normal mode has no 06 developer tools. Preserve memory draft across plugin Apply; Models route unchanged; no Harness UI. NativeChecks pass.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, spike client, and 06 queue/lifecycle tests remain applicable. Pristine pin, byte-identical spike and archives 01–06. No 07 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.

## Proof
10-plan-063 APPROVE_PLAN consumed. Slice 10 Builder may start against contract 7f1000a6a82ea105753ba332957e871dd1b8a10e8ebcce7e9321404cd8ad1636 and baseline e6c939d979dff98819477f31ffdd49f46fd364bb70d6973e1a9112f246c57052 (165 files). Not 10 acceptance. Slice 07 remains implemented with verification pending; historical 07-review-060 HUMAN_REQUIRED unchanged.

Coordinator persisted Builder 10-draft-062 Proposed contract (worker bc-b155541c-2510-55c3-bb5f-da8089538218). No application code in the proposal commits.

## Review
10-plan-063 APPROVE_PLAN — independent reviewer bc-30670720-4361-5715-ac4c-7851fe429618. Contract 7f1000a6a82ea105753ba332957e871dd1b8a10e8ebcce7e9321404cd8ad1636 and candidate e6c939d979dff98819477f31ffdd49f46fd364bb70d6973e1a9112f246c57052 match before/after (165 files). HEAD 9447a242f1ccef20601609a56216ce3f02b468f1. Archives 01–06 untouched. 07 not Shipped. Not implementation approval. Counters 0/0. Full verbatim $HOME/wisp-work/loop-state/10-plan-063.md. Consumed.

Pending 10-plan-063 plan review of the slice 10 Proposed contract. Consumed.

10-draft-062 Builder draft-proposal complete (bc-b155541c-2510-55c3-bb5f-da8089538218). Handback $HOME/wisp-work/loop-state/10-draft-062.md. Not plan approval. Consumed.

loop-plan-061 APPROVE_PLAN — independent reviewer bc-d950b4e9-45b7-5209-ba88-2af0e6247466. Amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. 07 parked verification-pending. Full verbatim $HOME/wisp-work/loop-state/loop-plan-061.md. Consumed.

## Loop state
Tool adapter: Cursor Task generalPurpose subagent; coordinator persists dispatch ID then launches; waits for confirmed completion; Reviewer context is independent of Builder reasoning. One active worker per checkout. This Linux host cannot actuate macOS CUA; Mac physical tests remain participant-gated.
Coordinator: cursor-cloud bc-81f7c99b-f70d-4a0a-83e5-180597760926
Worker / role / phase: none (pending launch) / Builder / Building
Dispatch ID / launch state / input identity: 10-build-064 / pending launch / approved contract 7f1000a6a82ea105753ba332957e871dd1b8a10e8ebcce7e9321404cd8ad1636; baseline e6c939d979dff98819477f31ffdd49f46fd364bb70d6973e1a9112f246c57052 (165 files)
Pending result / last consumed dispatch: none / 10-plan-063
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 tools/identity.py --repo .` from repository root (replacement of unavailable ../../work/loop-state/identity.py). SHA-256 sorted relative file manifest includes git tracked and non-ignored untracked files, bytes, types, executable bits, symlink targets. Excludes .git, tools/identity.py (hashed only into contract identity), and the WISP_LOOP_STATE store if it lies inside the checkout. BUILD.md and SLICES.md contribute canonicalized bytes: BUILD stops before ## Proof; SLICES omits Run status, Release evidence, Shipped/Now/Later/Implemented-verification-pending placement headings, Implementation ledger and Verification backlog while keeping mapped slice bodies and target membership ordered by slice ID. Contract hashes BUILD through Tests, the Loop-state snapshot capture line, that SLICES canonicalization, full AGENTS/LOOP/BUILDER/REVIEWER, and tools/identity.py bytes. Manifest JSON stored outside coverage at $WISP_LOOP_STATE (default $HOME/wisp-work/loop-state). No other dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source remains an external reference; when present verify `git -C "$WISP_HARNESS" rev-parse HEAD` and porcelain status, default $HOME/wisp-work/deepseek-harness; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Historical identities below are records only and cannot be recomputed on this host. Changing identity.py rules requires plan re-review.
Baseline snapshot: e6c939d979dff98819477f31ffdd49f46fd364bb70d6973e1a9112f246c57052 (165 files; approved 10-plan-063 baseline).
Contract identity: 7f1000a6a82ea105753ba332957e871dd1b8a10e8ebcce7e9321404cd8ad1636 (approved 10-plan-063).
Candidate snapshot: e6c939d979dff98819477f31ffdd49f46fd364bb70d6973e1a9112f246c57052 (165 files; implementation candidate after 10-build-064).
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: Slice 10 implementation not started. 07 Mac gates remain backlog and do not block 10. No local Harness clone (implementation must re-verify pin). Native Swift uncompiled here.
Repair awaiting review: false
Review events: 10-plan-063 APPROVE_PLAN contract 7f1000a6a82ea105753ba332957e871dd1b8a10e8ebcce7e9321404cd8ad1636 candidate e6c939d979dff98819477f31ffdd49f46fd364bb70d6973e1a9112f246c57052; reviewer bc-30670720-4361-5715-ac4c-7851fe429618; not implementation approval; counters 0/0; verbatim $HOME/wisp-work/loop-state/10-plan-063.md. 10-draft-062 draft-proposal complete builder bc-b155541c-2510-55c3-bb5f-da8089538218; not a review verdict. loop-plan-061 APPROVE_PLAN amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66; reviewer bc-d950b4e9-45b7-5209-ba88-2af0e6247466; counters 0/0. 07-review-060 HUMAN_REQUIRED remains the last 07 implementation review (not rewritten). Accepted06 final1/0 archived.
Budget limit / consumed / measurement: no global execution budget. Cloud05 allowance6/6 exhausted and immutable. Separate one-small-agent-cloud-greeting allowance0/1spent, max1024tokens/retry0, requires explicit physicalactivation and ledger reservation beforedispatch. Four user-operated successful connectiontests050 recorded separately, not agent calls. No extra connectiontest/keyinspection/download; local per-scenario modelnoncompliancecap2. Linux host must not consume the reserved cloud greeting.
Blocker / resume status / resume action / recheck condition / deadline: none for slice 10 Building. Recheck: Builder 10-build-064 completion. No automatic paid calls/downloads. Counters0/0.
Advance phase: none
Next slice ID / draft: 10 / implementing

## Status
Building

## Next
Independent Builder 10-build-064 against approved 10-plan-063. Do not mark 07 or 10 Shipped. Counters 0/0.
