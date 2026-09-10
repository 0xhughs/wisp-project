# Desktop body — Builder proof for independent review

Dispatch02-build-016, following specifically authorized native CGEvent test input and user-enabled macOS posting access. This is proposed Builder evidence, not independent acceptance. Earlier014/015 unavailable input attempts remain in external handbacks and are not counted as passes.

## Criterion1 — runnable native window

`desktop/scripts/build-macos.sh --scratch <external016>` succeeds with installed Swift6.3.3 and command-line SDK on macOS26.5.2/build25F84, arm64 Mac16,11/24GiB. Exact output/build log: `../../work/wisp-02/02-build-016/{build-path.txt,build.log}`. Native `.app` is outside the candidate. Launch/stop instructions are in `docs/desktop-body.md`.

Actual desktop observations: Wisp's borderless160×160 panel was onscreen at ordinary floating level3 over the independent level0 target, with keyfalse. Actual rendered view-cache samples are cornerAlpha0/gapAlpha0; runtime is nonopaque with shadowfalse. The original small ring artwork has no rectangular backing or shadow in its drawing. CUA body screenshots are per-window and flatten alpha to white; they are not offered as standalone compositor/input proof. They are supplemented by the rendered raster, window facts and real global input below.

The target entered its full-screen Space through its native full-screen button. Public window metadata showed target3440×1440 and Wisp still onscreen at level3; a global gap click reached the target. Escape returned to the ordinary desktop Space. This was repeated on the animated body. No protected-system-UI precedence is claimed. Physical configuration: one3440×1440 display,1× scaling. Additional displays were unavailable; negative-origin, vertically arranged and removed-display clamping have deterministic production-source coverage.

## Criterion2 — real cross-application input

The separately compiled `InputProbe.swift` posted ordinary global HID events, never app-PID-directed events or AppKit handler calls. Product code contains no CGEvent input, event forwarding, global keyboard capture, Accessibility or Input Monitoring usage. Alpha hit routing worked directly, so no polling/whole-window mouse switch was required.

Core checkpoint (`target2.jsonl`, `fullscreen-windows.txt`): all four transparent corners and the interior gap delivered native clicks; count0→7 included an immediate opaque-edge→gap click and an outside→corner click. Actual scroll0→240; focused field contained `wisp-test` with keytrue. Native opaque drags changed panel x500→600→530. Full-screen gap/corner delivered additional counts while Wisp remained non-key. These facts, not prior CUA app-addressed clicks, establish routing.

On the final source, the controller kept one panel and recreated its actual drawing view40 times, including interruption from simulated listening. The independent target then received global typing `wisp-test`, immediate gap/corner clicks count0→2, and real scroll0→240. Opaque drag changed the native frame500→600, while keyfalse and controller/session/runtime stayed unchanged. Proof: `final-gui/events.jsonl`, `final-gui/windows-after.txt`, `final-target.jsonl` under the external016 root. Earlier animated/recreated checks also scrolled both the interior gap and corner, retained/extended text, and returned from full-screen. Sanitized input facts are tracked in `02-desktop-body/input-events.json`.

## Criterion3 — presentation and motion

Original programmatic artwork visibly distinguishes teal idle, amber listening with raised accents, blue speaking with mouth reaction, and gray unavailable. `listening-simulated.png` and `speaking-simulated.png` depict explicitly simulated developer presentation, with no microphone, transcription, TTS or voice claim. `sequence` deterministically performs listening→speaking→idle; stale delayed transitions after actual view replacement were rejected. Engine failure during speaking visibly became unavailable (`unavailable.png`).

Actual host Reduce Motion: CUA System Settings → Accessibility → Motion observed original off, temporarily enabled it, and native status reported reduceMotiontrue/animationfalse. Restored off and native status reported false/true. Private `gui2/events.jsonl` contains both states. No TCC preference was changed by Builder. Deterministic production MotionPolicy assertions supplement this actual setting test. Hide/show reports timer0/1; destroyed views dispose their timers/observers.

## Criterion4 — one controller/session/runtime

Final real suite `node desktop/tests/body-live.mjs --runtime-root ../../work/wisp-01/builder-01 --route-file ../../work/wisp-01-authorized-route.json --scratch ../../work/wisp-02/02-build-016/final-live3` passes. The normal case completes two distinct harmless no-tool turns across actual view replacement and state interruption, retaining the same controller UUID, session and live Harness PID. It uses accepted `Client` and `completedTurn` unchanged, with a per-turn window beginning before the prompt request. Both turns produce nonempty completed results, no tool-call events and an empty effect ledger. Each active observation has0 TCP listeners and0 browser processes.

Safe identifiers, event counts and complete outcomes: `02-sanitized-results.json`; private `final-live3/live.json` and per-case `events.jsonl`/`native-events.json`. The exact pinned source and copied engine bytes are checked at bridge startup. This establishes identity within an app lifetime; durable product identity across relaunch remains slice04.

## Criterion5 — real cleanup and failure

All7 final cases pass: normal native stop, native SIGTERM, native SIGKILL, bridge SIGTERM, bridge SIGKILL, engine SIGKILL during listening, and startup failure. Every owned native/bridge/Harness lifetime is observed. Normal stop/SIGTERM record clean shutdown; injected hard kills are explicitly marked as forced test faults. Runtime PID/group and bridge are absent afterward. Failure clears active presentation and leaves a Wisp-owned unavailable body; there is no restart loop or Harness UI fallback. Native launch again is exercised with fresh cases.

Development failures were preserved and corrected: initial native `.terminateLater` prevented main-dispatch completion delivery; final shutdown closes the bridge input first and only completes native termination after bridge exit. The resource test also found AppKit retaining an empty closed panel in a pipe-only session. The final controller owns one persistent panel and replaces only the view, eliminating that unnecessary window lifetime. Final assertions confirm1 window/1 view/1 timer after replacement, and the current GUI test confirms the same after40 replacements. Failed development runs are not included as passes.

## Criterion6 — checks, resources and scope

- Native same-source assertions pass: state interruption/stale events/failure, motion preference policy, screen geometry/recovery, and bridge framing. Command `desktop/scripts/test-native.sh <absolute-external>/final-native`; log `final-native.log`.
- Node bridge tests5/5 pass: fragmented/coalesced frames, malformed/unknown/oversized input, scoped approval denial, and real subprocess invalid-startup/duplicate-shutdown/EOF exit. Log `final-bridge-tests.log`. These protocol tests are distinct from the actual Harness suite.
- CLI app build and all7 final real lifecycle cases pass. Exact final source GUI spot-check passed after the last product change. No source-changing work followed those checks.
- The installed CLI Swift has neither XCTest nor Swift Testing. The native assertion runner compiles the same production files without either dependency; no full Xcode installation was introduced.
- Final native process after40 view replacements: six1-second `ps` samples, CPU1.9–2.5%, stable RSS48288KiB. Method/results in `final-gui/resources.json` and tracked sanitized results. Earlier diagnostic intervals measured idle animation12s, hidden8s (settling to0% CPU), and simulated speaking8s; those pre-final-window-ownership samples are supporting observations, not final-candidate performance guarantees. No SLA or universal hardware floor is invented.
- All generated binaries, caches, runtime homes and private diagnostics remain outside candidate. Accepted01 files and archive are unchanged; byte comparison recorded separately. Ollama was not reinstalled or stopped. No menu/Settings/voice/next-slice features, signing, publishing or deployment were added.

All generated GUI apps and native/bridge/Harness test processes were stopped before handback. Host Reduce Motion was restored. Remaining coverage limits are the single physical display/scale and the CLI test-framework availability described above; they are not fabricated multi-display/OS support claims.
