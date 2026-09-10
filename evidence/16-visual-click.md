# Slice 16 — Drawn Canary visual-click fallback (implementation evidence)

Builder candidate proof for dispatch **16-build-096**. This is not independent review, not slice 16 acceptance, and not APPROVE_IMPLEMENTATION. Slices 07–13, 15, 16, and 17 are **not Shipped**. Native Swift / owned-window bitmap / `NSEvent` / fixture GUI are **uncompiled/unverified on this Linux host**. Builder cannot approve.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215` (re-verified porcelain clean). No DeepSeek call, model download, key inspection, merge, publish or spend. No secrets, bitmaps, other-app titles, keys or bootstrap frames.

HEAD at dispatch: `ff502109b380d10389fc18f4c1121c9dc5e94a99`. Contract identity must remain `a393b6a83c128955c199329d224f8a3b56d9b5fa9358727b9dc32077e8f5fa98`.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

**241/241 pass, fail 0** (Linux-supplemental Node unit checks plus `identity.py --self-test`). Coverage includes:

- Closed tool/operation/arg tuple for `wisp_visual_click_drawn`; source `wisp-visual`; destination `visual-fixture-canary:Drawn Canary`
- Exact `{title,target}` accept; `Fixture Button` and other titles/targets/extra keys/non-strings rejected before any recording-driver call
- Unique / zero / ambiguous match rules on the recording driver without rastering pixels or posting mouse events
- Permission-protocol accepts the `wisp-visual` pair and rejects wrong source, wrong operation, other names and extra keys; existing 06/09/11/12/15 pairs still validate
- Withhold/deny/cancel/allow-once 0/0/0/1 on a recording visual driver; deny/cancel never increment visual-driver counts and never notify native
- Native-visual RPC timeout does not retry; one grant ⇒ at most one driver invocation; stale complete does not increment
- 15 recording-AX still 0/0/0/1; `FIND_NAMES` stay Fixture Button / Fixture Field / Fixture Marker; Drawn Canary is not an AX find name
- 09 recording-opener still 0/0/0/1; `file:` / `javascript:` / `/etc` still fail
- Overlay still disables `tool-bash` / `tool-fs` / `tool-web` / `tool-pwsh`
- Inventory helper: default includes 09 three + 15 six + 16 one and excludes `skill` / `wisp_compatible_check` / `mcp__` unless those snapshots are enabled
- Visual request/ack events cannot enter TTS; ax-request and open-request remain distinct
- Product visual sources do not name forbidden helper effect paths; Swift visual driver source uses owned-window `bitmapImageRepForCachingDisplay` / `cacheDisplay` and `NSEvent`

`desktop/tests/plugin-overlay-runtime.mjs`, `connection-overlay-runtime.mjs` and `skill-overlay-runtime.mjs` now also assert `wisp_visual_click_drawn` on a prepared pin runtime. This host has no prepared `.wisp-spike.json` runtime. **Test 2 gap class: missing-external-resource.** Isolated pin-runtime initialize was **not** run.

## Native (uncompiled here)

Sources: `VisualClickDriver.swift` (protocol + recording double + `#if canImport` owned-window raster + `NSEvent`), `AccessibilityFixtureWindow.swift` Drawn Canary view + `Drawn Count`, PermissionState/PermissionWindow visual tuple, EngineBridge `visual-request` / `completeVisual`, CompanionController `visual-request` receive (not voice-result), ManagementState Permissions Ask-each-time copy, `VisualClickDriverTests` in NativeChecks. `desktop/scripts/test-native.sh` lists `VisualClickDriver.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

Launch / initialize / describe / execute do not request Screen Recording or Input Monitoring. The visual path does not call `AXUIElement`. Drawn Count increments from mouse-up on the canary view, not a private bypass.

## 06 / 07 / 09 / 10 / 11 / 12 / 15 retest obligations (not claimed here)

16 edits permission-protocol / PermissionState / `consume()` call sites in the new visual tool, CompanionController receive, EngineBridge allowed events, overlay-runtime inventory lists, product-sdk admission/inventory, and the AX fixture window size/layout.

1. **06 retest:** fixture pairing, queue 8, Cancel-first, no Allow Always. Linux analogue: existing permission-protocol tests plus the visual tuple; native tab order / no Allow Always remain NativeChecks (uncompiled here).
2. **07 retest:** shortcut/Wake, no auto-listen after Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Visual request/ack must not enter TTS. Do not spend DeepSeek 0/1. Linux analogue: voice-seams / visual-ack-not-TTS tests; not audible proof.
3. **09 retest:** three Direct names still present; `file:` / `javascript:` / `/etc` still fail; recording-opener 0/0/0/1; open-request still independent of ax-request and visual-request. Do not treat NSWorkspace or live Ollama as passed.
4. **15 retest:** six `wisp-ax` names still present; recording-AX 0/0/0/1; Deny/Cancel still zero AX-driver calls; Fixture Button remains AX-only; unknown AX names still fail before prompt; FIND_NAMES unchanged; fixture window grew to fit Drawn Canary (AX nudge fallback size updated). Do not treat parked-15 Mac AX/TCC/GUI as passed.
5. **10/11/12 overlay/inventory retest:** demonstration plugin / `mcp__` / `skill` still absent until enabled; extra unadmitted tools still fail initialize; 09+15+16 Direct names present when those sources load.

Do not treat 07–15 or 17 Done when as satisfied.

## Honest gaps (LOOP class)

| Item | Gap class |
| --- | --- |
| NativeChecks compile, owned-window bitmap, `NSEvent`, fixture GUI | missing-platform |
| Declared-Mac Allow Once / Deny / Cancel canaries; Permissions copy; unique cover/hide failure | human-test + missing-platform |
| Live local Ollama 0/0/0/1 for the visual tool | missing-platform / human-test |
| Isolated pin-runtime initialize | missing-external-resource |
| 07 shortcut/mic/TTS retest; 09 NSWorkspace opener; 15 AX/TCC/GUI | human-test + missing-platform |

General desktop click remains 16.x. Windows remains 17. Open decisions 18/20/21 stay unresolved.
