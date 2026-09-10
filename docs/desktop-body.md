# Wisp macOS desktop body

Wisp is an AppKit floating, nonactivating panel with interchangeable original animated bodies. The application controller owns one anonymous-pipe Node bridge and one accepted Harness client/session. Replacing the view keeps that connection alive. The current body is one of a closed catalog (`wisp-orb` Wisp orb, `wisp-fox` Fox, `wisp-robot` Robot); default and missing snapshot restore the accepted-02 even-odd oval. Changing the pet recreates the drawing view inside the existing panel and does not restart the hidden engine. See `pets.md`. There is no chat interface. Listening/speaking in developer mode are explicitly simulated presentation signals. Microphone and speech playback belong to the unaccepted voice loop, not to pet selection.

## Build and run

Tested host: macOS26.5.2/build25F84, Swift6.3.3, command-line macOS SDK, arm64 Mac16,11 with24GiB memory. The package's macOS14 setting is a compiler compatibility choice, not a supported OS floor. Full Xcode is not needed.

From the project directory, choose an absolute scratch outside the source tree:

```sh
desktop/scripts/build-macos.sh --scratch /absolute/private/scratch
mkdir -p /absolute/private/scratch/run
chmod 700 /absolute/private/scratch/run
touch /absolute/private/scratch/run/.wisp-owned
desktop/scripts/run-macos.sh /absolute/private/scratch/Wisp.app /absolute/prepared/runtime /absolute/private/scratch/run
```

The runtime must already be the accepted prepared pin, with its `.wisp-spike.json`, installed dependencies and matching accepted engine files. The bridge verifies the pristine source pin, prepared tracked source, copied engine bytes and validated product reasoning configuration. It creates a private per-launch home under the marked scratch. It never provisions a model, exposes a listener or loads Harness UI. Use the existing authorized Node24/local model route. For this workspace the prepared runtime is `../../work/wisp-01/builder-01` and route `../../work/wisp-01-authorized-route.json`.

Run the executable directly as above so PID ownership and stop are explicit. `kill -TERM <native-pid>` requests ordinary cleanup; closing the controller-owned bridge input converges on accepted shutdown. The native app defers final exit until its bridge exits. Body replacement recreates and disposes the drawing view inside the controller's one persistent native panel, with an explicit autorelease scope. It creates no additional window. Missing or failed startup presents gray unavailable Wisp and never silently claims ready or restarts itself. Closing a body for replacement is separate from terminating the app.

This is local development assembly only: no signing, notarization, installer, bundled model, dependency distribution or publication is claimed.

## Tests

```sh
desktop/scripts/test-native.sh /absolute/private/scratch/native-tests
node --test desktop/tests/body-bridge.test.mjs
node desktop/tests/body-live.mjs --runtime-root /absolute/prepared/runtime --scratch /absolute/private/scratch/live --fixture-helper /absolute/external/HomeFixture
```

`body-live.mjs` defaults to the adjacent `Wisp.app/Contents/MacOS/WispBody`; use `--app /absolute/executable` if needed. Use a fresh live scratch each time. `--case normal` or a named lifecycle case limits a repair rerun. Native CLI tests compile the same production state, geometry and framing sources. The installed command-line toolchain has neither XCTest nor Swift Testing, so `swift test` is unavailable here; the dependency-free native assertion runner is the executable native test path.

The real live suite launches native→Node→pinned Harness, completes a harmless no-tool turn, replaces the body during a simulated reaction, exercises interruption/hide/show, and completes a second distinct turn with unchanged controller/session/PID. It tests native signal/loss, bridge signal/loss, engine failure during listening, and startup failure. Each case records safe native events and process/group cleanup. Hard-kill tests are explicitly distinguished from clean shutdown. A success record is written only after actual completion and no-orphan checks; raw model frames are not a user interface.

The bridge's completion window begins before each prompt request, preserving events buffered before its receipt while avoiding cumulative-history rejection on the second turn. It imports the accepted oracle unchanged. Unexpected approvals are scoped-denied, then the bridge becomes unavailable; it never permits the harmless test effect automatically. The emitted effects count is backed by no tool-call events and an empty/missing private ledger.

## Developer presentation and GUI proof

Launch the executable with the same explicit arguments plus `--developer true --test-support /absolute/private/scratch/run/support`, with stdin held open. The test-support directory must be a direct child of marked scratch; use the documented HomeFixture for regression tests. It accepts newline JSON containing only `op`. Supported bounded developer operations: `smoke`, `recall` (fixed test-only memory query), `sequence`, `listen`, `speak`, `interrupt`, `recreate`, `hide`, `show`, `status`, `raster`, `stop`. There is no arbitrary prompt, shell command, control socket or control file. Ordinary launch does not read these controls. `sequence` deterministically exercises listening→speaking→idle; `listen`/`speak` hold simulated states for inspection. `status` reports actual view/timer/window resources; `raster` samples alpha from the actual rendered view cache and reports `catalogId`, corner alpha, interior-gap alpha, and one body-unique opaque sample. `recreate` recreates the **current** pet inside the existing panel. These are developer diagnostics, not voice input.

See `desktop/tests/gui/README.md` for the independent target and globally posted input. The product does not post, capture or forward events and needs no Accessibility/Input Monitoring permission. The test operator's global driver does need posting access. Public window geometry and native target logs establish routing; CUA's app-addressed click is not acceptable evidence of cross-app hit testing.

The rendered body uses genuinely clear pixels in corners and its interior gap. Native macOS alpha hit routing passed the actual tests, so no whole-window polling switch or event monitor was added. Native dragging begins only on drawn pixels. The panel stays at the ordinary floating level3, non-key/non-main, without a rectangular shadow. It joins desktop Spaces and participates as a full-screen auxiliary window; protected system UI may supersede it.

Observed one3440×1440 display at1× scaling. Actual target full-screen Space entry/exit and ordinary desktop recovery were tested. Additional physical displays/scales were unavailable; deterministic tests cover negative origins, vertically arranged displays and removal/clamping. Host Reduce Motion was tested through System Settings and restored to its original off state. Animation stops when hidden/destroyed or when that preference is on. Resource observations are measurements, not an SLA or supported hardware floor.

## Current management shell (03)

The current app now provides its own menu bar and retained native Settings window. Open Settings from the Wisp status item, and use Quit Wisp for normal cleanup; closing Settings leaves the body alive. General provides Show Companion. Wake and Mute are explicitly unavailable until speech is integrated. See `management-shell.md` for launch/test procedure and `../evidence/03-management-shell.md` for the current regression results. The02 evidence and archive describe the earlier accepted body-only build and have not been rewritten.

## Current durable home (04)

General/Memory now chooses and retains a user folder with editable categorized knowledge. Normal launch restores it from private application-support bookmark state; no home is chosen by default. The hidden runtime starts only with valid configured memory, and its internal cwd/DSH_HOME stays outside that folder. Read `local-home-memory.md` for first selection, next-launch snapshot semantics, recovery and isolated verification. Never run developer tests without explicit test-support isolation. Historical02/03 evidence remains unchanged.

## Windows companion (17)

A separate Win32 host for the **same** companion identity is documented in `windows-companion.md`. This macOS document and accepted-02 evidence are unchanged as macOS proof. Slice 17 on Windows is body + click-through + tray + Ctrl+Alt+W + the same `wisp-home.json` UUID; engine attach, voice, models, eleven-section Settings, 09 openers, UI Automation, and installer remain 17.x. Linux authors of `desktop/windows` sources do not compile them here (`missing-platform`).

