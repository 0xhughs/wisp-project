# Local-first macOS readiness

This document is a reproducible **local** assemble, run, and quit path for Wisp on a Mac. It is **not** a notarize, Developer ID, App Store, Sparkle, DMG, installer, TestFlight, or CI-publish instruction.

Wisp remains one persistent desktop AI companion. Voice is the primary interaction. Settings and Diagnostics are management surfaces, not a chatbot, transcript, or Harness UI. No Wisp account is required. Optional cloud keys stay in Settings → Models.

## Out of ship instructions

Do **not** notarize. Do **not** ship with Developer ID. Do **not** submit to the App Store. Do **not** add Sparkle. Ad-hoc `codesign --sign -` (run by `desktop/scripts/build-macos.sh`) is local development identity for microphone and speech usage strings and for binding TCC to `local.wisp.body`. It is **not** Developer ID, notarization, or a distribution identity.

## Prerequisites

- A Mac that can run a macOS 14+ AppKit accessory. Package.swift `macOS(.v14)` is a **compiler floor**, not a marketing support claim.
- Node meeting `spike/prepare.mjs` (≥22.19; 24 accepted).
- pnpm 11.7.0 to **prepare** a pin runtime.
- Pristine Harness pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`.
- Optional local Ollama; optional DeepSeek key in Models (Keychain). Local-only remains possible.
- Speech and a local model need remaining machine capacity. Slice 08 qualitative speech headroom applies. This document does **not** invent GB, VRAM, or latency cutoffs.

Historical 02 host observation (not an SLA): macOS 26.5.2 / Mac16,11 / 24 GiB.

## Local assemble and run

Use a fresh absolute scratch **outside** the source tree. Mark it `.wisp-owned`. Do not use the repository as a runtime home.

```sh
desktop/scripts/build-macos.sh --scratch /absolute/external/build
mkdir -p /absolute/external/build/run
chmod 700 /absolute/external/build/run
touch /absolute/external/build/run/.wisp-owned
desktop/scripts/run-macos.sh /absolute/external/build/Wisp.app /absolute/prepared/runtime /absolute/external/build/run
```

`run-macos.sh` uses LaunchServices `open -n -W -a` so TCC strings bind to `local.wisp.body`. Ordinary launch is an accessory app (`LSUIElement`): one status item; body plus Settings and Quit remain usable. Normal launch has no developer command channel.

The runtime must already be the accepted prepared pin, with `.wisp-spike.json`, installed dependencies, and matching engine files. These commands do not download models, inspect keys, start a second Wisp, or open Harness web/chat UI.

## Quit and recovery

- Closing Settings does not quit (`applicationShouldTerminateAfterLastWindowClosed` remains false).
- Quit via the status-menu **Quit Wisp** or Command-Q. That path disposes menu, Settings, shortcut, and permission UI, then `bridge.stop()`, and waits for EOF. The existing ~32s deadline that emits `forced-bridge-stop` is **not** a clean pass.
- Repeat launch must not leave a second status item from the previous process.
- Missing Wisp folder: engine Unavailable; Settings and Quit still work. Settings → Diagnostics reports home configured **no** without echoing a folder path.
- If the engine is Unavailable: Quit Wisp and reopen. Do not start a second Wisp.

SIGTERM/SIGINT remain terminate requests. They are not a substitute for proving menu Quit on a Mac.

## Settings → Diagnostics

Settings still has the eleven sections in one retained window. Diagnostics is a dedicated pane (`DiagnosticsView`): labeled nonsecret facts, keyboard-reachable **Refresh** and optional **Copy** of the same on-screen redacted text.

Refresh repeats the existing 08 hardware/Ollama inspect only (`hardware-collect`, `GET /api/version`, `GET /api/tags`). Selecting Diagnostics may refresh that inspect. Refresh never starts the microphone, never sends `session/prompt`, never pulls a model, never opens Harness UI, and never uploads. Copy writes pasteboard text only. There is no send-diagnostics action and no durable diagnostic log in the Wisp home.

Labeled facts include engine lifecycle (Starting / Ready / Unavailable / Stopping), voice **phase** (not a transcript), mute, locale, shortcut registered vs conflict copy, categorical microphone/speech permission, Models route without keys, 08 hardware/Ollama inspect, plugin/connection/skill mounted counts, current body catalog id, categorical Accessibility TCC, telemetry **disabled**, home configured yes/no without path, and last-stop none/clean/forced in process memory. Ready means the hidden engine is attached; it does not mean voice is capturing.

Session telemetry is disabled: overlay row `session-telemetry-otel` is disabled, `classifyInsert` refuses that id, and spawn sets `DSH_TELEMETRY_DISABLED`. `command-feedback` stays disabled. Diagnostics does not say feedback-only sharing is on. Live observation that a local-only session does not contact the pin default OTLP collector is a later Mac check, not this local document.

## 07–13 retest

Parked slices 07–13 are implemented with verification pending, **not** accepted. This local path does **not** claim those retests passed. Record them on a declared Mac: shortcut/Wake and mute (07); hardware snapshot Refresh GET-only (08); Direct URL/file/time 0/0/0/1 (09); plugins catalog with telemetry still not enableable (10); Connections secrets absent (11); Skills Enable is not Allow Once (12); Pets orb/fox/robot, Cancel zero snapshot, Apply does not restart the engine (13). Do not spend DeepSeek. Wave-1 skins are not a 14 gate.

## Honest remainder

Live Mac Settings Diagnostics GUI and keyboard, NativeChecks compile, live menu Quit / no-orphan, ordinary desktop usability, live local-only OTLP silence, spoken 07–13 retest, and independent release-gate sign-off remain **14.x-macos-e2e**. Linux-supplemental tests of this pack do not prove those gates.
