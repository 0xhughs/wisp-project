# BUILD — active contract

Slice: 02 macOS desktop body
Archive: slices/02-macos-desktop-body.md

## Goal

Deliver Wisp's native macOS desktop body: a small transparent, floating, draggable animated mascot that leaves ordinary desktop interaction usable. The body renders one Wisp controller's state and owns no separate agent identity. Attach its application lifecycle to the accepted hidden Harness boundary, without exposing engine UI or adding voice, Settings or menu-bar features.

## Done when

1. A reproducible local CLI build produces a runnable Wisp macOS application using the installed Swift/AppKit toolchain. Document the actual host/SDK/compiler and launch/stop commands. First prove the native window strategy on the actual desktop: alpha-clear background, no rectangular backing/shadow artifact, above normal application windows after Wisp loses focus, and no activation/key-focus theft during idle display. Source declarations, screenshots alone and mocked window objects cannot establish input behavior. Record actual normal-window, Space-change and full-screen observations; use ordinary floating levels and never claim precedence over protected system UI.
2. Idle transparent regions inside the mascot window's bounds pass real clicks and scrolls to an independent underlying application. Visible mascot regions accept drag and remain usable after repeated drags, deactivation and body animation. Test transparent corners and an interior transparent gap, entering from both inside and outside the window and an immediate click after crossing the visible edge. Keyboard entry continues in the underlying focused application. Show observable underlying control/scroll changes and mascot frame changes; a view `hitTest` result or `ignoresMouseEvents` flag alone is insufficient. No synthetic forwarding of captured clicks, global keyboard capture, Accessibility or Input Monitoring permission may be required by the product body.
3. One original starter mascot renders visibly distinct idle, listening and speaking states through a small typed state interface owned by the application controller. Idle has visible restrained animation; listening and speaking have distinct visual reactions. A developer-only deterministic sequence exercises these states and interruption back to idle, explicitly labeled simulated presentation states. There is no microphone, speech recognition, TTS or claimed live voice input. Invalid/stale state transitions cannot leave a stuck listening/speaking reaction after stop, failure or view replacement. Pause or dispose animation when its body is hidden/destroyed and respect the host's Reduce Motion preference.
4. The application controller, not the mascot view, owns one bridge/runtime connection and one session per running companion. With the actual accepted Harness pin and existing authorized local route, initialize one owned runtime and perform a harmless no-tool smoke turn through the accepted client completion oracle. Recreate the body/view and exercise the state sequence while retaining that same controller/session and live Harness PID; a second harmless smoke turn through the same session still succeeds. Do not start an engine per render/state change or create a second agent identity. This demonstrates attachment within one app lifetime; durable product identity/home across relaunch belongs to04.
5. Wisp launch, ordinary termination and launch again work; stopping or losing the native client closes its bridge input and shuts down the owned engine. Exercise native termination, bridge failure and engine failure with real subprocesses. Bound cleanup using the existing boundary deadlines, show no remaining owned child/group/listener/browser, and distinguish forced cleanup from clean shutdown. Failure leaves a Wisp-owned non-chat visual unavailable state, clears active presentation, and never falls back to Harness UI. No automatic restart loop or silent successful-ready state after startup failure.
6. Source, native tests, bridge tests and reproducible desktop evidence map to the criteria above. Independent Reviewer can build/test an exact isolated copy and repeat GUI interactions. Record tested display geometry/scaling and actual observations of idle/animated resource use without inventing a supported OS/hardware floor or numerical performance SLA. Missing GUI interaction evidence or real runtime lifecycle evidence is an acceptance gap, not a waived manual check.

## Out

- Slice03 menu-bar item, management shell, Settings/navigation, wake/mute/model/pet controls; slice07 global shortcut and all real voice capture/playback/wake-word work.
- Durable product memory/home selection, model onboarding/downloads, cloud-key management, new approvals UI, new tools, plugins/MCP/skills, proactivity or remote channels.
- User-selectable skins/full catalog, Windows delivery, distribution packaging of Harness/model dependencies, signing, notarization, publishing or deployment.
- Redesigning/replacing the accepted runtime, relaxing its restrictions, modifying the archived01 receipt or treating the test tool as a production computer-control capability.

## Constraints

**Routine stack and native feasibility checkpoint.** Use Swift with AppKit, an `NSPanel` and custom transparent drawing, built with SwiftPM/CLI and a local `.app` assembly script. The installed SDK directly supplies transparency, nonactivating panels, floating levels and native drag; no browser renderer or extra desktop framework is needed. The read-only source feasibility evidence below supports this choice but is not runtime click-through proof. The first approved implementation checkpoint must run a minimal actual body over an independent test application and pass criteria1–2 before filling out the rest of the body. Refine the AppKit input implementation within this contract if necessary; an inability to meet the interaction criteria is a blocker, not permission to weaken them or switch product architecture silently.

Use a borderless nonactivating panel with `isOpaque = false`, clear background, disabled rectangular shadow and ordinary floating window level, retaining visibility on deactivation. Keep the mascot non-key/non-main. Start with genuinely clear pixels outside the drawn silhouette and native drag from the visible body. AppKit `ignoresMouseEvents` is a whole-window switch, not a per-view mask. If explicit cursor-region switching is needed, use the rendered geometry as its source, re-enable body hit reception correctly after leaving ignored regions, dispose monitoring when inactive and verify rapid edge-crossing clicks. A polling/monitor strategy is not accepted solely because a coordinate unit test passes. Do not rely on `NSView.hitTest(nil)` to forward a click between applications. Do not introduce private WindowServer APIs or event injection into the product.

Keep frame calculations screen-coordinate aware, including negative display origins and available visible frames. Clamp an unreachable mascot back to a current display after display configuration change. Test actual available display/Space configurations; label unavailable additional-display coverage honestly and cover its geometry deterministically. OS UI such as secure/full-screen system overlays may supersede normal floating windows; document observed behavior rather than raising Wisp to a disruptive system level.

**Application/engine separation.** Add a thin Node lifecycle adapter that imports the accepted `spike/client.mjs` and the applicable preparation helpers, preserving their real turn-correlation and shutdown behavior. Native Wisp owns the adapter by anonymous pipes; it owns exactly one Harness child group through that client. No listener, network control endpoint or generic shell/command RPC. Configuration uses an explicit verified external runtime root/route; maintain the accepted source pin, sanitized environment and private per-run paths. Do not mutate the accepted `spike/**` merely to fit the body, and do not reuse `spike/run.mjs` as a continuously running application because it is a scenario runner. Reuse its documented setup conventions without copying a second engine implementation.

The adapter exposes only lifecycle/readiness/failure and bounded developer smoke operations needed by this slice. All unknown messages fail closed. It must never allow the harmless approval tool automatically: unexpected approval requests are denied/cancelled via the accepted scoped path. Normal product launch has no user text input or arbitrary prompt channel. Test state/smoke controls are explicit developer mode over owned pipes/CLI, absent from ordinary UI; no public socket or unauthenticated control file. Native/bridge EOF and signal handling converge on one cleanup task; closing/replacing a body is distinct from terminating the application controller.

No full Xcode dependency is introduced for the CLI build. Any later deployment target setting is an explicit build compatibility choice, not evidence of tested OS support. All compilation caches, packaged binaries, runtime homes and raw proof remain outside candidate coverage. Preserve existing01 source/evidence and immutable archives. New assets must be original programmatic/vector artwork or have recorded redistribution rights. A single simple expressive mascot is sufficient.

**Expected owned paths (coordinator can include these in the reviewed contract).**

- `desktop/macos/Package.swift`; `desktop/macos/Sources/WispBody/main.swift`, `CompanionController.swift`, `MascotPanel.swift`, `MascotView.swift`, `BodyState.swift`, `ScreenGeometry.swift`, `EngineBridge.swift` in that source directory for the app/controller, native panel/drawing, state/geometry and pipe lifecycle adapter client.
- `desktop/macos/Tests/WispBodyTests/BodyStateTests.swift`, `ScreenGeometryTests.swift`, `EngineBridgeTests.swift` in that test directory for deterministic state/geometry and lifecycle-parser tests; an additional executable/test support target if native GUI probes require it.
- `desktop/macos/Info.plist`; `desktop/scripts/build-macos.sh`, `desktop/scripts/run-macos.sh` for external scratch build/application assembly and explicit run/stop instructions.
- `desktop/engine/body-bridge.mjs`; `desktop/tests/body-bridge.test.mjs`; `desktop/tests/body-live.mjs` for actual boundary attachment/lifecycle proof and controlled fault cases.
- `desktop/tests/gui/ClickTarget.swift` and `desktop/tests/gui/README.md` for a small independent underlying target application and reproducible GUI probe support, never shipped in the ordinary app.
- `docs/desktop-body.md`; `evidence/02-desktop-body.md`; `evidence/02-sanitized-results.json`; selected owned-target screenshots/recordings under `evidence/02-desktop-body/`.

## Data / state impact

The controller holds presentation state, transient body position, bridge readiness, one per-launch session identity and owned process identity; the drawing/view owns only render/drag resources. Listening/speaking flags represent presentation signals, not microphone status inferred from Harness text. A body replacement retains the controller/session and active connection. No durable conversation or product memory store, credentials store, ambient user-file scan or telemetry is added.

Generated test data is restricted to a newly marked private root under `../../work/wisp-02/<dispatch>/`, including Swift build/cache output, the assembled app, native/bridge logs, bounded presentation event traces and disposable Harness session state. Resolve/recheck existing authorized dependency/model paths read-only; do not provision models or delete the coordinator-owned Ollama resource. New run roots must use ownership/realpath checks for cleanup. Sanitized tracked evidence contains test identities/counts and known-safe geometry/state/error fields; no raw conversation, model keys, private filesystem content or unrelated desktop captures.

## Tests

Run in an exact isolated copy for Reviewer. Proposed executable entrypoints below are implementation deliverables, not commands already present or already passed:

1. `desktop/scripts/build-macos.sh --scratch <absolute-external-scratch>`: resolve installed `swift`, build a SwiftPM executable using an external scratch/cache, assemble local Wisp.app and print its exact path. `swift test --package-path desktop/macos --scratch-path <absolute-external-scratch>/swift` checks state interruption/stale events, view-independent ownership, screen-coordinate clamping, bridge framing and failure transitions. Record compiler/build output privately. No `xcodebuild` requirement.
2. `node --test desktop/tests/body-bridge.test.mjs`: fragmented/coalesced input, malformed/oversized/unknown messages, unexpected approval rejection, duplicate termination, EOF and controlled child failure cases. Fabricated protocol tests are explicitly distinct from real Harness tests. Use subprocess tests for ownership/EOF cleanup rather than only a mock callback counter.
3. `node desktop/tests/body-live.mjs --runtime-root <verified-existing-or-isolated-prepared-runtime> --route-file <authorized-route> --scratch <absolute-external-scratch>/live`: launch the actual native app/bridge/Harness chain; run harmless turn, body recreation and state sequence, second turn using the same session; verify the unchanged Harness PID/controller/session, no effects, matched completion and clean disposal. Repeat startup failure/native termination/bridge failure/engine failure scenarios with fresh private cases. Save `live.json`, `lifecycle.json`, process/socket observations and source-copy checks outside the candidate. Missing route/resource is reported unavailable; no model provisioning or fake live pass.
4. Preserve01 regression by running `node --test spike/tests/client.test.mjs` and relevant accepted approval/lifecycle checks if shared boundary inputs change; changing accepted01 behavior requires explicit coordinator routing. For a strictly additive adapter, exercise its real boundary attachment and inspect byte equality of unchanged01 files instead of claiming an unneeded rerun of all expensive live tests.
5. **Real GUI gate:** launch the assembled Wisp app plus a separate local test app with a clickable counter, scrollable content and editable text. Using available computer-use tooling or a recorded human run, position target controls beneath transparent window corners/interior gap, click and scroll, drag only the visible mascot, type with the target focused, switch to another ordinary app, cycle presentation states, replace the view and repeat. Record before/after underlying counter/scroll/text/frame facts with screenshots or short recordings and timestamps. Include quick edge crossing/clicks, deactivation, Space/full-screen behavior and recovery after hide/show and available display reconfiguration. Screenshots demonstrate appearance; target event logs and visible changes demonstrate real input delivery. Do not mark the GUI gate complete using only programmatically invoked action handlers or injected AppKit mouse methods. Automated input may require permissions of the test operator/tool; the product itself must not request them.
6. Observe idle and animated process CPU/memory over a recorded interval and ensure no accumulation of timers, windows or processes after repeated body reconstruction and shutdown. Report measurements and method, not an invented SLA. Reduce Motion receives an actual host setting check where available, with restoration, plus deterministic preference-adapter coverage; label any unavailable host-level check. Verify all spawned test apps/processes exit, retain only deliberate private proof, and compare source identities before/after independent checks.

Tracked `evidence/02-desktop-body.md` must map each Done when item to exact commands/results, actual GUI actions and proof paths, clarify simulated voice states, state tested hardware/OS/display configurations and retain unresolved limitations. `docs/desktop-body.md` gives repeatable build/run/stop and GUI verification steps suitable for a fresh reviewer. An unperformed required interaction or lifecycle check remains incomplete.

### Proposal source evidence

Observed 2026-09-08 through `sw_vers`, `uname -m`, `xcode-select -p`, `xcrun swift --version`, `xcrun --show-sdk-path`, `xcodebuild -version`:

- macOS26.5.2 build25F84, arm64; Apple Swift6.3.3 (`swiftlang-6.3.3.1.3`, clang2100.1.1.101), compiler default target `arm64-apple-macosx26.0`.
- Developer directory `/Library/Developer/CommandLineTools`; SDK `/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk`.
- `xcodebuild -version` fails because the active directory is CommandLineTools, not full Xcode. This is not a blocker for the proposed CLI Swift/AppKit build; a successful native compile has not yet been demonstrated.
- SDK `AppKit.framework/Headers/NSWindow.h` declares `NSWindowStyleMaskNonactivatingPanel` (51/66), clear-capable background color (401), movable/background dragging and deactivation (412–416), level (504), opacity (517), native drag (661), ignoresMouseEvents (795). Collection behaviors include join-all-Spaces and full-screen auxiliary; their declarations are not proof of behavior across other applications.
- `NSPanel.h` declares floating/key-only-if-needed; `NSEvent.h` declares mouse location and event-monitor APIs. No drawing/window was built or launched during this no-code draft.

Official Apple references inspected:

- [Nonactivating panel](https://developer.apple.com/documentation/appkit/nswindow/stylemask-swift.struct/nonactivatingpanel): AppKit panel style that avoids application activation.
- [Window mouse transparency](https://developer.apple.com/documentation/appkit/nswindow/ignoresmouseevents?language=objc): applies at the window boundary, not an arbitrary view hit-test region.
- [Native window dragging](https://developer.apple.com/documentation/appkit/nswindow/performdrag(with:)): native dragging from the initiating mouse-down event.
- [Window level](https://developer.apple.com/documentation/appkit/nswindow/level-swift.property) and [floating panel](https://developer.apple.com/documentation/appkit/nspanel/isfloatingpanel): support the native floating-panel approach; the documented floating-panel default also hides on deactivation, which Wisp must explicitly override and test.
- [Movability](https://developer.apple.com/documentation/appkit/nswindow/ismovable): interaction of movability/background dragging and display reconfiguration supports explicit geometry/recovery tests.

SDK headers provide concrete local API availability where the web pages are JavaScript-only. No third-party forum advice is used as acceptance evidence. Swift/AppKit is a routine reversible framework selection supported by this evidence, with real cross-application window feasibility explicitly still requiring the first implementation checkpoint.

## Proof
Builder02-build-016 completed; proposed proof ../../work/loop-state/02-build-016-result.md and evidence/02-desktop-body.md,02-sanitized-results.json. Native assertions,5 bridge tests,7 live lifecycle cases and final actual GUI checks reportedly passed;40 replacements retain1panel/view/timer and same controller/session. All owned processes stopped, external model retained. Independent implementation review pending.

## Review
APPROVE_PLAN02-plan-013; native click-through mandatory first checkpoint.
Plan approval: APPROVE_PLAN / /root/reviewer_plan013 / 02-plan-013 / contract e42780a8b4f0d64b51b6be80014ea4a6a8dd05db1d814fa1895db96ccb85dcfd / baseline d7f13d36a17f52722bbca47a8b15c66c0983e277c1ce843af4174c60a80ede89 / ../../work/loop-state/02-plan-013-review.md
Implementation approval: APPROVE_IMPLEMENTATION / /root/reviewer_body017 / 02-review-017 / contract e42780a8b4f0d64b51b6be80014ea4a6a8dd05db1d814fa1895db96ccb85dcfd / candidate 8833229967769333d41946441829fdf7cb3286fbce24e266071694889cfbd022 / ../../work/loop-state/02-review-017.md

## Loop state
Execution mode / tool adapter: collaboration.spawn_agent; send_message/followup_task; list_agents/wait_agent; interrupt_agent. One active worker per checkout; fresh independent Reviewers.
Coordinator: /root
Worker / role / phase: none; /root/reviewer_body017 completed / Reviewer / accepted implementation
Dispatch ID / launch state / input identity: 02-review-017 / completed and consumed / contract e42780a8b4f0d64b51b6be80014ea4a6a8dd05db1d814fa1895db96ccb85dcfd; candidate 8833229967769333d41946441829fdf7cb3286fbce24e266071694889cfbd022
Pending result / last consumed dispatch: none / 02-review-017
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 ../../work/loop-state/identity.py .` from repository root. SHA-256 sorted relative file manifest includes untracked files, bytes, types, modes, symlink targets; excludes only .git and mutable BUILD/SLICES bookkeeping. Contract canonicalizes BUILD through Tests and SLICES excluding Run status/Release evidence/placement headings, plus full AGENTS/LOOP/BUILDER/REVIEWER and identity.py bytes. Manifest JSON stored outside coverage at ../../work/loop-state/. No dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source is an external reference at ../../work/deepseek-harness; verify `git -C ../../work/deepseek-harness rev-parse HEAD` and `git -C ../../work/deepseek-harness status --porcelain --untracked-files=all`; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Any adapter edits must live in covered project files. Snapshot rules are bound via this exact identity.py algorithm; changing rules requires plan re-review. Baseline copy: ../../work/loop-state/baseline-02/. Original initial baseline and identity-v1.py retained for review history.
Baseline snapshot: d7f13d36a17f52722bbca47a8b15c66c0983e277c1ce843af4174c60a80ede89
Contract identity: e42780a8b4f0d64b51b6be80014ea4a6a8dd05db1d814fa1895db96ccb85dcfd
Candidate snapshot: 8833229967769333d41946441829fdf7cb3286fbce24e266071694889cfbd022
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: none reported by Builder; full independent implementation review pending
Repair awaiting review: false
Review events: 02-plan-013 / APPROVE_PLAN / identities match / no blockers; rejections0/no-progress0. Immutable01 history in slices/01-hidden-engine-feasibility.md
Budget limit / consumed / measurement: no budget supplied
Blocker / resume status / resume action / recheck condition / deadline: none; user enabled Codex computer use and ChatGPT Accessibility; same InputProbe permission recheck returned CGPreflightPostEventAccess=true. Specific test-only CGEvent authorization persists. Actual GUI checkpoint still required.
Review event: 02-review-017 / APPROVE_IMPLEMENTATION / identities matched; all six criteria independently verified, no blockers, rejections0/no-progress0. Verbatim ../../work/loop-state/02-review-017.md.
Advance phase: archive pending
Next slice ID / draft: none

## Status
Shipped

## Next
Archive accepted02 receipt, select03 and draft proposal under LOOP.
