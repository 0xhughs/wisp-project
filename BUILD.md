# BUILD — active contract

Slice: 16 Visual computer-control fallback
Archive: (none; not shipped)

## Goal

Complete one authorized action when structured Accessibility cannot reach a control: a bounded visual click of a closed, Wisp-owned drawing, with failure handling on the same task and the accepted 06 native Allow Once / Deny / Cancel Request gate.

Wisp remains one persistent desktop AI companion. Parked 15 already admits a closed Direct AX catalog (`wisp-ax`, six tools) against the titled window `Wisp Accessibility Fixture`. That catalog can press the unique AX-named control `Fixture Button`. This slice does **not** replace that path. Visual click is a fallback for a control AX find/press cannot hit.

**Chosen demonstration (closed; this is the contract choice).** Add one painted target inside the same fixture window:

- Visible name: **Drawn Canary**
- Observation canary: **`Drawn Count: N`** (starts at 0; independent of parked-15 `Fixture Count: N`)
- The canary is a 48×48 DIP `NSView` that draws a unique pixel signature (fill sRGB `190,18,60`; centered 8×8 core sRGB `255,255,255`). It is **not** an `NSButton`. `isAccessibilityElement` is false. It has **no** accessibility title, label, or description. Human-readable “Drawn Canary” text, if shown, is drawn inside that ignored view (or another ignored view), never as an AX-named control.
- Parked-15 `wisp_ax_find_named` names stay exactly `Fixture Button` / `Fixture Field` / `Fixture Marker`. `Drawn Canary` is not an AX find name. `wisp_ax_click_named` still accepts only `Fixture Button`.

The pinned DeepSeek Harness at `d347e703908d0406b7a7ef80e3a0e594d86b2215` has **no** screenshot, `CGEvent`, `AXUIElement`, computer-use, or desktop-click tools. Inspected `packages/sdk/server/src/server.ts` `handleRequest` remains `initialize` / `session/prompt` / `shutdown`. Playwright and web-client “screenshot” / “accessibility” hits are browser-test trees, not a Wisp visual-click API. An integration gap is not permission to invent supported Harness RPCs. Do not call pin `osascript`, `runNativeCommand`, or `openNativePath` as the click path.

Parked 15 is implemented with verification pending, **not Shipped**. Do not assume AX, TCC, fixture GUI, NativeChecks, or pin-runtime initialize work. This slice builds on that unaccepted prerequisite and must record 15/06/07 (and 09/10/11/12) retest because it will expand permission-protocol, body-bridge, CompanionController, and the AX fixture. Parked 17 is a Windows body only: it has **no** `SendInput` and must not gain visual click here.

This slice is inside the authorized 01–21 implementation target (2026-09-10) and **outside** the macOS first-release acceptance gates (01–14). It does **not** ship “click anything.”

## Done when

1. **Closed Direct visual catalog; 06 gate unchanged; AX remains the Fixture Button path.** Normal-mode inventory includes **one** new tool below **in addition to** the three parked-09 Direct names and the six parked-15 `wisp-ax` names when those sources load. Source id is the closed origin `wisp-visual` (Direct route in the 06 table; not a plugin, MCP, skill, or stock tool). Each call uses `ctx.wispPermissions.admit` + `seal()` as today. `consume()` runs on the same registered ToolDefinition immediately before the native visual request. Native confirmation shows a trusted label, operation, exact nonsecret destination, and material fields (window title, target `Drawn Canary`, and copy that this is not a click on `Fixture Button`). Controls remain Allow Once, Deny, and Cancel Request; initial focus Cancel Request; **no Allow Always**. A spoken or typed “yes”, Skill Enable, plugin install, connection save, pet Apply, saved key, memory instruction, **TCC Accessibility**, or **Screen Recording / Input Monitoring** is not Allow Once. Visual targeting is not a standing grant.

   Closed tool enum (exact keys; extra keys fail `strict()` / `describe()` before a prompt). Argument values are strings so native `PermissionRequest` stays `[String:String]`:

   | Tool | Operation | Arguments | Destination token | After Allow Once (native) |
   |---|---|---|---|---|
   | `wisp_visual_click_drawn` | `click-drawn-canary` | `{title,target}` | `visual-fixture-canary:Drawn Canary` | Verify a unique Drawn Canary pixel match inside the Wisp-owned fixture, then deliver **one** left mouse down/up at that verified local point in that window. `Drawn Count` increments by 1. `Fixture Count` does not change. |

   Closed identity (this slice only):

   - `title` is exactly `Wisp Accessibility Fixture`
   - `target` is exactly `Drawn Canary`
   - Unknown titles, unknown targets (including `Fixture Button`, `Fixture Field`, `Fixture Marker`, other apps, coordinates, or empty strings), and extra keys fail closed **before** a native prompt

   Prefer structured AX: `wisp_ax_click_named` remains the only admitted click of `Fixture Button`. A visual request whose `target` is `Fixture Button` (or any AX-named fixture control) is unavailable, not a fallback. Do not route Fixture Button through pixels because AX “might be flaky.”

2. **Bounded targeting and fail-closed handling on the same task; no silent screen/input TCC.** After Allow Once, native does **not** capture the desktop, other applications, or the menu bar. It rasters **only** the Wisp-owned fixture content view in-process (`bitmapImageRepForCachingDisplay` / `cacheDisplay`, or equivalent owned-window bitmap — not ScreenCaptureKit, not `CGWindowListCreateImage` of other windows, not a full-display grab). It searches that bitmap for the documented unique signature. Outcomes:

   - **Unique match** whose centroid lies inside the 48×48 canary rect and inside the fixture content: deliver one left mouse down/up to **that** `NSWindow` at the matched local point (`NSEvent` posted to the owned window). The Drawn Canary view’s mouse-up (or equivalent hit-tested mouse event) is what increments `Drawn Count`. The visual driver must **not** increment the canary by calling a private `pressDrawn()` that bypasses the mouse event.
   - **Zero matches, more than one match, signature missing, fixture window missing, canary rect not on a visible screen, or title mismatch:** complete `failed` with categorical nonsecret detail. **Zero** mouse events.
   - **Deny, Cancel, Escape/close, timeout, stale generation, missing grant:** native is **not** notified. **Zero** bitmaps, **zero** mouse events, **zero** `Drawn Count` change.

   Do not capture before Allow Once. `describe()` uses the static destination token, not a live image. Discard the bitmap after the match; do not write screenshots to the Wisp home, memory, Diagnostics, or disk.

   Launch, `initialize`, tool `describe()`, and tool execute **must not** prompt Screen Recording or Input Monitoring, must not call `CGRequestScreenCaptureAccess` / ScreenCaptureKit prompt APIs, must not install a `CGEventTap`, and must not call `AXIsProcessTrustedWithOptions`. Prefer in-process owned-window pixels so this closed demo does not need Screen Recording. Do not add an “Open Screen Recording Settings” control in this slice. If implementation later cannot raster the owned view without a Screen Recording prompt, **stop and return a contract change** — do not silently escalate.

   Accessibility TCC is **not** required for this owned-window click and is **not** Allow Once. The visual path must not perform `AXUIElement` calls. Proving AX cannot reach Drawn Canary is a separate NativeChecks / Mac GUI assertion on the view (`isAccessibilityElement == false`; AX walk of the fixture finds no title/description `Drawn Canary`), not a TCC prompt.

3. **Native visual channel after consume(); recording double on Linux; fixture still AX-first.** The engine child has no AppKit and no CGEvent. After `consume()`, the visual tool notifies a closed Wisp extension (`wisp.visual.requested` → native `visual-request` → `wisp/visual.complete`), then waits for one acknowledgement. Fail-closed if native does not ack within an implementation-declared lifecycle bound (tested; not a speed promise). Native re-validates the granted destination and fixture identity before any bitmap or mouse event. **Never** `CGEventPost` / `CGEventPostToPid` / HID tap, click-by-arbitrary-screen-coordinate, `osascript` / System Events, `/usr/bin/osascript`, `cliclick`, `posix_spawn` of user-chosen apps, `/usr/bin/open`, `sh -c`, `xdg-open`, or pin `runNativeCommand` / `openNativePath`. Lost acknowledgement: do not retry (06: accepted effects are not retried). One grant ⇒ at most one bitmap raster and at most one mouse down/up pair.

   The demonstration target remains the Wisp Accessibility Fixture, not the mascot and not Settings. The mascot stays non-key/non-main; idle transparent regions still click through. Linux tests use a recording visual double and must never raster pixels, post mouse events, or spawn helpers.

   Parked-15 AX behavior on the same window must still hold as a **retest**, not an assumed pass: `wisp_ax_click_named` Allow Once still increments **only** `Fixture Count`; it must **not** increment `Drawn Count`. Visual Allow Once increments **only** `Drawn Count`; it must **not** increment `Fixture Count`. AX find of the three parked names still does not press. Showing the fixture from Permissions is not a tool grant.

4. **Voice/Wisp surfaces; 07/09/15 not assumed working.** Success and failure reach the user through the existing 07 committed-assistant-text → TTS path (when voice actually runs) and through the native permission window / Permissions / Diagnostics copy. Do not add a composer, transcript, chat history, or Harness UI. Do not speak raw tool JSON, bitmaps, AX dumps, reasoning blocks, or provider errors. Pending native approval still suppresses speech. Visual request/ack events must not be treated as voice-result text. Apply, Quit, home invalidation, and bridge stop still revoke unused 09, 15, and 16 grants and must not revive them.

   **Retest 06** if permission-protocol / PermissionState / `consume()` change: fixture pairing, queue 8, cancel-first, no Allow Always, Deny/Cancel still 0/0/0/1 with zero visual-driver calls.

   **Retest 07** after CompanionController / EngineBridge / VoiceLifecycle / permission-allowlist edits: shortcut/Wake still usable, no auto-listen after Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan engine.

   **Retest 09**: Direct names still present; `file:` and `/etc` still fail; recording-opener 0/0/0/1; open-request path still works beside ax-request and visual-request.

   **Retest 15**: six `wisp-ax` names still present; recording-AX 0/0/0/1; Deny/Cancel still zero AX-driver calls; Fixture Button remains AX-only; unknown AX names still fail before prompt; Permissions still states TCC is not Allow Once. Do not treat parked-15 Mac AX/TCC/GUI as passed.

   **Retest 10/11/12** inventory/overlay: demo plugin/`mcp__`/`skill` still absent unless those snapshots are enabled; hostile extra tools still fail initialize; 09+15+16 Direct names present when those sources load.

   Do not treat 07–15 or 17 Done when as satisfied. Do not spend the reserved DeepSeek greeting.

5. **Product invariants and later-slice boundaries.** Transparent-region click-through, body movement, Settings close/reopen, menu navigation, General Show Companion, and Quit remain. No chat window, prompt composer, conversation history, or Harness web/chat UI. Models remains the sole owner of reasoning keys. 09 URL/file/time stay Direct (`wisp-safe-action`). 15 AX stays Direct (`wisp-ax`). 10/11/12 stay on their existing gates. Slice 14 release, 17.x-uia, 18 wake-word, 19 skins, 20 proactivity, and 21 remote are not implemented. Open decisions (18/20/21) stay unresolved. `desktop/windows/**` stays byte-unchanged (no `SendInput`, no screenshot targeting). SLICES verification backlog item 56 (15 must not add screenshot targeting) is **superseded for this slice’s admission table only**; 15 still must not grow visual tools.

   Honest remainder is later **16.x** (not this contract, not 14/17.x-uia/18/19/20/21):

   - **16.x-apps** — other applications, other bundle ids, menu bar, Dock, Control Center, Notification Center, Spotlight
   - **16.x-drag** — drag, hover, right-click, double-click, scroll, multi-click sequences
   - **16.x-monitors** — multi-monitor targeting, other-screen coordinate spaces, clicking through occlusion via HID
   - **16.x-ocr** — OCR / reading screenshot text / sending images to the model
   - **16.x-windows** — Windows `SendInput` / screenshot visual click (not 17.x-uia; parked 17 body has no SendInput)

   Do not pretend this slice ships general screenshot clicking of the whole desktop.

6. **Observable proof with honest Linux/Mac split.** Linux-supplemental JS catalog, schema, permission-protocol, recording-visual 0/0/0/1, AX-prefer refusals, and overlay/inventory tests pass on this host. Native Swift sources may be written on Linux but remain **uncompiled/unverified** here (`missing-platform`). Actual macOS owned-window bitmap match, `NSEvent` click, fixture GUI, NativeChecks compile, live local Ollama 0/0/0/1, audible confirmation, and 06/07/09/15 retest are Mac/human backlog items, not Linux passes. Isolated pin-runtime initialize remains **missing-external-resource** until a prepared `.wisp-spike.json` product runtime exists. No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07–17 Shipped.

## Out

- Replacing structured AX with visual clicking by default; using visual click as the Fixture Button path; admitting `Fixture Button` (or any parked-15 AX name) as a visual `target`.
- General desktop clicking; other applications; Spotlight; menu bar; Dock; drag; hover; right-click; double-click; scroll; OCR; sending screenshots to the model; multi-monitor HID targeting; click-by-arbitrary-coordinate.
- `CGEventPost`, `CGEventPostToPid`, HID event taps, `CGEventTap`, `cliclick`, osascript System Events, pin `osascript` / `runNativeCommand` / `openNativePath` as the click path.
- ScreenCaptureKit, full-display grabs, `CGWindowListCreateImage` of other windows, persisting bitmaps, or capturing before Allow Once.
- Silently requesting Screen Recording or Input Monitoring at launch, initialize, describe, or execute; treating Accessibility TCC or Screen Recording as Allow Once or Allow Always.
- Windows visual click, `SendInput`, `mouse_event`, UI Access, or any 17.x-uia work. Editing `desktop/windows/**`.
- Enabling stock `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-fs-search`, `tool-web`, `web-fetch-http`, `web-search-deepseek`, jobs, workflows, goals, or general `tool-subagent*`.
- Inventing stock SDK computer-use / screenshot / CGEvent RPCs. Calling Harness web settings controllers. Treating Playwright accessibility trees or web screenshots as the Wisp visual-click API.
- Allow Always; spoken-yes grants; treating TCC / Skill Enable / plugin install / connection save / pet Apply / saved key as Allow Once.
- Chat composer, transcript UI, Harness web UI, or `dsh` CLI as the action surface.
- Voice-loop acceptance (07), onboarding (08), safe-action acceptance (09), plugins (10), Connections (11), skills (12), pets (13), release (14), AX acceptance (15), Windows companion acceptance (17), wake-word (18), proactivity behavior (20), remote doorways (21).
- Resolving SLICES Open decisions (18/20/21). Inventing numeric performance targets.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Editing accepted `spike/`, slice archives 01–06, or writing `slices/07-*.md` through `slices/17-*.md`. Marking 07–17 Shipped.
- Disabling permission, privacy, credential, cancellation, or release safeguards to make tests pass.
- Weakening Deny/Cancel: those decisions must produce **zero** click, **zero** bitmap, **zero** `Drawn Count` change.

## Constraints

**Chosen demonstration (closed; this is the contract choice).** SLICES Provides “bounded visual targeting and failure handling tied to the same task, with the same confirmation rules” is covered **only** against Drawn Canary inside `Wisp Accessibility Fixture`. Discovery: targeting, one click, and fail-closed missing/ambiguous outcomes share one native visual channel and are one coherent slice; they are not split into locate-tool plus click-tool. Honest remainder is the 16.x list in Done when 5. Do not pretend this slice ships every Provides reading of “visual computer control.”

**Source and pin.** Keep pristine Harness `d347e703908d0406b7a7ef80e3a0e594d86b2215` and full SDK/base. Do not switch to `sdk-minimal`. Do not edit upstream tracked files. Product adapter/overlay remain under `desktop/engine/`. Only a porcelain-clean clone at that revision may support implementation-time upstream claims. Inspected pin dispatch (`handleRequest`) remains initialize / `session/prompt` / shutdown. Inspected pin has **no** `CGEvent`, `CGEventPost`, ScreenCaptureKit, `AXUIElement`, or computer-use tools. Host `directory-picker-native` uses `osascript` for a folder chooser — **not** a Wisp computer-control seam; do not call it. `packages/util/native-command` `runNativeCommand` / `openNativePath` are not the click path. Visual tools are **Wisp-owned tools and Wisp extension methods**, like 09 `wisp/open.complete` and 15 `wisp/ax.complete`. Do not call Harness web settings controllers. Do not enable disabled overlay rows (`DISABLED_STOCK_IDS` still lists `tool-bash`, `tool-fs`, `tool-web`, `web-fetch-http`, `tool-pwsh`, and related stock execution).

**06 gate (do not weaken).** Native Allow Once / Deny / Cancel Request / Escape/close remain the only action gate, including actions a skill, plugin, MCP tool, or sub-agent might describe. Expand the closed admission table, `permission-protocol.mjs` `validateRequest`, and `PermissionState` allowlists with the one `wisp-visual` tuple only. Expand `Admission` source union with `'wisp-visual'`. Keep existing pairing for developer, compatible-plugin, MCP, skill, 09 Direct, and 15 AX fixtures. Decision deadline stays 120 seconds. Queue bound stays 8. Grants remain ephemeral, execution-token-bound, consumed once immediately before the bounded native request. Unknown/changed arguments, destination, registration, replay, timeout, stale generation, and missing facts fail closed. Child `approvalPolicy: never` unchanged. Cordis is not an OS sandbox.

**Prefer AX; visual is insufficient-access only.** Schema-level: visual `target` is only `Drawn Canary`. Native visual driver does not call `AXUIElement` (keeps visual execute from becoming an AX TCC prompt). NativeChecks must assert the Drawn Canary view is not an accessibility element and that an AX title/description walk of the fixture does not return `Drawn Canary`. Mac GUI must show Fixture Button still uses `wisp_ax_click_named`. Do not add Drawn Canary to parked-15 `FIND_NAMES`.

**Unaccepted 15 (required fixture and channel pattern; do not assume working).** 15-review-089 IMPLEMENTATION_READY, not Shipped. Copy the native round-trip pattern (`consume` → notify → native re-validate → one effect → complete). Keep `wisp.ax.requested` / `wisp/ax.complete` working and **separate** from `wisp.visual.requested` / `wisp/visual.complete`. Growing the fixture window to fit the canary (routine size choice; update AX nudge fallback size if the 360×220 default changes) is a 15-touch and requires **15 retest**. Do not treat NativeChecks, TCC, or fixture GUI as passed.

**Unaccepted 07 (record, do not assume).** Historical `07-review-060` HUMAN_REQUIRED is unchanged. Voice is the intended user path but is not accepted. 16 must not add a text composer. Committed assistant text remains the only speakable payload. Pending native approval still maps to voice phase `approval`. **07 retest** after CompanionController / EngineBridge / VoiceLifecycle / permission-protocol edits. Do not spend the reserved DeepSeek spoken greeting. Linux must not claim audible proof.

**Parked 09 (required channel pattern; do not assume working).** Keep `wisp.open.requested` / `wisp/open.complete` working beside ax-request and visual-request. **09 retest**: three Direct names still present; `file:` / `javascript:` / `/etc` still fail; recording-opener 0/0/0/1.

**Parked 10/11/12 (inventory will grow; do not assume working).** Default inventory gains the one visual name. Demonstration plugin, `mcp__` names, and `skill` stay absent unless those snapshots are enabled. Hostile extra unadmitted tools still fail initialize.

**Parked 13.** Pet Apply must still not restart the engine. The fixture window (including Drawn Canary) is not a pet and must not change companion UUID or catalog id.

**Parked 17.** Windows body/tray/shortcut/identity stays verification-pending. This slice must not edit `desktop/windows/**` or add `SendInput`. macOS Permissions copy may keep “Windows computer control unavailable” for UIA; visual click becomes Ask-each-time **only** for Drawn Canary on macOS.

**Confirmation scope.** The visual tool asks every time. Showing the fixture or granting any TCC is not a tool grant. A second visual click requires confirmation again; there is no session-wide visual consent.

**Linux implementation track (execution-order allowance, not acceptance).** This Linux/cloud host authors JS schema/validators/admission/protocol tests and may author native Swift sources. Linux checks do not establish macOS bitmap match, `NSEvent` delivery, AppKit, TCC, shortcut, microphone, or audible behavior. Mocks, recording doubles, screenshots of the Linux host, and source inspection are supplemental, not native proof. Mark Swift uncompiled/unverified unless a compatible runner compiles it. Do not mark 07–17 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- `desktop/engine/visual-actions.mjs` — closed enums, describe(), recording visual driver, native request/complete validators
- `desktop/engine/visual-action-tools.ts` — `defineTool` + `admit` for `wisp_visual_click_drawn`; `consume()` then `requestVisual`
- Evolve `product-sdk.ts` register + `wisp/visual.complete`; `approval-policy.ts` source union; `permission-protocol.mjs`; `body-bridge.mjs`; `prepare-product.mjs` `productFiles`; `product.patch.yml` persona only (keep stock rows disabled)
- Evolve `ax-actions.mjs` `expectedInventoryNames` to include the visual name (do not add visual operations to `AX_TOOLS`)
- Native: `VisualClickDriver.swift` (protocol + recording double + `#if canImport` owned-window raster + `NSEvent`); evolve `AccessibilityFixtureWindow.swift` (Drawn Canary view + `Drawn Count`); evolve `PermissionState.swift` / `PermissionWindow.swift` / `EngineBridge.swift` (`visual-request` / `completeVisual`) / `CompanionController.swift` receive / `ManagementState.swift` Permissions copy
- Tests: `desktop/tests/visual-actions.test.mjs`, `desktop/tests/visual-actions-protocol.test.mjs`; extend `tools/linux-js-tests.sh`; NativeChecks + `test-native.sh` list; keep `ax-actions` tests green
- Docs: update `docs/computer-control.md`, `docs/permissions.md`, `docs/management-shell.md`, `docs/engine-capabilities.md`. Sanitized `evidence/16-visual-click.md` / JSON at implementation

Exact filenames above are routine implementation choices.

## Data / state impact

Pending 16 requests and unused grants remain process-memory-only; restart restores neither. No durable Allow Always, no remembered visual allowlist, no Wisp-side “Screen Recording granted” snapshot, no screenshot history file.

Static admission metadata is versioned code. Permissions and Diagnostics may show categorical status (Ask-each-time for the visual tool; that it is fallback-only for Drawn Canary; that Fixture Button stays AX; that Screen Recording / Input Monitoring are not requested by this slice; Windows computer control still unavailable) and nonsecret correlation IDs. They must not dump bitmaps, pixel buffers, other apps’ titles, recognized text, answer text, keys, bootstrap frames, or raw engine stderr.

The fixture window remains process UI, not durable identity. Adding Drawn Canary must not write `memory.json`, must not change companion UUID, home path, Models route, Voice, plugin/connection/skill snapshots, or pet catalog id. `Drawn Count` and `Fixture Count` live on that window only.

Use fresh `$HOME/wisp-work/wisp-16/<dispatch>/` (or equivalent external) build, support, home, scratch and runtime. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07–15 and 17 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, durable memory, Models route, Voice settings, plugin snapshot, connection snapshot, skill snapshot, and pet catalog id survive 16 tool use.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Closed validators + recording visual double (Linux).** Add Wisp-owned modules for the describe() tuple, closed title/target checks, unique-signature constants, and a recording driver (`calls[]`, `count`, never rasters, never posts events). Unit-test: exact fixture title + `Drawn Canary` accept; `Fixture Button` / other titles/targets/extra keys reject before any driver call; recording driver is not called on describe() failure; product visual sources do not mention `CGEventPost`, `osascript`, `xdg-open`, ScreenCaptureKit, or `SendInput` as effect paths. Keep AX `FIND_NAMES` unchanged. Do not call real AppKit.

2. **Admit + protocol + native-visual RPC (Linux).** Register the tool from `product-sdk.ts` (always, normal mode) with source `wisp-visual`, revision `1`, consume-then-request. Expand `Admission` union, `permission-protocol.mjs`, body-bridge forwarding (`visual-request` / `visual-complete`), and `wisp/visual.complete`. Registry-level withhold/deny/cancel/allow-once: 0/0/0/1 against the recording driver; deny/cancel never notify native. `wisp.inventory` names include 09 three + 15 six + 16 one when those sources load; 10/11/12 demos still absent by default; seal fails if an unadmitted name appears. `prepare-product.mjs` `productFiles` includes new sources. Keep `wisp/open.complete` and `wisp/ax.complete` unchanged in behavior.

3. **Native Drawn Canary + visual driver + Permissions copy (sources on Linux, uncompiled here).** Fixture window gains the ignored 48×48 view, unique pixels, and `Drawn Count: N`. Mouse-up on that view increments only `Drawn Count`. `PermissionRequest` / `PermissionWindow` labels for `click-drawn-canary`; exact destination in the summary; copy that this is not Fixture Button, that AX remains preferred when it can reach a control, and that Screen Recording / Input Monitoring are not requested here. Native driver: owned-window raster → unique match → one `NSEvent` pair; tests inject a double. CompanionController/EngineBridge handle `visual-request` without treating it as voice-result and without mixing it into `ax-request`. ManagementState Permissions replaces “visual click … stay unavailable” with honest Ask-each-time for Drawn Canary and keeps Windows / general desktop click unavailable. Mark NativeChecks uncompiled on Linux.

4. **Docs, 06/07/09/10/11/12/15 regressions, identities.** Update computer-control/permissions/management/capabilities docs: visual is fallback-only; AX fixture catalog unchanged except the added ignored drawing. Keep 06/09/15 protocol tests green and extend them. Recheck voice-seams analogue if bridge events change. Recheck overlay-runtime inventories. Recheck identity.py. Hand back proposed proof; independent Reviewer decides. Remaining Mac bitmap/click/NativeChecks/live/06/07/09/15 retest go to the SLICES verification backlog; do not self-approve.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with `desktop/tests/visual-actions.test.mjs` and `desktop/tests/visual-actions-protocol.test.mjs` covering: closed tool/operation/arg tuple; `title`/`target` exact accept; `Fixture Button` and other targets rejected before any driver call; extra keys fail; permission-protocol accepts the `wisp-visual` pair and rejects wrong source, wrong operation, other names, and extra keys; existing 06/09/11/12/15 pairs still validate; withhold/deny/cancel/allow-once 0/0/0/1 on a recording visual driver; deny/cancel never increment visual-driver counts and never increment a recording AX driver; 15 recording-AX still 0/0/0/1 and `FIND_NAMES` still the three parked names; 09 recording-opener still 0/0/0/1 and `file:` / `/etc` still fail; stock ids remain in `DISABLED_STOCK_IDS`; overlay still disables `tool-bash`/`tool-fs`/`tool-web`/`tool-pwsh`; inventory helper: default includes 09 three + 15 six + 16 one and excludes `skill` / `wisp_compatible_check` / `mcp__` unless those snapshots are enabled. Label results Linux-supplemental. They cannot satisfy Mac bitmap match, `NSEvent` click, Settings GUI, TCC, or live Ollama Done when items.

2. **Isolated product runtime (missing-external-resource here).** When a prepared `.wisp-spike.json` exists: default initialize inventory includes the visual name, the six AX names, and the three 09 names; excludes `wisp_compatible_check` unless plugin enabled; excludes `mcp__` unless connection enabled; excludes `skill` unless skill enabled; excludes stock bash/fs/web; hostile extra unadmitted tool fails initialize; registry analogue can invoke the visual tool without a model (0/0/0/1 against the recording driver). This host’s nvm `pnpm` does not by itself create a prepared runtime; record missing-external-resource; do not claim initialize passed. No cloud, no key read, no model download, no real click.

3. **06 / 07 / 09 / 10 / 11 / 12 / 15 regression obligations (Linux analogue + Mac backlog).** Developer fixture, compatible-plugin, MCP, and skill 0/0/0/1 remain when those routes load. Queue bound, stale generation, Apply-during-pending and Quit still close grants including 16 tools. Voice: visual-request/ack events cannot enter TTS; pending approval still suppresses speech; stale generation cannot speak. 09 open-request and 15 ax-request still complete independently of visual-request. Plugin/connection/skill inventories still fail if enabled demos are missing or extra tools appear. Invalidation: CompanionController receive/Apply/lifecycle, EngineBridge, VoiceLifecycle, permission-protocol, product-sdk admission/inventory, overlay composer, AccessibilityFixtureWindow, ax-actions FIND_NAMES. Do not treat 07–15 or 17 as accepted.

4. **Native assertions (Mac compile; uncompiled on Linux).** `desktop/scripts/test-native.sh` gains: PermissionRequest decode for `click-drawn-canary`; reject `Fixture Button` / unknown titles / extra keys; confirm-cancel performs zero visual-driver calls against a double; untrusted-style skip still performs zero Screen Recording prompts; tab order still Cancel-first; no Allow Always; Drawn Canary view `isAccessibilityElement == false`; AX title/description walk fixture finds no `Drawn Canary`; ManagementState Permissions copy names the visual tool as Ask-each-time fallback, states Fixture Button stays AX, states Screen Recording / Input Monitoring are not requested here, and still says Windows computer control unavailable. `desktop/scripts/build-macos.sh` remains Mac-only here. Live bitmap/click tests are skipped or marked unverified on Linux.

5. **Mac GUI / live visual / 15+06+07 retest (verification backlog, not Linux proof).** On the declared Mac, isolated home: Settings → Permissions shows Ask-each-time for Drawn Canary visual click and still lists the six AX tools; no Screen Recording / Input Monitoring prompt at launch. Fixture window shows Drawn Canary and `Drawn Count: 0`. `wisp_ax_click_named` Deny/Cancel: zero `Fixture Count` and zero `Drawn Count` change; Allow Once: `Fixture Count` +1 and `Drawn Count` unchanged. `wisp_visual_click_drawn` Deny/Cancel/Escape: zero bitmap side-effect observable, zero `Drawn Count` change, zero `Fixture Count` change. Allow Once: unique pixel match then one click; `Drawn Count` +1; `Fixture Count` unchanged. Cover the fixture canary (or hide the window) and Allow Once: `failed`, zero `Drawn Count` change. Then **09 retest** (URL/file/time 0/0/0/1; `file:` and `/etc` fail), **15 retest** (six AX tools still 0/0/0/1 against the fixture; unknown AX names never allowable), **06 retest** (queue 8, Cancel-first, no Allow Always), and **07 retest** (shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no orphan). Live local Ollama 0/0/0/1 for the visual tool when a model is present. NativeChecks pass. Do not spend DeepSeek 0/1. Do not click arbitrary apps. Do not capture the desktop.

6. **Regressions and identities.** Existing `body-bridge`, `permission-protocol`, `reasoning-config`, `memory-context`, `plugin-config`, `connection-config`, `skill-config`, `pet-config`, hardware/ollama inspect, voice-protocol/seams, safe-actions, ax-actions, windows-home/body-state, and spike client tests remain applicable. Pristine pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`, byte-identical spike and archives 01–06. `desktop/windows/**` unchanged. No 07, 08, 09, 10, 11, 12, 13, 15, or 17 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Mac/human evidence.
## Proof
16-plan-095 APPROVE_PLAN consumed. Slice 16 Builder may start against contract a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98 and baseline 5ee77b68b09e4594e5a8819d76444f8802a42a1d80fe009bd738f973d6a48b9c (283 files) at HEAD e5ef81760d0f510ec21a8999e14b4cfce43ff258. Not 16 acceptance. Slices 07, 08, 09, 10, 11, 12, 13, 15 and 17 remain implemented with verification pending; unaccepted copies `evidence/07-contract-wip.md` through `evidence/17-contract-wip.md`; historical 07-review-060 HUMAN_REQUIRED unchanged; parked IMPLEMENTATION_READY reviews unchanged; no `slices/07-*.md` through `slices/17-*.md`.

Coordinator persisted Builder 16-draft-094 Proposed contract (worker bc-4f5e57e8-4f3e-581c-9ead-649c49e95340). No application code in the proposal commit.

## Review
16-plan-095 APPROVE_PLAN — independent reviewer bc-307b76c1-1d62-5e1d-8d25-7890adcac159. Contract a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98 and candidate 5ee77b68b09e4594e5a8819d76444f8802a42a1d80fe009bd738f973d6a48b9c match before/after (283 files). HEAD e5ef81760d0f510ec21a8999e14b4cfce43ff258. Archives 01–06 untouched. 07–15 and 17 not Shipped. Not implementation approval. Counters 0/0. Full verbatim $HOME/wisp-work/loop-state/16-plan-095.md. Consumed.

16-draft-094 Builder draft-proposal complete (bc-4f5e57e8-4f3e-581c-9ead-649c49e95340). Handback $HOME/wisp-work/loop-state/16-draft-094.md. Not plan approval. Consumed.

17-review-093 IMPLEMENTATION_READY — independent reviewer bc-efc175aa-9c93-5e5b-9fb5-dda53741fd30. Contract 691b64a52b69ed54447cb1e399c8ac85004c8165cf571c953f958f28a7fbf195. Linux 199/199 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

15-review-089 IMPLEMENTATION_READY — independent reviewer bc-dac81f09-21ff-5116-8729-1a43f2c26b35. Contract eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539. Linux 185/185 supplemental. Not APPROVE_IMPLEMENTATION. Consumed.

loop-plan-061 APPROVE_PLAN — independent reviewer bc-d950b4e9-45b7-5209-ba88-2af0e6247466. Amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. Consumed.

## Loop state
Tool adapter: Cursor Task generalPurpose subagent; coordinator persists dispatch ID then launches; waits for confirmed completion; Reviewer context is independent of Builder reasoning. One active worker per checkout. This Linux host cannot actuate macOS CUA; Mac physical tests remain participant-gated.
Coordinator: cursor-cloud bc-81f7c99b-f70d-4a0a-83e5-180597760926
Worker / role / phase: none (pending launch) / Builder / Building
Dispatch ID / launch state / input identity: 16-build-096 / pending launch / approved contract a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98; baseline 5ee77b68b09e4594e5a8819d76444f8802a42a1d80fe009bd738f973d6a48b9c (283 files)
Pending result / last consumed dispatch: none / 16-plan-095
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 tools/identity.py --repo .` from repository root (replacement of unavailable ../../work/loop-state/identity.py). SHA-256 sorted relative file manifest includes git tracked and non-ignored untracked files, bytes, types, executable bits, symlink targets. Excludes .git, tools/identity.py (hashed only into contract identity), and the WISP_LOOP_STATE store if it lies inside the checkout. BUILD.md and SLICES.md contribute canonicalized bytes: BUILD stops before ## Proof; SLICES omits Run status, Release evidence, Shipped/Now/Later/Implemented-verification-pending placement headings, Implementation ledger and Verification backlog while keeping mapped slice bodies and target membership ordered by slice ID. Contract hashes BUILD through Tests, the Loop-state snapshot capture line, that SLICES canonicalization, full AGENTS/LOOP/BUILDER/REVIEWER, and tools/identity.py bytes. Manifest JSON stored outside coverage at $WISP_LOOP_STATE (default $HOME/wisp-work/loop-state). No other dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source remains an external reference; when present verify `git -C "$WISP_HARNESS" rev-parse HEAD` and porcelain status, default $HOME/wisp-work/deepseek-harness; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Historical identities below are records only and cannot be recomputed on this host. Changing identity.py rules requires plan re-review.
Baseline snapshot: 5ee77b68b09e4594e5a8819d76444f8802a42a1d80fe009bd738f973d6a48b9c (283 files; approved 16-plan-095 baseline). Parked 17 implementation candidate 28bc82ae285d081a0d6639a093eeb7d023bdcddfcb51552f709cba15527f5e47 (282 files) retained as record; parked tree after evidence/17-contract-wip.md was 4f551075b5cf1e730db35dc8f4f4f9bfd2254dd8f00d4dc4b11c3f46400e95ce (283 files, 17 page).
Contract identity: a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98 (approved 16-plan-095).
Candidate snapshot: 5ee77b68b09e4594e5a8819d76444f8802a42a1d80fe009bd738f973d6a48b9c (283 files; current until 16-build-096).
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: Slice 16 implementation not started. 07–15 Mac and 17 Windows gates remain backlog and do not block 16. Native Swift visual-click uncompiled here. Drawn Canary only; general desktop click remains 16.x. Parked 15 is unaccepted; record retest.
Repair awaiting review: false
Review events: 16-plan-095 APPROVE_PLAN contract a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98 candidate 5ee77b68b09e4594e5a8819d76444f8802a42a1d80fe009bd738f973d6a48b9c; reviewer bc-307b76c1-1d62-5e1d-8d25-7890adcac159; not implementation approval; counters 0/0; verbatim $HOME/wisp-work/loop-state/16-plan-095.md. 16-draft-094 draft-proposal complete builder bc-4f5e57e8-4f3e-581c-9ead-649c49e95340; not a review verdict. 17-review-093 IMPLEMENTATION_READY contract 691b64a52b69ed54447cb1e399c8ac85004c8165cf571c953f958f28a7fbf195 candidate 28bc82ae285d081a0d6639a093eeb7d023bdcddfcb51552f709cba15527f5e47; reviewer bc-efc175aa-9c93-5e5b-9fb5-dda53741fd30. loop-plan-061 APPROVE_PLAN amendment contract d6689d48dfcf22d42a4d389f7307ebe0b659dc3bf688c706a451eb5d07612c66. 07-review-060 HUMAN_REQUIRED remains the last 07 implementation review (not rewritten). Accepted06 final1/0 archived.
Budget limit / consumed / measurement: no global execution budget. Cloud05 allowance6/6 exhausted and immutable. Separate one-small-agent-cloud-greeting allowance0/1spent, max1024tokens/retry0, requires explicit physicalactivation and ledger reservation beforedispatch. Four user-operated successful connectiontests050 recorded separately, not agent calls. No extra connectiontest/keyinspection/download; local per-scenario modelnoncompliancecap2. Linux host must not consume the reserved cloud greeting.
Blocker / resume status / resume action / recheck condition / deadline: none for slice 16 Building. Recheck: Builder 16-build-096 completion. No automatic paid calls/downloads. Counters0/0.
Advance phase: none
Next slice ID / draft: 16 / implementing

## Status
Building

## Next
Independent Builder 16-build-096 against approved 16-plan-095. Do not mark 07, 08, 09, 10, 11, 12, 13, 15, 16, or 17 Shipped. Counters 0/0.
