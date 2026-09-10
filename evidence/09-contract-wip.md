# NOT ACCEPTED — unaccepted slice 09 working contract

This file is **not** an accepted-slice archive. Slice 09 is **not Shipped**.
Do not treat this path as `slices/09-initial-safe-computer-actions.md`.

Parked 2026-09-10 after independent **09-review-073 IMPLEMENTATION_READY** (reviewer `bc-9f34474f-ac09-5892-8b0f-d0f09eb30213`). Remaining Mac/runtime/human gaps are backlog only. Historical **07-review-060** remains **HUMAN_REQUIRED**. Linux 09-build-072 seams are implemented with verification pending.

Approved slice-09 contract: `6eb355143ee11ad341064e4bfbba3e12b6d1812aec254e6920a5f63781b35cc6`.
Implementation candidate: `acf317bbb2645a832daec8db54248cd870c4d69b22b4fbdd5dc393fb630b3714` (199 files).
Verbatim reviews: `$HOME/wisp-work/loop-state/09-review-073.md`, `$HOME/wisp-work/loop-state/09-plan-071.md`.

The body below is BUILD Slice through Tests at park time.

---

# BUILD — active contract

Slice: 09 Initial safe computer actions
Archive: (none; not shipped)

## Goal

Spoken requests produce useful, bounded desktop actions from the same Wisp: open a URL, open a file for viewing, and tell the local time, each with scoped inputs and the accepted 06 permission gate.

File and URL opening must not become an arbitrary command-execution bypass. Stock Harness `tool-bash`, `tool-fs`, `tool-web`, and shell wrappers stay disabled. Only Wisp-owned admitted tools may run, through native Allow Once / Deny / Cancel. Actions and failures are communicated through existing voice and Wisp surfaces, without a chat composer. Slice 07 is an unaccepted prerequisite: record retest after any Apply/lifecycle change; do not treat the voice loop as working.

## Done when

1. **Three Wisp-owned admitted tools, same agent, same 06 gate.** Normal-mode inventory includes exactly these new direct tools in addition to whatever 06/10 already admit when those routes are actually loaded: `wisp_open_url`, `wisp_open_file`, and `wisp_tell_time`. Source id is the closed new origin `wisp-safe-action` (Direct route in the 06 table; not a plugin, MCP, skill, or stock tool). Each call uses `ctx.wispPermissions.admit` + `seal()` as today. Native confirmation shows a trusted label, operation, exact nonsecret destination, and material fields. Controls remain Allow Once, Deny, and Cancel Request; initial focus Cancel Request; no Allow Always. A spoken or typed “yes”, model selection, plugin install, saved key, or memory instruction is not a grant. Developer fixtures `wisp_permission_check` / `wisp_plugin_check` stay `--developer` / `WISP_PERMISSION_FIXTURES` only. The 10 demonstration tool stays mount-gated. Settings → Permissions lists these three as Ask-each-time and keeps MCP, skills, third-party plugins, Accessibility (15), visual click (16), Windows (17), and stock shell/fs/web unavailable.

2. **Open URL is http/https via the platform opener after Allow Once.** Argument schema is exactly `{url}` (string). `describe()` parses with the platform URL parser, rejects anything that is not `http:` or `https:` after normalization (including `file:`, `javascript:`, `data:`, `about:`, `blob:`, `vbscript:`, custom helper schemes, empty host, userinfo/credentials, control characters, and oversize). The native request destination is the canonical URL; if the raw argument differs, both appear in fields. After Allow Once, the effect is one `NSWorkspace.shared.open(_:)` of that exact URL (default handler, no application identifier, no `OpenConfiguration.arguments`, no `/usr/bin/open`, no `open -a`, no `sh -c`, no `xdg-open`). Deny, Cancel, Escape/close, timeout, stale generation, and missing grant perform **zero** opens. Linux tests use a recording opener double and must never spawn a helper. Fetching URL content, enabling `tool-web` / `web-fetch-http`, or passing the URL to a shell is a fail.

3. **Open file is viewing only, never execute, never a command bypass.** Argument schema is exactly `{path}` (absolute POSIX path string). No `application`, `args`, `argv`, `withApp`, or extra keys. `describe()` fail-closes unless the path is absolute, lstat/O_NOFOLLOW shows a regular file, canonical `realpath` stays out of a closed privileged-prefix set, and the file is viewer-eligible (closed suffix allowlist below; directories including `.app` bundles denied; executable bit, `#!` shebang, or native executable UTI denied). Unexpected symlink follow into privileged paths is denied before a prompt. The native request destination is the canonical absolute path; if requested and resolved differ, both are shown. After Allow Once, native opens that exact file URL with `NSWorkspace.shared.open(_:)` for viewing only — never `openApplication`, never `open -a`, never Process/posix_spawn of the file, never `/usr/bin/open` with extra argv. Deny/cancel/stale/timeout: zero opens. Linux: recording double only; never `xdg-open`.

4. **Tell time is a gated local-clock tool, not model speech and not a hidden tool.** `wisp_tell_time` takes an empty argument object `{}`. Operation `read-local-clock`; destination the closed token `local-system-clock`; fields disclose that Wisp will read this device’s clock once. Allow Once is required because this is a tool effect. After consume, the body reads the process-local clock (injectable in tests; `Date` / `Intl` on Linux; native calendar APIs may mirror on Mac). It returns a bounded local display string plus ISO-8601 and the OS timezone name. No NTP, no network, no timezone override argument, no opener. Deny/cancel: zero clock reads as a tool effect. Permissions copy states that telling time uses this tool and still asks. If the model answers a time question without calling the tool, that is not a 09 clock action; do not smuggle a second unsigned clock path. Do not treat model-invented times as proof.

5. **Voice/Wisp surfaces communicate outcomes; 07 is not assumed working.** Success and failure reach the user through the existing 07 committed-assistant-text → TTS path (when voice actually runs) and through the native permission window / Permissions / Diagnostics copy. Do not add a composer, transcript, chat history, or Harness UI. Do not speak raw tool JSON, reasoning blocks, or provider errors (07 Done when 3). Pending native approval still suppresses speech. Apply, Quit, home invalidation, and bridge stop still revoke unused 09 grants and must not revive them. **Retest 07** after any edit to CompanionController Apply/lifecycle, EngineBridge, VoiceLifecycle, voice-result filtering, or permission allowlists: shortcut/Wake still usable, no auto-listen, mute preserved, no grant/reply revival, no orphan engine. Do not treat 07 Done when as satisfied. Do not spend the reserved DeepSeek greeting.

6. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS protocol, admission, validator, and recording-opener tests pass on this host. Native Swift sources may be written on Linux but remain **uncompiled/unverified** here. Actual macOS NSWorkspace opens, Settings/permission keyboard, NativeChecks compile, live local Ollama tool calls, audible confirmation, and 07 shortcut/mic/TTS retest are Mac/human backlog items, not Linux passes. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07, 08, or 10 Shipped.

## Out

- Broad application manipulation, sending, deletion, purchasing, or privileged automation (15 Accessibility, 16 visual click, 17 Windows).
- Enabling stock `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-fs-search`, `tool-web`, `web-fetch-http`, `web-search-deepseek`, jobs, workflows, goals, skills, MCP, or general sub-agents.
- `file:`, `javascript:`, `data:`, custom URL schemes, `open -a`, arbitrary argv, `sh -c`, `xdg-open`, or treating NSWorkspace.open of a `.app`/executable as “viewing.”
- Allow Always, spoken-yes grants, auto-allow for time, or a hidden unsigned clock/open path.
- Chat composer, transcript UI, Harness web UI, `dsh` CLI as the action surface.
- Voice-loop acceptance (07), hardware onboarding acceptance (08), plugin-management acceptance (10), Connections/MCP (11), skills (12), pets (13), release (14), wake-word (18), proactivity behavior (20), remote doorways (21).
- Inventing numeric performance targets, GB/VRAM cutoffs, or 15/16/17/18/20/21 scope.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Editing accepted `spike/`, slice archives 01–06, or writing `slices/07-*.md` / `slices/08-*.md` / `slices/09-*.md` / `slices/10-*.md`.
- Inventing stock SDK open-URL / open-file / clock RPCs.

## Constraints

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Inspected pin dispatch (`packages/sdk/server/src/server.ts` `handleRequest`) remains initialize / `session/prompt` / shutdown. Open/file/time are **Wisp-owned tools and Wisp extension methods**, like 06 `wisp/approval.decide`. Do not call Harness web settings controllers. Do not enable disabled overlay rows (`product.patch.yml` and `DISABLED_STOCK_IDS` already list `tool-bash`, `tool-fs`, `tool-web`, `web-fetch-http`, and related stock execution).

**Accepted 06 gate (do not weaken).** Native Allow Once / Deny / Cancel Request / Escape/close remain the only action gate. Expand the closed admission table, `permission-protocol.mjs` `validateRequest`, and `PermissionState` allowlists to the three new tool/source/operation/argument tuples only. Keep existing pairing for developer and compatible-plugin fixtures. Decision deadline stays 120 seconds. Queue bound stays 8. Grants remain ephemeral, execution-token-bound, consumed once immediately before the bounded effect. Unknown/changed arguments, destination, registration, replay, timeout, stale generation, and missing facts fail closed. Child `approvalPolicy: never` unchanged. MCP/skills/external children/nested PTC stay disabled. Cordis is not an OS sandbox: these tools are covered product sources, not a reason to mount third-party plugins.

**Unaccepted 07 (record, do not assume).** Historical `07-review-060` HUMAN_REQUIRED is unchanged. Voice is the intended user path (`session/prompt` with recognized text) but is not accepted. 09 must not add a text composer. Committed assistant text remains the only speakable payload; tool calls/results stay out of TTS. Pending approval still maps to voice phase `approval`. If 09 adds bridge events for the native opener, those events must not be treated as voice-result text. **07 retest** after CompanionController/EngineBridge/VoiceLifecycle/permission-protocol edits: shortcut/Wake, no auto-listen after Apply, mute preserved, no grant/reply revival, no orphan. Do not spend the reserved DeepSeek spoken greeting. Linux must not claim audible proof.

**Parked 08 and 10 (not dependencies).** Do not implement onboarding or plugin work. Do not copy 08 Goal. Existing `startAttachment` already stages the 10 plugin snapshot; prefer not to change stop/start unless required. If `product-sdk.ts` inventory/seal grows the default tool list, record a 10 overlay/inventory retest (`plugin-overlay-runtime.mjs` / `pluginInventory`): demonstration tool still absent until enabled; extra unadmitted tools still fail initialize. If Apply/lifecycle sources change, record the shared 07/08 Apply retest. Do not clear plugin enablement or reasoning keys because a 09 tool ran.

**No-bypass opener (URL and file).** The engine child has no AppKit. After `consume()`, URL/file effects must request the **native platform opener** over a closed Wisp extension (notify + matching complete method), then wait for one acknowledgement. Fail-closed if native does not ack within an implementation-declared lifecycle bound (tested; not a speed promise). Native re-validates the exact granted destination before opening. **Never** `child_process`, `posix_spawn`, `/usr/bin/open`, `open -a`, `osascript`, `xdg-open`, or passing the destination to a shell. Lost acknowledgement: do not retry the open (06: accepted effects are not retried). One grant ⇒ at most one opener invocation.

**URL validator (fail closed).** WHATWG/`URL` parse of the sole `url` string. Accept only protocol `http:` or `https:`. Reject userinfo, empty host, non-http(s) schemes listed in Done when 2, whitespace/control/bidi characters, and destinations that cannot be rendered inside existing field/frame limits (operation ≤80, destination ≤2048, fields ≤12, field value ≤2048, descriptor canonical ≤10000 bytes). Do not percent-decode into a different scheme. Canonical `href` is what native opens.

**File validator (fail closed).** Sole `path` key; must be absolute (`/` prefix); no NUL; no `file:` URL in this tool. `lstat` / `O_NOFOLLOW` (or `O_NOFOLLOW_ANY` where the native already uses it for homes): final object must be a regular file, not a directory, not a socket/device. `realpath` of the file must not have a prefix in this closed privileged set (path-prefix match on canonical form): `/etc`, `/private/etc`, `/System`, `/usr`, `/bin`, `/sbin`, `/var`, `/private/var`, `/dev`, `/proc`, `/root`, `/boot`, `/sys`, `/Library`, and any path containing `/Library/Keychains`. A symlink whose resolved target is in that set is denied (unexpected privileged follow). Viewer-eligible suffixes only: `.txt`, `.md`, `.markdown`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.csv`, `.json`, `.html`, `.htm`, `.rtf`. Deny executable mode bits, `#!` shebang prefix, `.app`/`.command`/`.tool`/`.sh`/`.bash`/`.zsh`/`.exe`/`.bin`/`.pkg`/`.dmg`/`.py`/`.rb`/`.pl`, and native executable UTIs when those APIs exist. Relative paths denied (cwd is not a user grant). Extra keys including `application`/`args` denied by `strict()`.

**Time tool.** Empty args only. No hidden second clock. Clock injection in tests; production reads the local OS clock of the engine process. Do not invent timezone product policy: use the OS default zone name. Do not persist readings in durable memory.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host authors JS schema/validators/admission/protocol tests and may author native Swift sources. Linux checks do not establish macOS NSWorkspace, AppKit, Keychain, shortcut, microphone, or audible behavior. Mocks, recording openers, and source inspection are supplemental. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not claim macOS open proof from a JS double. Do not mark 07, 08, or 10 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Persona / inventory.** `product.patch.yml` persona may say that URL/file/time tools exist and still require Wisp confirmation, and that denied/cancelled tools must not be retried. It is not authorization. `seal()` inventory must equal admitted names. Default normal-mode tools become the three 09 tools plus optional developer/compatible fixtures when those inserts are actually loaded.

## Data / state impact

Pending 09 requests and unused grants remain process-memory-only; restart restores neither. No durable Allow Always, no remembered URL/file allowlist, no clock history file.

Static admission metadata is versioned code (new closed adapters under `desktop/engine/`). Permissions and Diagnostics may show categorical admission status (Ask for open URL / open file / tell time; other computer-control still unavailable) and nonsecret correlation IDs. They must not dump full destinations, recognized text, answer text, keys, bootstrap frames, or raw engine stderr.

Opener invocations in tests use a recording double or an isolated canary (count only), never a user home. Harmless 06 ledgers stay launch-owned.

Use fresh `$HOME/wisp-work/wisp-09/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Covered docs: `docs/permissions.md` (Direct row now includes the three tools; stock shell/fs/web still disabled), `docs/management-shell.md` Permissions copy, `docs/engine-capabilities.md` Tools row, and a new `docs/safe-actions.md` if needed. Sanitized `evidence/09-safe-actions.md` / JSON at implementation. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07/08/10 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, durable memory, Models route, Voice settings, and the 10 plugin snapshot survive 09 tool use. Opening a file does not write memory.json.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed validators + recording opener (Linux).** Add Wisp-owned modules (names are choices) for URL parse/reject, file lstat/realpath/privileged/suffix checks, and clock read. Unit-test: http/https accept; `file:`/`javascript:`/`data:`/userinfo/custom-scheme reject; relative file reject; `/etc/passwd` reject; symlink into `/etc` reject; `.sh`/`.app`/executable-bit reject; viewable suffix under a scratch file accept; empty time args accept; extra keys fail `strict()`; recording opener is not called on describe() failure. Assert product sources do not spawn `open`/`xdg-open`/bash. Do not HTTP-fetch URLs.

2. **Admit + protocol + native-opener RPC (Linux).** Register the three tools from `product-sdk.ts` (always, normal mode) with source `wisp-safe-action`, revision `1`, consume-then-effect. Expand `Admission` union, `permission-protocol.mjs`, and body-bridge approval forwarding. Add a closed Wisp extension for URL/file open request/complete (not a stock SDK method). Registry-level withhold/deny/cancel/allow-once: URL and file 0/0/0/1 against the recording opener; time 0/0/0/1 against an injected clock. Deny/cancel never notify native. Expand `wisp.inventory` only as names already returned from `ctx.tools.schemas()`; keep 10 plugin records orthogonal. `prepare-product.mjs` `productFiles` includes new sources. Seal fails if an unadmitted name appears.

3. **Native Swift + Permissions copy (sources on Linux, uncompiled here).** Expand `PermissionRequest`/`PermissionState`/`PermissionWindow` labels for the three operations; exact URL/path in the summary; time copy discloses clock read. Native opener type uses `NSWorkspace.shared.open` only after re-validation; tests inject a double. CompanionController/EngineBridge handle new action events without treating them as voice-result. ManagementState Permissions replaces “Computer actions … unavailable” with honest Ask-each-time copy for these three and keeps 15/16 unavailable. Mark NativeChecks uncompiled on Linux.

4. **Docs, 06/07/10 regressions, identities.** Update permissions/management/capabilities docs. Keep 06 fixture 0/0/0/1. Recheck voice-seams pending-approval analogue if bridge events change. Recheck plugin inventory if default tool names change. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac NSWorkspace/live/07 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames below are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with new tests (names are choices) covering: URL scheme rejects; file privileged/symlink/suffix/relative/extra-argv rejects; time empty-args and no hidden clock; permission-protocol accept/reject for the new tuples without breaking existing fixture pairs; withhold/deny/cancel/allow-once 0/0/0/1 on a recording opener and injected clock; deny/cancel never increment opener/clock counts; stock ids remain in `DISABLED_STOCK_IDS`; overlay still disables `tool-bash`/`tool-fs`/`tool-web`. Label results Linux-supplemental. They cannot satisfy Mac NSWorkspace, Settings GUI, or live Ollama Done when items.

2. **Isolated product runtime (when a prepared pin runtime exists).** Initialize default composition: inventory includes the three 09 names; excludes `wisp_compatible_check` unless the 10 snapshot is enabled; excludes stock bash/fs/web. Hostile extra unadmitted tool still fails initialize. Registry analogue can invoke `wisp_open_url` / `wisp_open_file` / `wisp_tell_time` without a model. No cloud, no key read, no model download, no `xdg-open`. If the runtime is missing, record gap class missing-external-resource for this item and still land Tests 1.

3. **06/07/10 regression obligations (Linux analogue + Mac backlog).** Developer fixture and compatible-plugin 0/0/0/1 remain. Queue bound, stale generation, Apply-during-pending and Quit still close grants including 09 tools (reuse 06/07 lifecycle oracles). Voice: opener/ack events cannot enter TTS; pending approval still suppresses speech; stale generation cannot speak. Plugin inventory still fails if enabled demo is missing or extra tools appear. Invalidation: CompanionController receive/Apply/lifecycle, EngineBridge, VoiceLifecycle, permission-protocol, product-sdk admission/inventory, overlay composer.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains: PermissionRequest decode for the three operations; reject `javascript:` / `file:` / `/etc` / extra argv keys; confirm-cancel performs zero opener calls against a double; tab order still Cancel-first; no Allow Always; time summary names the clock. `desktop/scripts/build-macos.sh` remains Mac-only here. NSWorkspace tests are skipped or marked unverified on Linux.

5. **Mac GUI / live (verification backlog, not Linux proof).** On the declared Mac, isolated home: spoken or developer-prompted request to open a harmless `https://` URL → native details show that exact URL → Deny/Cancel zero browser activity → Allow Once opens once via default handler. Same for a viewable file under the isolated home (Preview or default viewer), and for tell time (spoken local clock after Allow Once). Rejected `file:` URL and privileged path never prompt as allowable (or prompt as unavailable, never Allow). Then **07 retest**: shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no orphan. Live local Ollama 0/0/0/1 for each tool when a model is present. NativeChecks pass. Do not spend DeepSeek 0/1.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, hardware/ollama inspect, voice-protocol/seams, and spike client tests remain applicable. Pristine pin, byte-identical spike and archives 01–06. No 07, 08, or 10 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
