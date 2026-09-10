# BUILD — active contract

Slice: 15 macOS accessibility computer control
Archive: (none; not shipped)

## Goal

Act on a closed, harmless demonstration through structured macOS Accessibility APIs, with Wisp-owned TCC guidance and the accepted 06 native Allow Once / Deny / Cancel Request gate on every effect.

Wisp remains one persistent desktop AI companion. This slice admits a closed Direct catalog that can focus and nudge one Wisp-owned fixture window, read that fixture’s focused interface, press one named fixture control, set one named fixture field, and search that fixture’s accessibility tree by exact name. It does not ship general control of arbitrary applications, Spotlight/desktop-wide search, visual clicking, or Windows UI Automation.

The pinned DeepSeek Harness at `d347e703908d0406b7a7ef80e3a0e594d86b2215` has **no** macOS Accessibility / `AXUIElement` / UI Automation computer-control tools (inspected; “accessibility” hits are web UI copy and Playwright trees only). An integration gap is not permission to invent supported Harness APIs. Product shape matches parked 09: Wisp-owned Direct tools, new source id, `consume()` immediately before the bounded native effect, native Allow Once, extra unadmitted tools fail `initialize` (`WISP_INVENTORY`).

Parked 09 is implemented with verification pending, not Shipped. Record 09 retest; do not assume NSWorkspace, live Ollama, or NativeChecks work. Slice 07 is unaccepted; record retest after bridge/permission/lifecycle edits. Slices 07–13 stay verification-pending. This slice is inside the authorized 01–21 implementation target and **outside** the macOS first-release acceptance gates (01–14).

## Done when

1. **Closed Direct catalog admitted; 06 gate unchanged; inventory honest.** Normal-mode inventory includes the six tools below **in addition to** the three parked-09 Direct names when 09 sources load (`wisp_open_url`, `wisp_open_file`, `wisp_tell_time`). Source id is the closed origin `wisp-ax` (Direct route in the 06 table; not a plugin, MCP, skill, or stock tool). Each call uses `ctx.wispPermissions.admit` + `seal()` as today. `consume()` runs on the same registered ToolDefinition immediately before the native AX request. Native confirmation shows a trusted label, operation, exact nonsecret destination, and material fields. Controls remain Allow Once, Deny, and Cancel Request; initial focus Cancel Request; no Allow Always. A spoken or typed “yes”, Skill Enable, plugin install, connection save, pet Apply, saved key, memory instruction, or **TCC being granted** is not Allow Once. Developer fixtures stay `--developer` / `WISP_PERMISSION_FIXTURES` only. The 10/11/12 demonstration tools stay mount-gated as today. Stock `tool-bash` / `tool-fs` / `tool-web` stay disabled. Extra unadmitted tools still fail initialize. Settings → Permissions lists the six as Ask-each-time **and** states that macOS Accessibility (TCC) is required, that granting TCC is not a tool grant, and that visual click (16) and Windows computer control (17) stay unavailable.

   Closed tool enum, operations, and argument schemas (exact keys; extra keys fail `strict()` / `describe()` before a prompt). All argument values are strings so native `PermissionRequest` stays `[String:String]`:

   | Tool | Operation | Arguments | Destination token | After Allow Once (native, TCC trusted) |
   |---|---|---|---|---|
   | `wisp_ax_focus_window` | `focus-fixture-window` | `{title}` | `ax-fixture-window` | One structured AX raise/focus of the fixture window |
   | `wisp_ax_move_window` | `move-fixture-window` | `{title,dx,dy}` | `ax-fixture-window` | One bounded AX position nudge of that window |
   | `wisp_ax_read_focused` | `read-fixture-interface` | `{}` | `ax-fixture-focused` | One bounded AX snapshot of the fixture focus |
   | `wisp_ax_click_named` | `press-named-control` | `{name}` | `ax-fixture-control:Fixture Button` | One `kAXPressAction` on that unique control |
   | `wisp_ax_type_named` | `set-named-text` | `{name,text}` | `ax-fixture-field:Fixture Field` | One `AXSetValue` on that unique text field |
   | `wisp_ax_find_named` | `search-fixture-tree` | `{name}` | `ax-fixture-search:<name>` | One bounded AX tree search; no press and no type |

   Closed fixture identity (this slice only):

   - Window title / `title` argument: exactly `Wisp Accessibility Fixture`
   - Press `name`: exactly `Fixture Button`
   - Type `name`: exactly `Fixture Field`
   - Find `name`: exactly one of `Fixture Button`, `Fixture Field`, `Fixture Marker`
   - `dx` / `dy`: strings matching `^-?(0|[1-9][0-9]?)$`, parsed integers in `[-64,64]`, not both `0`
   - `text`: length 1–80, no control/bidi/NUL; printable; no extra keys

   Unknown titles, names, deltas, or text fail closed **before** a native prompt. Other applications, other windows, coordinate clicks, screenshots, and keyboard synthesis are not valid destinations.

2. **Visible TCC / Accessibility guidance; no silent escalation; no always-on AX.** Settings → Permissions (and first-use copy on that page) explains in Wisp-owned language that computer control uses macOS Accessibility, how to grant it in System Settings → Privacy & Security → Accessibility, that Wisp will not act without both TCC **and** Allow Once, and that turning Accessibility on is not a standing tool grant. A user-initiated control may open the Accessibility privacy pane and may call `AXIsProcessTrustedWithOptions` **only from that control**. Launch, `initialize`, tool `describe()`, and tool execute **must not** prompt TCC, must not call `AXIsProcessTrustedWithOptions`, must not start `AXObserver` / background AX walks, and must not request Input Monitoring or Screen Recording. Native AX code runs only while handling one granted `ax-request`. If `AXIsProcessTrusted()` is false, native performs **zero** `AXUIElement` calls and completes `untrusted`; the engine does not retry. Linux has no TCC; protocol tests do not claim it.

3. **Native AX channel after consume(); fixture-only effects; recording double on Linux.** The engine child has no AppKit and no Accessibility APIs. After `consume()`, mutating and inspecting tools notify a closed Wisp extension (`wisp.ax.requested` → native `ax-request` → `wisp/ax.complete`), then wait for one acknowledgement. Fail-closed if native does not ack within an implementation-declared lifecycle bound (tested; not a speed promise). Native re-validates the granted destination and fixture identity before any AX call. **Never** `CGEvent` / `CGEventPost`, HID, screenshot targeting, click-by-coordinate, `osascript` / System Events, `/usr/bin/osascript`, `cliclick`, `posix_spawn` of user-chosen apps, `/usr/bin/open`, `open -a`, `sh -c`, or `xdg-open`. Deny, Cancel, Escape/close, timeout, stale generation, missing grant, and untrusted TCC: **zero** AX invocations (native is not notified on deny/cancel/stale; untrusted is a failed complete after consume, not a retry). Lost acknowledgement: do not retry (06: accepted effects are not retried). One grant ⇒ at most one AX operation (or one bounded fixture-tree walk for read/find).

   The demonstration target is a Wisp-owned titled fixture window, not the mascot and not Settings: created/shown by native as needed after a grant (or from the Permissions guidance control). It exposes the three named controls above plus a visible click canary (`Fixture Count: N`) and the named field. The mascot stays non-key/non-main; idle transparent regions still click through. Linux tests use a recording AX double and must never call Accessibility APIs or spawn helpers.

   Focus raises only that fixture window. Move applies `dx`/`dy` in points from the current AX position and clamps onto a visible screen (must not use the nudge to cover the whole desktop). Read returns a bounded snapshot (≤12 fields; titles/values ≤80) of the fixture focus only; if focus is not inside the fixture, fail closed and do not leak other apps. Click requires a unique `Fixture Button`; ambiguous or missing fails closed. Type sets `Fixture Field` to the granted `text` via `AXSetValue` only (not key synthesis). Find walks only the fixture subtree; unique match returns found+role; missing returns found false; ambiguous fails closed. Find never presses or types.

4. **Voice/Wisp surfaces; 07/09 not assumed working.** Success and failure reach the user through the existing 07 committed-assistant-text → TTS path (when voice actually runs) and through the native permission window / Permissions / Diagnostics copy. Do not add a composer, transcript, chat history, or Harness UI. Do not speak raw tool JSON, AX dumps, reasoning blocks, or provider errors. Pending native approval still suppresses speech. AX request/ack events must not be treated as voice-result text. Apply, Quit, home invalidation, and bridge stop still revoke unused 09 and 15 grants and must not revive them. **Retest 07** after CompanionController / EngineBridge / VoiceLifecycle / permission-allowlist edits: shortcut/Wake still usable, no auto-listen after Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan engine. **Retest 09**: Direct names still present; `file:` and `/etc` still fail; recording-opener 0/0/0/1; open-request path still works beside ax-request. **Retest 06** if permission-protocol / PermissionState / `consume()` change: fixture pairing, queue 8, cancel-first, no Allow Always. **Retest 10/11/12** inventory/overlay: demo plugin/`mcp__`/`skill` still absent unless those snapshots are enabled; hostile extra tools still fail initialize; 09+15 Direct names present when those sources load. Do not treat 07–13 Done when as satisfied. Do not spend the reserved DeepSeek greeting.

5. **Product invariants and later-slice boundaries.** Transparent-region click-through, body movement, Settings close/reopen, menu navigation, General Show Companion, and Quit remain. No chat window, prompt composer, conversation history, or Harness web/chat UI. Models remains the sole owner of reasoning keys. 09 URL/file/time stay Direct (`wisp-safe-action`). 10/11/12 stay on their existing gates. Slice 14 release, 16 visual fallback, 17 Windows UI Automation, 18 wake-word, 19 skins, 20 proactivity, and 21 remote are not implemented. Open decisions (18/20/21) stay unresolved. SLICES verification backlog item 24 (09 must not admit AX) is **superseded by this contract’s admission table**, not by 09 growing AX tools.

6. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS catalog, schema, permission-protocol, recording-AX 0/0/0/1, and overlay/inventory tests pass on this host. Native Swift sources may be written on Linux but remain **uncompiled/unverified** here (`missing-platform`). Actual macOS `AXUIElement` / TCC / fixture GUI, NativeChecks compile, live local Ollama 0/0/0/1, audible confirmation, and 06/07/09 retest are Mac/human backlog items, not Linux passes. Isolated pin-runtime initialize remains **missing-external-resource** until a prepared `.wisp-spike.json` product runtime exists. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07–13 Shipped.

## Out

- Silent privilege escalation; always-on `AXObserver`; launch-time or execute-time TCC prompts; requesting Input Monitoring or Screen Recording; inventing always-on AX.
- Visual clicking, screenshot targeting, click-by-coordinate, or any slice-16 fallback.
- Windows UI Automation or any slice-17 companion work.
- General control of arbitrary applications, other bundle ids, menu bar, Dock, Control Center, Notification Center, Spotlight, Finder desktop search, drag, scroll, resize beyond the ±64 nudge, or keyboard synthesis (`CGEvent`).
- Enabling stock `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-fs-search`, `tool-web`, `web-fetch-http`, `web-search-deepseek`, jobs, workflows, goals, or general `tool-subagent*`.
- Using pin `osascript` directory-picker / `runNativeCommand` as computer control.
- Allow Always, spoken-yes grants, treating TCC / Skill Enable / plugin install / connection save / pet Apply / saved key as Allow Once.
- Chat composer, transcript UI, Harness web UI, or `dsh` CLI as the action surface.
- Voice-loop acceptance (07), onboarding (08), safe-action acceptance (09), plugins (10), Connections (11), skills (12), pets (13), release (14), wake-word (18), proactivity behavior (20), remote doorways (21).
- Resolving SLICES Open decisions (18/20/21). Inventing numeric performance targets or GB/VRAM cutoffs.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Editing accepted `spike/`, slice archives 01–06, or writing `slices/07-*.md` through `slices/15-*.md`.
- Inventing stock SDK Accessibility / computer-use RPCs. Calling Harness web settings controllers.
- Disabling permission, privacy, credential, cancellation, or release safeguards to make tests pass.

## Constraints

**Chosen demonstration (closed; this is the contract choice).** SLICES Provides “focus/move windows, read focused interfaces, click named controls, type and search the desktop” is covered **only** against the Wisp Accessibility Fixture. Discovery: TCC guidance, read, and act share one native AX channel and are one coherent slice; they are not split. Honest remainder is later 15.x (not this contract, not 16/17):

- **15.x-apps** — other applications by bundle id / window title
- **15.x-spotlight** — Spotlight or Finder desktop-wide search (privacy expansion)
- **15.x-chrome** — menu bar, Dock, Control Center, Notification Center
- **15.x-gestures** — scroll, drag, resize beyond ±64, mouse-path

Do not pretend this slice ships every AX capability.

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Inspected pin dispatch (`packages/sdk/server/src/server.ts` `handleRequest`) remains initialize / `session/prompt` / shutdown. Inspected pin has **no** `AXUIElement`, `AXIsProcessTrusted`, `NSAccessibility` (AppKit), `kAXPress`, or UI Automation computer-control tools. Accessibility strings in the pin are web-client copy / Playwright snapshots. Host `directory-picker-native` uses `osascript` for a folder chooser — **not** a Wisp computer-control seam; do not call it. AX tools are **Wisp-owned tools and Wisp extension methods**, like 09 `wisp/open.complete`. Do not call Harness web settings controllers. Do not enable disabled overlay rows (`DISABLED_STOCK_IDS` still lists `tool-bash`, `tool-fs`, `tool-web`, `web-fetch-http`, and related stock execution).

**06 gate (do not weaken).** Native Allow Once / Deny / Cancel Request / Escape/close remain the only action gate, including actions a skill, plugin, MCP tool, or sub-agent might describe. Expand the closed admission table, `permission-protocol.mjs` `validateRequest`, and `PermissionState` allowlists with the six `wisp-ax` tuples only. Expand `Admission` source union with `'wisp-ax'`. Keep existing pairing for developer, compatible-plugin, MCP, skill, and 09 Direct fixtures. Decision deadline stays 120 seconds. Queue bound stays 8. Grants remain ephemeral, execution-token-bound, consumed once immediately before the bounded native request. Unknown/changed arguments, destination, registration, replay, timeout, stale generation, and missing facts fail closed. Child `approvalPolicy: never` unchanged. Cordis is not an OS sandbox.

**TCC is not Allow Once.** `AXIsProcessTrusted()` is an OS permission check, not a Wisp grant. Native must re-check it on each `ax-request`. Untrusted ⇒ outcome `untrusted`, zero AX. Do not cache a Wisp “always allow AX” bit. No new durable skill/plugin-style snapshot is required for admission: this slice admits the six tools in normal mode the way 09 admits URL/file/time. Do not gate them on overlay enablement.

**Unaccepted 07 (record, do not assume).** Historical `07-review-060` HUMAN_REQUIRED is unchanged. Voice is the intended user path but is not accepted. 15 must not add a text composer. Committed assistant text remains the only speakable payload. Pending native approval still maps to voice phase `approval`. **07 retest** after CompanionController / EngineBridge / VoiceLifecycle / permission-protocol edits. Do not spend the reserved DeepSeek spoken greeting. Linux must not claim audible proof.

**Parked 09 (required channel pattern; do not assume working).** 09-review-073 IMPLEMENTATION_READY, not Shipped. Copy the native round-trip pattern (`consume` → notify → native re-validate → one effect → complete). Keep `wisp.open.requested` / `wisp/open.complete` working. **09 retest**: three Direct names still present; `file:` / `javascript:` / `/etc` still fail; recording-opener 0/0/0/1. Do not treat NSWorkspace, live Ollama, or NativeChecks as passed.

**Parked 10/11/12 (inventory will grow; do not assume working).** Default inventory gains the six AX names. Demonstration plugin, `mcp__` names, and `skill` stay absent unless those snapshots are enabled. Hostile extra unadmitted tools still fail initialize. **Retest 10/11/12** overlay/inventory/runtime analogues. Do not admit AX tools from 09/10/11/12 contracts; only this slice’s admission table does.

**Parked 13.** Pet Apply must still not restart the engine. AX fixture window is not a pet and must not change companion UUID or catalog id.

**Confirmation scope.** Each of the six tools asks every time. Showing the fixture or opening the Accessibility settings pane is not a tool grant. Material AX effects require confirmation again; there is no session-wide AX consent.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host authors JS schema/validators/admission/protocol tests and may author native Swift sources. Linux checks do not establish macOS Accessibility, AppKit, TCC, shortcut, microphone, or audible behavior. Mocks, recording doubles, and source inspection are supplemental. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not mark 07–13 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- `desktop/engine/ax-actions.mjs` — closed enums, describe(), recording AX driver, native request/complete validators
- `desktop/engine/ax-action-tools.ts` — `defineTool` + `admit` for the six names; `consume()` then `requestAx`
- Evolve `product-sdk.ts` register + `wisp/ax.complete`; `approval-policy.ts` source union; `permission-protocol.mjs`; `body-bridge.mjs`; `prepare-product.mjs` `productFiles`; `product.patch.yml` persona only (keep stock rows disabled)
- Native: `AccessibilityDriver.swift` (protocol + recording double + `#if canImport` AXUIElement), `AccessibilityFixtureWindow.swift`, evolve `PermissionState.swift` / `PermissionWindow.swift` / `EngineBridge.swift` (`ax-request`) / `CompanionController.swift` receive / `ManagementState.swift` Permissions copy
- Tests: `desktop/tests/ax-actions.test.mjs`, `desktop/tests/ax-actions-protocol.test.mjs`; extend `tools/linux-js-tests.sh`; NativeChecks + `test-native.sh` list
- Docs: `docs/computer-control.md` (or equivalent); update `docs/permissions.md`, `docs/management-shell.md`, `docs/engine-capabilities.md`, `docs/safe-actions.md` boundary vs 15. Sanitized `evidence/15-accessibility.md` / JSON at implementation.

## Data / state impact

Pending 15 requests and unused grants remain process-memory-only; restart restores neither. No durable Allow Always, no remembered AX allowlist, no Wisp-side “TCC granted” snapshot that substitutes for `AXIsProcessTrusted()`, no AX history file.

Static admission metadata is versioned code. Permissions and Diagnostics may show categorical status (Ask-each-time for the six tools; Accessibility TCC trusted/untrusted as a nonsecret OS fact when native can read it; visual click and Windows still unavailable) and nonsecret correlation IDs. They must not dump AX trees, other apps’ titles, recognized text, answer text, keys, bootstrap frames, or raw engine stderr.

The fixture window is process UI, not durable identity. Creating it must not write `memory.json`, must not change companion UUID, home path, Models route, Voice, plugin/connection/skill snapshots, or pet catalog id. AX canaries live on that window only.

Use fresh `$HOME/wisp-work/wisp-15/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07–13 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, durable memory, Models route, Voice settings, plugin snapshot, connection snapshot, skill snapshot, and pet catalog id survive 15 tool use.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed validators + recording AX double (Linux).** Add Wisp-owned modules for the six describe() tuples, closed title/name/delta/text checks, and a recording driver (`calls[]`, `count`, never spawns). Unit-test: exact fixture title/name accept; other titles/names reject; `dx`/`dy` range and (0,0) reject; extra keys fail; find names outside the three reject; type control characters reject; recording driver is not called on describe() failure; product sources do not mention `CGEvent` / `osascript` / `xdg-open` as effect paths. Do not call real AX.

2. **Admit + protocol + native-AX RPC (Linux).** Register the six tools from `product-sdk.ts` (always, normal mode) with source `wisp-ax`, revision `1`, consume-then-request. Expand `Admission` union, `permission-protocol.mjs`, body-bridge forwarding, and `wisp/ax.complete`. Registry-level withhold/deny/cancel/allow-once: 0/0/0/1 against the recording driver per tool; deny/cancel never notify native. `wisp.inventory` names include 09 three + 15 six when those sources load; 10/11/12 demos still absent by default; seal fails if an unadmitted name appears. `prepare-product.mjs` `productFiles` includes new sources. Keep `wisp/open.complete` unchanged.

3. **Native fixture + AX driver + Permissions TCC copy (sources on Linux, uncompiled here).** Fixture window with closed titles/identifiers and click/type canaries. `PermissionRequest` / `PermissionWindow` labels for the six operations; exact destination in the summary; copy that TCC is not this grant. Native driver: `AXIsProcessTrusted()` then one AXUIElement operation; tests inject a double. CompanionController/EngineBridge handle `ax-request` without treating it as voice-result. ManagementState Permissions replaces “Accessibility … unavailable” with honest Ask-each-time + TCC guidance and keeps 16/17 unavailable. User-initiated “Open Accessibility Settings” control only. Mark NativeChecks uncompiled on Linux.

4. **Docs, 06/07/09/10/11/12 regressions, identities.** Add computer-control docs. Update permissions/management/capabilities/safe-actions boundary. Keep 06/09 protocol tests green. Recheck voice-seams analogue if bridge events change. Recheck overlay-runtime inventories. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac AX/TCC/NativeChecks/live/07/09 retest go to the SLICES verification backlog; do not self-approve.

Exact filenames above are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with `desktop/tests/ax-actions.test.mjs` and `desktop/tests/ax-actions-protocol.test.mjs` covering: closed tool/operation/arg tuples; unknown title/name/`dx`/`dy`/`text` rejected before any driver call; extra keys fail; permission-protocol accepts the six `wisp-ax` pairs and rejects wrong source, wrong operation, other names, and extra keys; existing 06/09/11/12 pairs still validate; withhold/deny/cancel/allow-once 0/0/0/1 per AX tool on a recording driver; deny/cancel never increment driver counts; 09 recording-opener still 0/0/0/1 and `file:` / `/etc` still fail; stock ids remain in `DISABLED_STOCK_IDS`; overlay still disables `tool-bash`/`tool-fs`/`tool-web`; inventory helper: default includes 09 three + 15 six and excludes `skill` / `wisp_compatible_check` / `mcp__` unless those snapshots are enabled. Label results Linux-supplemental. They cannot satisfy Mac AX, TCC, Settings GUI, or live Ollama Done when items.

2. **Isolated product runtime (missing-external-resource here).** When a prepared `.wisp-spike.json` exists: default initialize inventory includes the six AX names and the three 09 names; excludes `wisp_compatible_check` unless plugin enabled; excludes `mcp__` unless connection enabled; excludes `skill` unless skill enabled; excludes stock bash/fs/web; hostile extra unadmitted tool fails initialize; registry analogue can invoke each AX tool without a model (0/0/0/1 against the recording driver). This host’s nvm `pnpm` does not by itself create a prepared runtime; record missing-external-resource; do not claim initialize passed. No cloud, no key read, no model download, no real AX.

3. **06 / 07 / 09 / 10 / 11 / 12 regression obligations (Linux analogue + Mac backlog).** Developer fixture, compatible-plugin, MCP, and skill 0/0/0/1 remain when those routes load. Queue bound, stale generation, Apply-during-pending and Quit still close grants including 15 tools. Voice: ax-request/ack events cannot enter TTS; pending approval still suppresses speech; stale generation cannot speak. 09 open-request still completes independently of ax-request. Plugin/connection/skill inventories still fail if enabled demos are missing or extra tools appear. Invalidation: CompanionController receive/Apply/lifecycle, EngineBridge, VoiceLifecycle, permission-protocol, product-sdk admission/inventory, overlay composer. Do not treat 07–13 as accepted.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains: PermissionRequest decode for the six operations; reject unknown names/titles, `(0,0)` move, extra keys; confirm-cancel performs zero AX-driver calls against a double; untrusted path performs zero AXUIElement calls; tab order still Cancel-first; no Allow Always; ManagementState Permissions copy names the six, TCC guidance, and that granting Accessibility is not Allow Once, and still says visual click / Windows unavailable. `desktop/scripts/build-macos.sh` remains Mac-only here. Live AX/TCC tests are skipped or marked unverified on Linux.

5. **Mac GUI / live AX / TCC (verification backlog, not Linux proof).** On the declared Mac, isolated home: Settings → Permissions shows Ask-each-time + TCC copy; user-initiated open of Accessibility settings does not itself execute an AX tool. With TCC denied: Allow Once on any AX tool yields `untrusted` and zero fixture canary change. With TCC granted: fixture window can be shown; each of the six tools Deny/Cancel zero canary change; Allow Once is one corresponding canary (focus/move observable on the fixture; read/find return fixture-only data; click increments `Fixture Count`; type sets `Fixture Field`). Other-app titles are never returned. Then **09 retest** (URL/file/time 0/0/0/1; `file:` and `/etc` fail) and **07 retest** (shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no orphan). Live local Ollama 0/0/0/1 for each AX tool when a model is present. NativeChecks pass. Do not spend DeepSeek 0/1. Do not click arbitrary apps.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, `connection-config`, `skill-config`, `pet-config`, hardware/ollama inspect, voice-protocol/seams, safe-actions, and spike client tests remain applicable. Pristine pin, byte-identical spike and archives 01–06. No 07, 08, 09, 10, 11, 12, or 13 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
## Proof
15-build-088 Building complete. Product HEAD 7a276bac81b102fdba8b2d3c9595aac63a51ad22. Candidate 0756b7da7e25273c3a6b25eacc77dacfce6062c4e9f764f9a0fee05ec3998eea (249 files). Contract unchanged eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539. Linux-supplemental 185/185 claimed. Native Swift uncompiled. Not 15 acceptance. Slices 07–13 remain implemented with verification pending; historical 07-review-060 HUMAN_REQUIRED unchanged; 08-review-069, 09-review-073, 10-review-065, 11-review-077, 12-review-085 and 13-review-081 IMPLEMENTATION_READY unchanged; no `slices/07-*.md` through `slices/15-*.md`.

Builder 15-build-088 (worker bc-bd6d4b73-a9e0-5a28-b8b7-70af8dbbec41) implemented closed six wisp-ax Direct tools against the Wisp Accessibility Fixture, recording AX driver, consume-then-ax-request, Permissions TCC copy, docs/computer-control.md, evidence/15-accessibility.md. Handback $HOME/wisp-work/loop-state/15-build-088.md. Claims only until independent review.

15-plan-087 APPROVE_PLAN consumed. Baseline a7830c43786e0e6353266d9ecec314e74721e3425107cb64e723194827125755 (239 files). Not 15 acceptance.

Coordinator persisted Builder 15-draft-086 Proposed contract (worker bc-82e6970f-5554-539e-82db-7399c0feb7ee). No application code in the proposal commits.

## Review
Pending independent implementation review 15-review-089 of candidate 0756b7da7e25273c3a6b25eacc77dacfce6062c4e9f764f9a0fee05ec3998eea. Not consumed.

15-plan-087 APPROVE_PLAN — independent reviewer bc-2e118252-6db5-5eff-99e0-d95cafe62698. Contract eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539 and candidate a7830c43786e0e6353266d9ecec314e74721e3425107cb64e723194827125755 match before/after (239 files). Not implementation approval. Counters 0/0. Full verbatim $HOME/wisp-work/loop-state/15-plan-087.md. Consumed.

15-draft-086 Builder draft-proposal complete (bc-82e6970f-5554-539e-82db-7399c0feb7ee). Handback $HOME/wisp-work/loop-state/15-draft-086.md. Not plan approval. Consumed.

12-review-085 IMPLEMENTATION_READY — independent reviewer bc-4ee49284-8de6-510d-affa-6d6331d95162. Contract 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b. Linux 151/151 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

13-review-081 IMPLEMENTATION_READY — independent reviewer bc-c6ed81fc-4c5a-5699-8ea5-8bdec600c62d. Contract 10a33ba06c391c205ddbf579b33f2a6ccd1e3226a88b46f9fbdaa5be5d0c6d91. Linux 136/136 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

loop-plan-061 APPROVE_PLAN — independent reviewer bc-d950b4e9-45b7-5209-ba88-2af0e6247466. Amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. Consumed.

## Loop state
Tool adapter: Cursor Task generalPurpose subagent; coordinator persists dispatch ID then launches; waits for confirmed completion; Reviewer context is independent of Builder reasoning. One active worker per checkout. This Linux host cannot actuate macOS CUA; Mac physical tests remain participant-gated.
Coordinator: cursor-cloud bc-81f7c99b-f70d-4a0a-83e5-180597760926
Worker / role / phase: none (pending launch) / Reviewer / Ready for review
Dispatch ID / launch state / input identity: 15-review-089 / pending launch / approved contract eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539; implementation candidate 0756b7da7e25273c3a6b25eacc77dacfce6062c4e9f764f9a0fee05ec3998eea (249 files); baseline a7830c43786e0e6353266d9ecec314e74721e3425107cb64e723194827125755 (239 files)
Pending result / last consumed dispatch: none / 15-build-088
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 tools/identity.py --repo .` from repository root (replacement of unavailable ../../work/loop-state/identity.py). SHA-256 sorted relative file manifest includes git tracked and non-ignored untracked files, bytes, types, executable bits, symlink targets. Excludes .git, tools/identity.py (hashed only into contract identity), and the WISP_LOOP_STATE store if it lies inside the checkout. BUILD.md and SLICES.md contribute canonicalized bytes: BUILD stops before ## Proof; SLICES omits Run status, Release evidence, Shipped/Now/Later/Implemented-verification-pending placement headings, Implementation ledger and Verification backlog while keeping mapped slice bodies and target membership ordered by slice ID. Contract hashes BUILD through Tests, the Loop-state snapshot capture line, that SLICES canonicalization, full AGENTS/LOOP/BUILDER/REVIEWER, and tools/identity.py bytes. Manifest JSON stored outside coverage at $WISP_LOOP_STATE (default $HOME/wisp-work/loop-state). No other dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source remains an external reference; when present verify `git -C "$WISP_HARNESS" rev-parse HEAD` and porcelain status, default $HOME/wisp-work/deepseek-harness; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Historical identities below are records only and cannot be recomputed on this host. Changing identity.py rules requires plan re-review.
Baseline snapshot: a7830c43786e0e6353266d9ecec314e74721e3425107cb64e723194827125755 (239 files; approved 15-plan-087 baseline). Parked 12 implementation candidate 35ab842b1f877fc9080d69e0bfa96618bbf79213443246ec92ea60c34be92416 (238 files) retained as record.
Contract identity: eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539 (approved 15-plan-087).
Candidate snapshot: 0756b7da7e25273c3a6b25eacc77dacfce6062c4e9f764f9a0fee05ec3998eea (249 files; 15-build-088).
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: Linux 185/185 supplemental claimed by Builder; independent Reviewer must reproduce. Remaining: NativeChecks/Mac AX/TCC/GUI (missing-platform/human-test); pin-runtime initialize (missing-external-resource); 06/07/09/10/11/12 retest. Not 15 Shipped.
Repair awaiting review: false
Review events: 15-build-088 Building complete candidate 0756b7da7e25273c3a6b25eacc77dacfce6062c4e9f764f9a0fee05ec3998eea contract eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539; builder bc-bd6d4b73-a9e0-5a28-b8b7-70af8dbbec41; not a review verdict. 15-plan-087 APPROVE_PLAN contract eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539 candidate a7830c43786e0e6353266d9ecec314e74721e3425107cb64e723194827125755; reviewer bc-2e118252-6db5-5eff-99e0-d95cafe62698; not implementation approval; counters 0/0; verbatim $HOME/wisp-work/loop-state/15-plan-087.md. 15-draft-086 draft-proposal complete builder bc-82e6970f-5554-539e-82db-7399c0feb7ee; not a review verdict. 12-review-085 IMPLEMENTATION_READY contract 8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b; reviewer bc-4ee49284-8de6-510d-affa-6d6331d95162. 13-review-081 IMPLEMENTATION_READY contract 10a33ba06c391c205ddbf579b33f2a6ccd1e3226a88b46f9fbdaa5be5d0c6d91; reviewer bc-c6ed81fc-4c5a-5699-8ea5-8bdec600c62d. loop-plan-061 APPROVE_PLAN amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. 07-review-060 HUMAN_REQUIRED remains the last 07 implementation review (not rewritten). Accepted06 final1/0 archived.
Budget limit / consumed / measurement: no global execution budget. Cloud05 allowance6/6 exhausted and immutable. Separate one-small-agent-cloud-greeting allowance0/1spent, max1024tokens/retry0, requires explicit physicalactivation and ledger reservation beforedispatch. Four user-operated successful connectiontests050 recorded separately, not agent calls. No extra connectiontest/keyinspection/download; local per-scenario modelnoncompliancecap2. Linux host must not consume the reserved cloud greeting.
Blocker / resume status / resume action / recheck condition / deadline: none for 15-review-089. Recheck: independent implementation review. No automatic paid calls/downloads. Counters0/0.
Advance phase: none
Next slice ID / draft: 15 / ready for review

## Status
Ready for review

## Next
Independent implementation review of dispatch 15-review-089. Do not mark 07, 08, 09, 10, 11, 12, 13, or 15 Shipped. Counters 0/0.
