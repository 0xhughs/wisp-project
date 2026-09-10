# Slice 15 — Accessibility fixture computer control (implementation evidence)

Builder candidate proof for dispatch **15-build-088**. This is not independent review, not slice 15 acceptance, and not APPROVE_IMPLEMENTATION. Slices 07–13 and 15 are **not Shipped**. Native Swift / `AXUIElement` / TCC / fixture GUI are **uncompiled/unverified on this Linux host**. Builder cannot approve.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215` (re-verified porcelain clean). No DeepSeek call, model download, key inspection, merge, publish or spend. No secrets, AX dumps, other-app titles, keys or bootstrap frames.

HEAD at dispatch: `2f0fd441d0fdfd9db5897f67cbc02b9afa331373`. Contract identity must remain `eb62e35e66ea4ae865b7ab755bc749c05dc4146f4d9c126e86abbf785aa9e539`.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

**185/185 pass, fail 0** (Linux-supplemental Node unit checks plus `identity.py --self-test`). Coverage includes:

- Closed tool/operation/arg tuples for the six `wisp-ax` tools; source `wisp-ax`
- Unknown titles/names, `(0,0)` and out-of-range `dx`/`dy`, extra keys, control/bidi/oversize text rejected before any recording-driver call
- Permission-protocol accepts the six `wisp-ax` pairs and rejects wrong source, wrong operation, other names and extra keys; existing 06/09/11/12 pairs still validate
- Withhold/deny/cancel/allow-once 0/0/0/1 per AX tool on a recording driver; deny/cancel never increment driver counts and never notify native
- Untrusted complete does not increment the recording driver
- Native-AX RPC timeout does not retry; one grant ⇒ at most one driver invocation
- 09 recording-opener still 0/0/0/1; `file:` and `/etc` still fail
- Overlay still disables `tool-bash` / `tool-fs` / `tool-web` / `web-fetch-http`
- Inventory helper: default includes 09 three + 15 six and excludes `skill` / `wisp_compatible_check` / `mcp__` unless those snapshots are enabled
- AX request/ack events cannot enter TTS; open-request remains distinct
- Product AX sources do not name forbidden helper effect paths

`desktop/tests/plugin-overlay-runtime.mjs`, `connection-overlay-runtime.mjs` and `skill-overlay-runtime.mjs` now also assert the six AX names on a prepared pin runtime. This host has no prepared `.wisp-spike.json` runtime. **Test 2 gap class: missing-external-resource.** Isolated pin-runtime initialize was **not** run.

## Native (uncompiled here)

Sources: `AccessibilityDriver.swift` (protocol + recording double + `#if canImport` AX path), `AccessibilityFixtureWindow.swift`, `PermissionsView.swift`, PermissionState/PermissionWindow AX tuples, EngineBridge `ax-request` / `completeAx`, CompanionController `ax-request` receive (not voice-result), ManagementState Permissions TCC copy, `AccessibilityDriverTests` in NativeChecks. `desktop/scripts/test-native.sh` lists `AccessibilityDriver.swift` and `AccessibilityFixtureWindow.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

User-initiated Open Accessibility Settings may call `AXIsProcessTrustedWithOptions`. Launch / initialize / describe / execute do not.

## 06 / 07 / 09 / 10 / 11 / 12 retest obligations (not claimed here)

15 edits permission-protocol / PermissionState / `consume()` call sites in new AX tools, CompanionController receive, EngineBridge allowed events, overlay-runtime inventory lists, and product-sdk admission/inventory. Record:

1. **06 retest:** fixture pairing, queue 8, Cancel-first, no Allow Always. Linux analogue: existing permission-protocol tests plus AX tuples; native tab order / no Allow Always remain NativeChecks (uncompiled here).
2. **07 retest:** shortcut/Wake, no auto-listen after Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. AX request/ack must not enter TTS. Do not spend DeepSeek 0/1. Linux analogue: voice-seams / AX-ack-not-TTS tests; not audible proof.
3. **09 retest:** three Direct names still present; `file:` / `javascript:` / `/etc` still fail; recording-opener 0/0/0/1; open-request still independent of ax-request. Do not treat NSWorkspace or live Ollama as passed.
4. **10/11/12 overlay/inventory retest:** demonstration plugin / `mcp__` / `skill` still absent until enabled; extra unadmitted tools still fail initialize; 09+15 Direct names present when those sources load.

Do not treat 07–13 Done when as satisfied.

## Honest gaps (LOOP class)

| Item | Gap class |
| --- | --- |
| NativeChecks compile, `AXUIElement`, TCC, fixture GUI | missing-platform |
| Declared-Mac Allow Once / Deny / Cancel canaries; Permissions TCC copy; user-initiated open of Accessibility settings | human-test + missing-platform |
| Live local Ollama 0/0/0/1 per AX tool | missing-platform / human-test |
| Isolated pin-runtime initialize | missing-external-resource |
| 07 shortcut/mic/TTS retest; 09 NSWorkspace opener | human-test + missing-platform |

Visual click remains 16. Windows remains 17. Open decisions 18/20/21 stay unresolved.
