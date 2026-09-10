# NOT ACCEPTED — unaccepted slice 08 working contract

This file is **not** an accepted-slice archive. Slice 08 is **not Shipped**.
Do not treat this path as `slices/08-hardware-aware-local-model-onboarding.md`.

Parked 2026-09-10 after independent **08-review-069 IMPLEMENTATION_READY** (reviewer `bc-e2b4ab93-9bc1-53d4-bff9-ffefcfa8d56c`). Remaining Mac/runtime/human gaps are backlog only. Historical **07-review-060** remains **HUMAN_REQUIRED**. Linux 08-build-068 seams are implemented with verification pending.

Approved slice-08 contract: `b08394f1933e5dc1595a1ddff15a49b7a21e462b310b0fc9023782e6fac305d6`.
Implementation candidate: `94f7b01f0738f573470eca4c2be1bd93dffb2ffec76f0de95117ae29f920d729` (190 files).
Verbatim reviews: `$HOME/wisp-work/loop-state/08-review-069.md`, `$HOME/wisp-work/loop-state/08-plan-067.md`.

The body below is BUILD Slice through Tests at park time.

---

# BUILD — active contract

Slice: 08 Hardware-aware local-model onboarding
Archive: (none; not shipped)

## Goal

Guide the same Wisp to a local reasoning model that can run alongside speech, or to the existing optional cloud API-key route, using honest hardware and Ollama inspection.

Wisp inspects applicable RAM, CPU, GPU/VRAM, unified-memory and disk readings; explains any reading it cannot obtain; shows Faster, Recommended and Stronger local choices plus the 05 DeepSeek cloud alternative; and gives Ollama download/setup **feedback**. Recommendations always record speech headroom and available disk. No fixed numeric performance thresholds have been specified, so Wisp must not invent GB/VRAM cutoffs, latency SLAs, or universal device support. Prefer inspect-and-recommend against an already-installed Ollama model. Do not download packages or model weights without a concrete resource plan (source, purpose, size/location, consent).

## Done when

1. **Wisp-owned onboarding on the existing Models surface.** Settings → Models (and menu Change Model, which already opens that view) presents a hardware-aware onboarding panel in addition to the accepted 05 provider/model/key controls. The panel shows: a hardware snapshot (CPU, memory, GPU/VRAM, unified-memory, disk); Faster, Recommended and Stronger local rows; a cloud-API-key alternative that reuses 05 DeepSeek (no second key store); and Ollama reachability/setup status. Diagnostics shows the same nonsecret hardware snapshot (plus existing safe engine/voice/plugin lines). Keyboard tab order includes the new controls. Refresh/inspect never starts microphone capture, never sends `session/prompt`, never auto-runs Test Connection, and never pulls a model. Cancel/revert of an onboarding Apply leaves the saved 05 route unchanged. No composer, transcript, Harness UI, or `dsh` CLI.

2. **Honest hardware readings; never fake or double-count.** Every snapshot is a closed, versioned JSON object with an explicit status per field: `available` with a measured value, or `unavailable` with a human-readable reason (not `0`, not omitted-as-present). Unified memory is a single capacity: if the platform reports unified memory (macOS Apple Silicon via IOKit/Metal `hasUnifiedMemory` and `ProcessInfo.physicalMemory`), Wisp must not also add a discrete-VRAM figure into a summed “total for the model.” Discrete system RAM and discrete GPU VRAM, when both exist, stay separate rows and are not added together. Linux collectors may read `/proc/meminfo`, `/proc/cpuinfo`, cgroup memory max when present, `statfs`/`statvfs` for volume capacity, and sysfs DRM/GPU nodes when present. On this Linux track, GPU/VRAM and unified-memory are typically unavailable and must be labeled so. macOS IOKit/Metal/unified-memory sources may be written here but remain **uncompiled/unverified** on this host. Missing files, permission errors, empty DRM, and unreachable sysfs are unavailable-with-reason, not invented numbers.

3. **Faster / Recommended / Stronger plus cloud, with speech headroom and disk, without invented thresholds.** Wisp always shows four choices:
   - **Recommended (local):** identifier `qwen3:8b` — the 05 live-tested local model, still subject to 05 identifier validation. Status follows inspection (installed / not-installed / ollama-unreachable / hardware-incomplete / fit-uncertain / disk-may-be-insufficient).
   - **Faster (local):** the installed Ollama model with the smallest reported `size` among models other than Recommended. If none, the row exists with status `unavailable` and reason `no other installed local model to rank`.
   - **Stronger (local):** the installed Ollama model with the largest reported `size` among models other than Recommended and Faster. If none, `unavailable` with an analogous reason.
   - **Cloud:** 05 DeepSeek (`deepseek-v4-flash` / `deepseek-v4-pro` already on Models). Applying it uses existing `applyModels` + Keychain; it does **not** spend the reserved DeepSeek greeting or the exhausted 05 cloud allowance.
   Slot identifiers never duplicate. Ranking uses only Ollama-reported byte `size` (a measurement), never parameter-count→RAM formulas. **No GB/VRAM/latency cutoff is specified or implemented.** A local row’s recommendation record **must** include: the hardware snapshot identity/digest; `speechHeadroom` with `reservation: "qualitative"`, `numericReservationBytes: null`, concurrent recognition+TTS disclosed, and a note that Wisp does not treat all reported memory as model budget; and disk availability (`available` bytes or `unavailable`+reason). Fit is never advertised as a guarantee that the model “runs comfortably.” Copy states model-fit uncertainty whenever memory, disk, GPU, or Ollama size is missing.

4. **Ollama inspect-and-recommend; download only with a resource plan.** Using the saved 05 loopback endpoint (same host/port grammar as `ReasoningConfiguration.localEndpoint`, `/v1` stripped), Wisp may GET `/api/version` and GET `/api/tags` (optional GET `/api/ps` for “loaded now” feedback). Timeouts are bounded; responses are size-capped; non-loopback targets remain rejected. Status includes: not detected / unreachable / version if returned / installed names+sizes. Setup feedback explains that Ollama must already be installed and listening on that loopback address. A not-installed Recommended row must **not** silently pull. Any Install/Download control stays disabled until a versioned **resource plan** is present: source (for example `ollama-library:qwen3:8b`), purpose, expected size or explicit `size-unavailable`, destination (Ollama models volume — not a dumped home path), and user consent. Cancel performs zero pull. **This Linux environment must not execute `ollama pull`, POST `/api/pull`, brew/curl model weights, or any package install.** Live pull, if later authorized, is a Mac/human backlog item that still requires that plan. Progress UI may be implemented against fixtures.

5. **Apply uses the 05 restart seam; 07 is not assumed working.** Choosing Use Recommended / Faster / Stronger / Cloud confirms if the saved route would change, then reuses `CompanionController.applyModels` → `stopReasoning` / `startAttachment`. Identity, selected home, durable memory, Voice settings, and the 10 plugin snapshot (if present) survive. Apply is frozen while `modelBusy`/`homeBusy`. Equal saved configuration is a no-op (no extra restart). Onboarding Apply cancels in-flight voice/approvals through the existing generation rules; it does not add voice features and does not satisfy 07 Done when. Hardware refresh and Ollama GET must not grant tools, inspect keys, or enable 09 URL/file actions. Models remains the sole owner of reasoning keys. Speech engines stay independent: switching a recommended local model does not change locale/voice; switching voice does not change the recommendation catalog.

6. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS schema/collector/recommend/Ollama-inspect tests pass on this host, including real `/proc` shape checks and unavailable GPU/unified/Ollama reasons. Native Swift sources may be written on Linux but remain uncompiled/unverified here. Actual macOS IOKit/Metal/unified-memory readings, Settings pointer/keyboard, NativeChecks, live `/api/tags` against an existing local model, onboarding Apply persistence, and 07 shortcut/mic/TTS retest after Apply are Mac/human backlog items, not Linux passes. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07 or 10 Shipped.

## Out

- Inventing numeric RAM/VRAM/disk/latency thresholds, “needs 16 GiB”, parameter-count→RAM formulas, or promising every Faster/Recommended/Stronger tier on every machine.
- Treating missing hardware fields as zero, summing unified memory with discrete VRAM, or fabricating GPU/unified readings on Linux.
- Downloading Ollama, model weights, speech assets, or packages in this environment without a recorded resource plan and consent; scraping ollama.com (or any remote library) for sizes.
- Auto Test Connection, `session/prompt`, cloud greeting, or spending 05’s exhausted 6/6 allowance or the reserved DeepSeek agent greeting 0/1.
- New providers, OAuth, custom headers, non-loopback Ollama, Harness web/chat UI, prompt composer, conversation history, or a second companion identity.
- Voice-loop acceptance (07), computer-control URL/file/time (09), plugin/MCP/skill work (10–12), pets (13), release (14), wake-word (18), proactivity behavior (20), remote doorways (21), Windows (17).
- Opening a browser as the install path (09). Bundling or redistributing model weights.
- Editing accepted `spike/`, slice archives 01–06, marking 07 or 10 Shipped, or writing `slices/07-*.md` / `slices/10-*.md` / `slices/08-*.md` from this proposal.
- Inventing SDK hardware or model-download RPCs.

## Constraints

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Recovering the pin clone at `$WISP_HARNESS` (default `$HOME/wisp-work/deepseek-harness`) is ordinary external-source recovery. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Hardware onboarding is **Wisp-owned**; the pinned SDK dispatch remains initialize / `session/prompt` / shutdown. Do not call Harness web settings controllers.

**Accepted 05 seams (do not regress).** Reuse `ReasoningConfiguration` / `reasoning-config.mjs` validation, loopback-only `/v1` endpoints, `applyModels`, Keychain bootstrap, conservative 8192-context / 1024-output local profile, and Test Connection as a separate explicit action. Additional local identifiers remain unverified until a real connection test; onboarding must not claim hardware fit from a name. Replace Models copy that says “No downloads or hardware recommendations are included” with truthful 08 copy. Do not import arbitrary Ollama metadata into Harness `models[]` capability fields; 05’s bounded text-only conservative configuration still applies to undescribed tags.

**Unaccepted 07 (record, do not assume).** Slice 07 is implemented with verification pending; historical `07-review-060` HUMAN_REQUIRED is unchanged. Speech is a concurrent workload: `AVAudioEngine` + on-device `SFSpeechRecognizer` + `AVSpeechSynthesizer` (07 contract). 08 must leave speech headroom **qualitatively** because no numeric reservation was specified: recommendation records always include `speechHeadroom` as above and must not present all reported RAM/VRAM as model budget. Do not start capture on Settings navigation, Unmute, hardware refresh, or model Apply (07 Done when 2). Onboarding Apply uses the same stop/start generation path that 07 already treats as cancelling voice; **retest 07** after 08 Apply (shortcut/Wake still usable, no auto-listen, mute preserved, no grant revival, no orphan engine). Do not treat 07 Done when as satisfied. Do not spend the reserved DeepSeek spoken greeting.

**Parked 10 (not a dependency).** Do not implement plugin work. If 08 only reuses `applyModels`, the plugin snapshot must still be passed into the next attach (existing `startAttachment` already stages plugins). If 08 edits that path, record a 10 overlay/inventory retest. Do not clear plugin enablement when applying a recommended model.

**No numeric thresholds (product-specified absence, not a blocker).** SLICES Open decisions and slice 08 text forbid inventing performance targets. Faster/Recommended/Stronger are Wisp labels plus inspection-backed binding rules in Done when 3 — not a promise of comfort, FPS, or tokens/s. A later user decision could add numeric floors; this slice must not smuggle them in.

**Hardware collectors.**

- Shared closed schema (exact filename is an implementation choice), version 1, unknown keys/oversize fail closed. Fields at least: `platform`, `cpu`, `memory` (including `kind`: `discrete` | `unified` | `unknown`), `gpu`, `disk`, `speechHeadroom`, `sources[]` (what was actually read), per-field `status` + `reason` when unavailable.
- Linux (this host, tested): `/proc/meminfo` (`MemTotal`, `MemAvailable` if present), `/proc/cpuinfo` (model name, processor count), cgroup `memory.max` when that file exists and is not `max` (prefer the tighter of cgroup vs MemTotal when both exist), `statfs` on `/` and on the Wisp home volume when a home is selected, sysfs `/sys/class/drm/` and vendor VRAM files only when they exist. Unified memory: `unavailable`, reason like `no standard Linux unified-memory sysfs`. GPU/VRAM on the current cloud VM: `unavailable`, reason `no drm/sysfs GPU node`. Do not call `nvidia-smi` as a required dependency.
- macOS (sources on Linux, uncompiled here): `ProcessInfo.physicalMemory`; volume `volumeAvailableCapacityForImportantUsage` (or honest unavailable); `processorCount`; Metal `MTLCreateSystemDefaultDevice()` / `hasUnifiedMemory` / `recommendedMaxWorkingSetSize` as a **hint** never added to physical RAM; IOKit GPU name when obtainable. If `hasUnifiedMemory`, `memory.kind = unified`, `unifiedBytes = physicalMemory`, discrete VRAM status `unavailable` reason `unified memory already reported`. Metal working-set is not a second RAM bank.
- Never write hardware snapshots into editable `memory.json` or diagnostics as raw sysfs dumps.

**Ollama inspect.** Derive base `http://127.0.0.1:<port>` (or localhost / `[::1]`) from the saved 05 endpoint only. GET `/api/tags` and `/api/version` only for inspect. Bound JSON parse; ignore unknown extra fields; require `name` and accept `size` as a number when present. Spike `run.mjs` already uses those GETs against a live Ollama for 01 preflight — 08 product code must not reuse spike as a UI and must not send chat completions from onboarding. `OLLAMA_MODELS` may inform which volume’s disk figure to show; do not scan that tree for secrets or weights.

**Resource plan (download gate).** Schema version 1: `source` (bounded tag matching 05 local-model grammar, optionally prefixed `ollama-library:`), `purpose` (closed enum such as `install-recommended-local-model`), `expectedBytes` (positive integer or explicit null with `sizeUnavailable: true`), `destinationKind` (`ollama-models-volume`), `consent` (boolean, default false). Persist only under private application-support (owner-only, descriptor-relative, no-follow), never in Wisp-home memory. Without `consent==true` and a valid source, any pull function throws `RESOURCE_PLAN_REQUIRED` and the UI control stays disabled. Linux tests assert the throw and that no network to non-fixture hosts occurs. Coordinator must record a plan before any future live-pull backlog item.

**Cloud and money.** Cloud 05 allowance 6/6 exhausted and immutable. Reserved DeepSeek greeting 0/1 must not be spent. 08 cloud guidance is UI + optional `applyModels(selected=deepseek)` without Test Connection. Missing key uses existing 05 `missingKey` copy.

**Permissions and product invariants.** Onboarding does not admit tools and is not Allow Once. One companion UUID. Transparent click-through, body movement, Settings close/reopen, menu Quit remain. No chat UI. Keep 06 route table. Do not weaken permission, privacy, credential, cancellation or release safeguards to make tests pass.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host may author JS schema/collectors/recommenders, Ollama inspect clients against loopback fixtures, and native Swift sources. Linux checks do not establish macOS Settings, AppKit, IOKit, Metal, Keychain, shortcut, microphone or audible behavior. Mocks and source inspection are supplemental. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not claim macOS hardware proof from `/proc`. Do not mark 07 or 10 Shipped.

## Data / state impact

Hardware snapshots and Ollama tag lists are **ephemeral process memory**, refreshed on Models/Diagnostics appearance and explicit Refresh. They are not durable memory and not prompt content.

Optional resource-plan file: versioned, bounded, owner-only under existing application-support (same directory-lock pattern as reasoning/voice). Contains no secrets.

Reasoning `config.json` remains the 05 schema; onboarding Apply writes only validated `selected` / `localModel` / existing endpoint / cloud model — no new required keys. Unexpected extra config keys still fail closed.

Diagnostics and covered evidence show CPU model, logical count, memory kind+bytes or unavailable reasons, disk available bytes or unavailable, Ollama version/model names/sizes, recommendation statuses. Never keys, bootstrap frames, recognized text, answer text, raw engine stderr, or home path dumps.

Use fresh `$HOME/wisp-work/wisp-08/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Covered docs: `docs/reasoning-models.md`, `docs/management-shell.md`, Models row of `docs/engine-capabilities.md`. Sanitized `evidence/08-onboarding.md` / JSON. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07/10 copies under `evidence/` stay labeled NOT ACCEPTED.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed schema, Linux collector, recommend(), Ollama inspect (Linux).** Add `desktop/engine/hardware-inspect.mjs` and `desktop/engine/ollama-inspect.mjs` (names are choices). Unit-test: field statuses; unavailable GPU/unified on a drm-less fixture matching this host; cgroup tighter-than-MemTotal when injected; refuse summing unified+VRAM; speechHeadroom always present with null numeric reservation; disk field required on each recommendation; Recommended binds `qwen3:8b`; Faster/Stronger unique by size; empty/unreachable Ollama; resource-plan missing ⇒ pull throws; GET-only inspect; loopback enforcement; oversize/unknown-version fail closed. A live `/proc` test asserts shape and unavailable GPU/unified/Ollama **without** baking this VM’s exact kB as a product threshold. Do not HTTP to 11434 unless a test fixture server is bound on loopback.

2. **Native Swift mirror + Models/Diagnostics UI (sources on Linux, uncompiled here).** `HardwareProbe`, onboarding view-model, ModelsView panel, Diagnostics copy, ManagementState Models/Diagnostics strings, ModelsFocus tab order, confirmation sheet for route-changing Apply. Reuse `applyModels`. Refresh off the main thread; UI always shows last snapshot or unavailable. macOS IOKit/Metal code compiled only on Mac; wrap so Linux Swift parse of the same JSON fixtures can live as NativeChecks sources. Mark NativeChecks uncompiled on Linux.

3. **Apply + no-download wiring.** Use Recommended/Faster/Stronger/Cloud → confirm → `applyModels` no-op when unchanged. Install control disabled without plan. Fixture pull transport for UI progress tests only. Prove hardware refresh does not call `testModelConnection` or voice `wake`. Identity/memory/voice/plugin snapshot survive Apply in Linux-supplemental fixtures where reachable.

4. **Docs, 05/07 regressions, identities.** Update `docs/reasoning-models.md` (onboarding, uncertainty, no thresholds, resource-plan gate). Keep 05 reasoning-config tests green. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac IOKit/live/07 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames below are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with `desktop/tests/hardware-inspect.test.mjs` and `desktop/tests/ollama-inspect.test.mjs`. Cover schema/unknown-version/oversize, `/proc` shape, unavailable GPU/unified reasons, no double-count, speechHeadroom+disk on every recommendation, ranking uniqueness, unreachable Ollama, not-installed Recommended without pull, RESOURCE_PLAN_REQUIRED, loopback-only inspect, fixture tags with sizes. Label results Linux-supplemental. They cannot satisfy Mac IOKit, Settings GUI, or live Ollama Done when items.

2. **Loopback Ollama fixture (zero cloud, zero pull).** A local HTTP fixture speaking `/api/version` and `/api/tags` (and optionally a pull endpoint that 08 must **not** call). Prove inspect maps names/sizes; prove pull is not requested on recommend/apply/refresh. If a future test names `/api/pull`, it must first install a resource plan and still use the fixture, never a public registry. No DeepSeek, no key read, no model weight bytes.

3. **05/07/10 regression obligations (Linux analogue + Mac backlog).** `reasoning-config.test.mjs` still rejects non-loopback and unknown cloud models. Voice seams: inspect/refresh is not a wake; Apply-during-pending analogue still closes grants (reuse 07 lifecycle oracles if 08 touches `applyModels`/`startAttachment`). Plugin snapshot still attached after model Apply if 10 sources remain. Invalidation: edits to CompanionController apply/lifecycle, ModelsView, HardwareProbe, inspect clients.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains hardware snapshot decode, unified-not-summed, unavailable-reason, onboarding confirm-cancel, no-op Apply when unchanged, Install disabled without plan, tab order, Diagnostics omits secrets. `desktop/scripts/build-macos.sh` remains Mac-only here. IOKit/Metal tests are skipped or marked unverified on Linux.

5. **Mac GUI / live (verification backlog, not Linux proof).** On the declared Mac: Settings → Models onboarding, keyboard traversal, Refresh, unavailable-field copy if any reading fails, Faster/Recommended/Stronger/Cloud labels, confirm vs cancel Apply, restart persistence of the chosen 05 route, Diagnostics snapshot. Isolated home. Live local Ollama: GET tags includes existing `qwen3:8b` when that resource exists; Use Recommended applies that identifier without pull; speech headroom copy visible. Then **07 retest**: shortcut/Wake, no auto-listen after Apply, mute preserved, no orphan. Cloud row may be applied only if a key is already stored; do not spend the reserved greeting or a new connection test for 08 acceptance. NativeChecks pass. Record tested hardware, model/speech combination and measured observations without turning them into product thresholds.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, voice-protocol/seams, and spike client tests remain applicable. Pristine pin, byte-identical spike and archives 01–06. No 07 or 10 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
