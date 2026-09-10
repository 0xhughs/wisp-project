# NOT ACCEPTED — slice 14 macOS readiness (implementation evidence)

This file is **not** an accepted-slice archive. Slice 14 is **not Shipped**. Slices 07–13 and 15–19 remain implemented with verification pending, **not Shipped**. Builder cannot approve. Native Swift / Settings GUI / live Quit / live OTLP observation remain **uncompiled/unverified on this Linux host** (`missing-platform`).

Dispatch **14-build-104**. Contract `ff534143eee6468b1d56cd535ff80514ca926762892c3109b4a01cd1d40817c4` must remain unchanged. Approved baseline `a15bda46480473b3bb37123f76ceeab9e37480f41e9bd6ca97958ec080f53590` (294 files). Head at dispatch `7b12c4ba784d009e4412c176c9be2163bb139cae`. Linux-supplemental after implementation: **248/248**, files 301.

Harness pin `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215` (porcelain clean at implementation). No DeepSeek call, model download, key inspection, merge, publish, or spend. No secrets, home paths, companion UUIDs, keys, recognized text, overlay YAML, or plugin paths in this file.

## Linux-supplemental (this host)

```
unset WISP_LOOP_STATE
export PYTHONDONTWRITEBYTECODE=1
rm -rf tools/__pycache__
export PATH="$HOME/.local/node-v22.20.0-linux-x64/bin:$PATH"
sh tools/linux-js-tests.sh
```

**248/248 pass, fail 0** (Linux-supplemental Node unit checks). TAP footer:

```
1..248
# tests 248
# suites 0
# pass 248
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

`identity.py --self-test` then printed `self-test ok` with contract `ff534143eee6468b1d56cd535ff80514ca926762892c3109b4a01cd1d40817c4`. They cannot satisfy Mac Settings GUI, live Quit, NativeChecks, or live network.

Coverage intended:

- Closed Diagnostics snapshot schema; extra keys (`homePath`, companion UUID, `recognizedText`, `pendingReply`, `voiceStatus`) rejected
- Sentinels `sk-live`, `BEGIN CERTIFICATE`, `memory.json`, `/Users/wisp`, a UUID companion id, and a plugin absolute path omitted from rendered text
- `homeConfigured` boolean with no folder path
- Telemetry copy says disabled and does not say feedback-only is active
- `environment()` from `spike/prepare.mjs` has non-empty `DSH_TELEMETRY_DISABLED` and does not set `DSH_TELEMETRY_MODE` or `DSH_TELEMETRY_OTLP_URL`
- `product.patch.yml` disables `session-telemetry-otel` and `command-feedback`
- `DISABLED_STOCK_IDS` includes `session-telemetry-otel`; `classifyInsert` refuses that id
- Composed overlay still contains the disabled telemetry row
- `docs/macos-readiness.md` does not contain notarize / Developer ID / App Store / Sparkle as ship instructions
- CompanionController Diagnostics composition no longer concatenates `voice.status`

Isolated pin-runtime initialize was **not** run. Overlay / `classifyInsert` / `wisp.inventory` / admission were assertion-only for telemetry disable. **Test 2 gap class: missing-external-resource.** No new 14 initialize obligation.

## Native (uncompiled here)

Sources: `DiagnosticsSnapshot.swift`, `DiagnosticsView.swift` (Refresh / Copy; labeled facts; no prompt field), `CompanionController` Diagnostics composition without `voice.status`, `ManagementState` Diagnostics copy (does not claim voice unimplemented), `SettingsWindowController` Diagnostics pane. NativeChecks: `DiagnosticsSnapshotTests.swift` plus ManagementState Diagnostics omit-list. `desktop/scripts/test-native.sh` lists `DiagnosticsSnapshot.swift` and `DiagnosticsView.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

Last-stop `none` / `clean` / `forced` is process memory only. No durable diagnostic log in the user home. Refresh is existing `OnboardingRefresh` (excludes `session/prompt`, pull, `wakeVoice`).

## 07–13 retest (recorded; not claimed passed)

14 builds on parked 07–13. Those slices are **not** accepted. This dispatch did **not** run a declared-Mac retest and does **not** claim they passed. Historical `07-review-060` HUMAN_REQUIRED is unchanged.

| Slice | Recorded retest obligation | Status here |
| --- | --- | --- |
| 07 | Shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend DeepSeek 0/1. Diagnostics facts must not enter TTS. | **Not run.** Linux analogue: existing voice-protocol / voice-seams. Gap: human-test + missing-platform. |
| 08 | Diagnostics/Models hardware snapshot and speech-headroom copy; Refresh still GET-only loopback. | **Not run** live IOKit/Ollama. Linux analogue: diagnostics-snapshot + existing hardware/ollama inspect tests. |
| 09 | Direct URL/file/time still 0/0/0/1; `file:` and `/etc` fail. | **Not run** live. Linux analogue: existing safe-actions tests. Overlay/permission protocol untouched. |
| 10 | Plugins catalog; demonstration still gated; `session-telemetry-otel` still not enableable. | **Not run** live. Linux analogue: classifyInsert + overlay assertions in diagnostics-snapshot tests; existing plugin-config tests. |
| 11 | Connections; secrets still absent from Diagnostics/memory. | **Not run** live. Snapshot omit-list; existing connection-config tests. |
| 12 | Skills; same Wisp; Enable is not Allow Once. | **Not run** live. Existing skill-config tests. |
| 13 | Settings → Pets still selects orb/fox/robot; Cancel zero snapshot; pet Apply does not restart the engine. Wave-1 is not a 14 gate. | **Not run** live. Existing pet-config tests. |

Do not treat 07–13 Done when as satisfied. 15 AX, 16 visual, 17 Windows, and 19 wave-1 were **not** retested as 14 acceptance (`desktop/windows/**`, `permission-protocol.mjs`, `product-sdk.ts` admission, `ax-actions.mjs`, `visual-actions.mjs` untouched).

## Honest gaps (LOOP class)

| Item | Gap class |
| --- | --- |
| macOS Settings → Diagnostics GUI and keyboard Refresh/Copy | missing-platform + human-test |
| NativeChecks compile (`test-native.sh` / `build-macos.sh`) | missing-platform |
| Launch missing-home / menu Quit no-orphan / relaunch one status item | missing-platform + human-test |
| Ordinary desktop usability; click-through; Settings close does not quit | missing-platform + human-test |
| Live local-only session vs pin default OTLP host | human-test + missing-platform |
| Isolated pin-runtime initialize | missing-external-resource |
| 07–13 spoken/Mac retest | human-test + missing-platform |
| 14.x-macos-e2e remainder | not this increment |

This is not 14 Shipped. Project not Complete.
