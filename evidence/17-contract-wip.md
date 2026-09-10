# NOT ACCEPTED — unaccepted slice 17 working contract

This file is **not** an accepted-slice archive. Slice 17 is **not Shipped**.
Do not treat this path as `slices/17-windows-companion.md`.

Parked 2026-09-10 after independent **17-review-093 IMPLEMENTATION_READY** (reviewer `bc-efc175aa-9c93-5e5b-9fb5-dda53741fd30`). Remaining Windows/human gaps are backlog only. Historical **07-review-060** remains **HUMAN_REQUIRED**. Linux 17-build-092 seams are implemented with verification pending.

Approved slice-17 contract: `691b64a52b69ed54447cb1e399c8ac85004c8165cf571c953f958f28a7fbf195`.
Implementation candidate: `28bc82ae285d081a0d6639a093eeb7d023bdcddfcb51552f709cba15527f5e47` (282 files).
Verbatim reviews: `$HOME/wisp-work/loop-state/17-review-093.md`, `$HOME/wisp-work/loop-state/17-plan-091.md`.

The body below is BUILD Slice through Tests at park time.

---

# BUILD — active contract

Slice: 17 Windows companion
Archive: (none; not shipped)

## Goal

Bring the same Wisp identity onto Windows as one closed desktop-body demonstration: a transparent always-on-top mascot with idle click-through, a Wisp-owned tray, and a global shortcut, reading the same user-chosen home (`wisp-home.json` companion UUID, `memory.json`) that macOS already uses.

Wisp remains one persistent desktop AI companion. Changing OS does not mint a second agent. The Windows body is an interchangeable visual host for that identity, not a second assistant and not an observer of a separate engine.

This slice does **not** ship full Windows parity. SLICES Provides names body, click-through, shortcut, tray, voice/local-model management, release parity, and UI Automation together; discovery shows those are several substantial independent outcomes. This contract covers **body + click-through + tray + shortcut + same-home identity** only. Honest remainder is later 17.x (not this contract, not 16/18/19/20/21):

- **17.x-engine** — attach the existing Node `body-bridge` / pinned Harness on Windows. Inspected POSIX seams (`process.getuid`, `O_NOFOLLOW`, mode `0o077`, `SIGTERM`, macOS-only `EngineBridge` `PATH`) are evidence that engine attach is a separate increment, not a silent Linux “fix.”
- **17.x-voice** — Windows speech recognition/TTS and shortcut → microphone (07 analog). Shortcut in this slice only shows the body.
- **17.x-models** — Windows hardware inspect / Ollama onboarding (08 analog).
- **17.x-management** — eleven-section Settings parity (03 analog beyond General).
- **17.x-actions** — URL/file/time via a Wisp-owned Windows opener after 06 (09 analog). Do not call pin `openNativePath` / `tool-pwsh` as computer control.
- **17.x-uia** — structured UI Automation computer control (15 analog). Prefer UIA when that control is contracted. Not this slice. No always-on UIA, no screenshot clicking (16).
- **17.x-installer** — installer, Start Menu, signing, publication.

The pinned DeepSeek Harness at `d347e703908d0406b7a7ef80e3a0e594d86b2215` has **no** UI Automation / `IUIAutomation` / Win32 computer-control tools and **no** extra SDK RPCs for a Windows desktop body. Inspected `packages/sdk/server/src/server.ts` `handleRequest` remains `initialize` / `session/prompt` / `shutdown`. Win32 code in the pin is process/Job-Object primitives (`packages/subprocess/win32-process`), a host **directory chooser** (`IFileOpenDialog` in `directory-picker-native`), and `tool-pwsh`. Playwright “accessibility” hits are web-client test trees, not UIA. An integration gap is not permission to invent supported Harness APIs. Do not call the pin directory picker, `runNativeCommand`, or `openNativePath` from this Windows host; Wisp owns its own folder dialog.

Parked 07–15 are implemented with verification pending, not Shipped. Do not assume they work. This slice must **not** edit `desktop/macos/**`, permission-protocol, overlay admission, or `body-bridge` in order to avoid a shared-protocol retest. macOS tests do not prove Windows. Linux may author Windows sources marked **uncompiled/unverified** (`missing-platform`).

This slice is inside the authorized 01–21 implementation target (2026-09-10) and **outside** the macOS first-release acceptance gates (01–14).

## Done when

1. **Layered always-on-top body; per-pixel click-through; no focus theft.** A reproducible Windows MSVC/CMake build (documented host/SDK; this Linux host does not compile it) produces a Wisp-owned Win32 executable. The body is a borderless layered HWND using per-pixel alpha (`WS_EX_LAYERED` + `UpdateLayeredWindow`, not a color-key-only fake and not a whole-window `WS_EX_TRANSPARENT` that would also punch through opaque pixels). Idle transparent pixels (corners and the accepted-02 orb interior gap) pass real clicks and scrolls to an independent underlying application. Visible opaque pixels accept drag and remain usable after repeated drags, deactivation, and animation. The window stays `HWND_TOPMOST` at a normal topmost tool level, `WS_EX_NOACTIVATE` / `WS_EX_TOOLWINDOW` so it does not steal activation or create a taskbar button, and it does not show a rectangular backing/shadow that blocks the desktop. Source flags, screenshots alone, and mocked HWNDs cannot establish input behavior. Record actual observations over an ordinary Win32 window (for example Notepad) including crossing the visible edge. Protected system UI (UAC secure desktop, full-screen exclusive games) may supersede Wisp; document observed behavior rather than raising the window above the secure desktop. The product body must not require UI Access, UI Automation, an accessibility hook, a low-level keyboard/mouse hook, `SendInput`, or synthetic click forwarding. First implementation checkpoint: criteria 1 click-through/always-on-top/no-activate must be proven on a real Windows desktop before filling tray/shortcut/identity chrome.

   Closed drawing for this increment: the accepted-02 even-odd orb (`wisp-orb`) only, 160×160 DIP, corner alpha 0, interior-gap alpha 0, unique opaque sample matching `RASTER_SAMPLES['wisp-orb']`. Fox/robot switching remains 13 / 17.x-management. Idle has restrained animation; developer-only `listen` / `speak` / `sequence` present distinct listening and speaking reactions and interrupt back to idle. These are simulated presentation states. There is no microphone, recognition, or TTS. Invalid/stale transitions cannot leave a stuck listening/speaking reaction after stop, hide, or view rebuild. Pause animation when hidden/destroyed. Respect Windows “show animations in Windows” / client-area animation (`SystemParametersInfo` SPI animation queries); when animations are off, draw a static idle frame.

2. **Tray controls; Show Companion; Quit; honest unavailability.** Exactly one `Shell_NotifyIcon` item, accessible name “Wisp”. The menu exposes Show Companion, Choose Wisp Folder…, Settings/General (same General surface), and Quit Wisp. Wake Voice and Mute are present and **disabled**, labeled voice unavailable; they must not capture audio, change mute, or flash a fake success because a future engine might exist. Show Companion reveals and clamps the existing body onto a visible monitor work area without activating it, without starting audio, and without minting identity. Closing General leaves the body and tray running. Closing the last titled window must not terminate the process (no accidental last-window exit). Quit Wisp removes the icon, destroys the body, and exits; relaunch does not leave a duplicate icon. Startup failure still creates the tray so the user can read Diagnostics-style copy and quit. No chat composer, prompt field, conversation history, or Harness web UI.

3. **Global shortcut shows the same companion; Alt+Space is not used.** Register `RegisterHotKey` for **Ctrl+Alt+W** (`MOD_CONTROL|MOD_ALT`, `'W'`). This is a platform-specific chord: macOS 07 uses Option–Space; **Alt+Space on Windows opens the system window menu** and must not be registered. A successful registration shows “Ctrl+Alt+W · registered” on General. Failure shows “Ctrl+Alt+W unavailable (conflict); use Show Companion” and must not install a `WH_KEYBOARD_LL` hook as a fallback. Pressing the registered chord while another owned app is focused reveals/clamps the body without making it the foreground key window and without starting capture. Developer mode may also edge-trigger the simulated listening presentation the way macOS developer `listen` does; that is not voice. Unregister on Quit. Do not implement 18 wake-word.

4. **Same Wisp identity; Windows pointer is not a second agent.** Companion identity is the UUID in the user-chosen folder’s `wisp-home.json` (`{"version":1,"companionId":"<uuid>"}`), the same marker macOS HomeStore already writes. `memory.json` remains the editable memory document (version 1, categorized entries). Choosing an **existing** Wisp home reuses that UUID and must not write a new one. Choosing a new empty dedicated folder mints one UUID once, writes `wisp-home.json`, `memory.json`, `README.txt`, `files/`, and `.wisp-lock` with the same documented format as slice 04. Cancel on the chooser changes nothing.

   The Windows private pointer lives under the current user’s local AppData Wisp directory (implementation: `%LOCALAPPDATA%\Wisp\home.json` or an explicit `--test-support` child of marked scratch in developer mode) as JSON `{"version":1,"companionId":"<uuid>","path":"<absolute>"}`. This pointer is **not** a macOS bookmark blob and is **not** a second companion. It only remembers which folder this Windows login should reopen. Fully qualified paths only (`C:\...` or `\\server\share\...`); reject relative paths, `..`, NTFS ADS suffixes, and pointers that point inside the AppData support directory or inside the executable scratch. If `wisp-home.json` is present, its UUID must match the pointer’s `companionId`. A copied folder with a valid marker is that same companion on this OS; this slice does not claim simultaneous Mac+Windows writers on one network path (exclusive lock; if the lock is held, refuse). Windows owner-only DACLs replace POSIX `0700`/`0600` as the platform boundary; do not rewrite the home README format.

   Folder picking uses a **Wisp-owned** `IFileOpenDialog` (`FOS_PICKFOLDERS`) inside the Wisp process. Do not spawn pin `directory-picker-native`, `osascript`, PowerShell, or `explorer.exe` as a picker. Credentials stay out of memory and Diagnostics. Diagnostics may show the nonsecret companion UUID and folder path, never keys, bookmark blobs, or engine stderr.

   This increment does **not** attach Harness. General/Diagnostics state that the hidden engine is not attached on Windows in this slice (17.x-engine). Reading `memory.json` is for identity/display only; do not start Node, do not call `session/prompt`, and do not load `body-bridge.mjs`.

5. **Product invariants and later-slice boundaries.** No chat window, text composer, conversation history, or Harness web/chat UI. 06 Allow Once / Deny / Cancel remain the action gate for tools; this slice admits **zero** new tools and must not expand `permission-protocol`, `Admission`, or overlay inventory. Stock `tool-pwsh` / `tool-bash` / `tool-fs` / `tool-web` stay disabled. Do not implement 14, 16 (no `SendInput` click-by-coordinate, no screenshot targeting), 18, 19, 20, 21. Do not resolve Open decisions. Visual click stays 16. UIA stays 17.x-uia. Wake-word stays 18. macOS sources under `desktop/macos/` stay byte-unchanged unless a later contract says otherwise. Parked 07–15 stay unaccepted; do not mark them Shipped. Permissions copy on macOS may keep “Windows computer control unavailable”; that remains true for UIA. Open decisions (18/20/21) stay unresolved.

6. **Observable proof with honest Linux/Windows split.** Linux-supplemental JS schema/state tests pass on this host. Native Win32 sources may be written on Linux but remain **uncompiled/unverified** here (`missing-platform`). Actual MSVC compile, layered click-through, tray, `RegisterHotKey`, AppData pointer, `IFileOpenDialog`, and DACL checks are Windows/human backlog items, not Linux passes. Isolated pin-runtime initialize is **not** a 17 requirement (no engine attach). No reserved DeepSeek call, no model download, no key inspection, no merge/publish/spend. Candidate/contract identities and pristine pin/archive checks are ready for independent plan review then, after implementation, independent implementation review. This dispatch does not approve the plan or mark 07–15 Shipped.

## Out

- Full Windows parity in one slice: voice capture/TTS, local-model onboarding, eleven-section Settings, 09 openers, UI Automation, installer/signing.
- Attaching or spawning Harness / `body-bridge` / Node on Windows (17.x-engine). Inventing stock SDK Windows desktop or UIA RPCs.
- Calling pin `directory-picker-native`, `IFileOpenDialog` koffi worker, `openNativePath`, `tool-pwsh`, `tool-pwsh-persistent`, or `win32-process` Job Objects as the Wisp body, tray, picker, or computer-control path.
- Enabling `tool-pwsh` (or any `DISABLED_STOCK_IDS` row) because the host is Windows.
- Whole-window `WS_EX_TRANSPARENT`, `WS_EX_LAYERED` color-key as the only hit mask, `SetWindowsHookEx` keyboard/mouse hooks, `SendInput` / `mouse_event`, UI Access manifest, always-on UIA, screenshot targeting, or any slice-16 visual click.
- Registering Alt+Space or copying macOS Option–Space onto Windows.
- A second companion UUID because the OS changed; merging two homes; cloud sync; treating AppData as the user-visible Wisp home.
- Chat composer, transcript UI, Harness web UI, `dsh` CLI, or embedded Chromium/Electron as the body.
- Editing `desktop/macos/**`, `spike/**`, archives 01–06, permission-protocol / overlay admission / `body-bridge` to “make Windows work.”
- Writing `slices/07-*.md` through `slices/17-*.md`. Marking 07–15 Shipped.
- Resolving SLICES Open decisions (18/20/21). Inventing numeric performance targets or a supported Windows SKU floor.
- Spending the reserved DeepSeek agent greeting 0/1 or the exhausted 05 cloud 6/6; downloading models; inspecting keys; merging, publishing, signing, or deploying.
- Disabling permission, privacy, credential, cancellation, or release safeguards to make tests pass.

## Constraints

**Chosen demonstration (closed; this is the contract choice).** SLICES Provides is covered only for the Windows body/tray/shortcut/identity increment above. Discovery: click-through, tray, shortcut, and same-home identity share one native Win32 host and are one coherent slice. Voice, models, UIA, engine attach, and installer do not share that host’s proof and are 17.x. Do not pretend this slice ships every Provides bullet.

**Routine stack (reversible; source inspection, not runtime proof).** Use a C++17 Win32 executable (CMake + MSVC on Windows) with GDI+/WIC (or GDI+ alone) to draw the orb into a 32-bit BGRA buffer and `UpdateLayeredWindow`. Tray via `Shell_NotifyIconW`. Shortcut via `RegisterHotKey`. Folder chooser via `IFileOpenDialog`. Message loop on one UI thread. This parallels accepted-02 Swift/AppKit: native OS toolkit, no browser renderer. Linux may author `.cpp`/`.h`/`CMakeLists.txt`. g++ on this host must not be claimed as Win32 proof; optional portable unit objects (identity JSON, geometry clamp, BodyPhase table) may compile with g++ as Linux-supplemental only if they contain no `windows.h`. DPI: declare per-monitor-v2 awareness in the manifest; geometry uses DIP vs physical pixels honestly. A `windows.h`-free subset that fails to compile here is still not a Windows GUI pass.

**Click-through mechanics.** Per-pixel alpha is the hit source. `WM_NCHITTEST` returns `HTTRANSPARENT` for alpha-0 DIPs and a drag hit for opaque pixels (or `UpdateLayeredWindow`’s documented alpha hit-testing if that is what the implementation uses — whichever is used must be the one proven in the GUI gate). Do not capture clicks and post them to the window underneath. Do not use `WS_EX_TRANSPARENT` for the body HWND. Dispose any timers on hide/destroy. Clamp to the monitor work area after display change (`WM_DISPLAYCHANGE` / `WM_DPICHANGED`). Test negative virtual-screen coordinates deterministically even if this host has one display.

**No engine, no new tools, no protocol edits.** Do not start Node. Do not import `spike/client.mjs` from the Windows host. Do not add `wisp_uia_*` tools. Do not notify `wisp.ax.requested` or invent `wisp.uia.requested`. Overlay `DISABLED_STOCK_IDS` including `tool-pwsh` stays unchanged. Because permission/engine seams are not edited, **do not require 06/07/09/10/11/12/15 protocol retest for this slice.** If implementation later must touch those seams, stop and return a contract change.

**Identity files (shared format, Windows pointer).** Reuse slice-04 leaf names and JSON shapes. Do not invent a second `companionId` key. Windows `home.json` pointer keys are exactly `version`, `companionId`, `path` (no bookmark). Developer `--test-support` must be a direct child of marked `--scratch` with `.wisp-owned`, matching the macOS isolation idea, implemented with Win32 paths. Never use the operator’s real `%LOCALAPPDATA%\Wisp` in tests.

**06 gate (do not weaken, do not exercise).** No Windows permission window is required because no tools run. Do not add Allow Always. Do not treat folder choose, tray Quit, or shortcut as a tool grant.

**Unaccepted 07–15.** Voice, AX, plugins, MCP, skills, pets Apply, onboarding, and 09 openers are not Windows features here. If a pet snapshot file exists in the home, General may show the catalog id as nonsecret text; this slice still draws only `wisp-orb` and must not Apply a pet (13).

**Linux implementation track.** This Linux/cloud host authors JS tests and Windows sources. Linux checks do not establish Win32 layering, tray, hotkeys, DACLs, or GUI. Mocks and source inspection are supplemental. Mark Win32 uncompiled/unverified unless a compatible Windows runner compiles it. Do not mark 07–15 Shipped. Do not download models, inspect keys, merge, publish, or spend.

**Expected owned paths (routine implementation choices; names may vary as marked).**

- `desktop/windows/CMakeLists.txt`; `desktop/windows/Sources/` body HWND, layered buffer, tray, hotkey, General dialog, home pointer, orb draw, geometry clamp
- `desktop/windows/wisp.manifest` (dpiAware, no `uiAccess`)
- `desktop/scripts/build-windows.sh` or `desktop/scripts/build-windows.ps1` (no-op/skip with explicit missing-platform on Linux)
- `desktop/engine/windows-home.mjs` (pointer + marker validators; no `getuid`)
- `desktop/tests/windows-home.test.mjs`, `desktop/tests/windows-body-state.test.mjs`; extend `tools/linux-js-tests.sh`
- `docs/windows-companion.md`; pointer from `docs/desktop-body.md` without rewriting accepted-02 evidence
- Sanitized `evidence/17-windows-companion.md` / JSON at implementation
- Independent GUI target notes under `desktop/tests/gui/` (Windows) — test-only, not shipped

Do not add a `desktop/macos` file in this slice.

## Data / state impact

Presentation phase, body position, tray handle, and hotkey registration are process-memory-only except:

- User-chosen Wisp home files (`wisp-home.json`, `memory.json`, `README.txt`, `files/`, `.wisp-lock`) using the existing format.
- Windows login pointer `%LOCALAPPDATA%\Wisp\home.json` (or developer test-support equivalent).

No new durable Allow Always. No UIA grant bit. No second companion UUID. Creating the body must not rewrite `memory.json` entries. Choosing a folder must not rewrite `companionId` on an existing valid marker.

Diagnostics may show nonsecret UUID, path, hotkey status, and “engine not attached (Windows 17)”. They must not dump memory texts by default, keys, or raw OS errors that embed user documents.

Use fresh `$HOME/wisp-work/wisp-17/<dispatch>/` (or equivalent external) for Linux-supplemental scratch. Windows proof roots stay on the Windows runner. Archives 01–06 and accepted spike bytes remain immutable. Unaccepted 07–15 copies under `evidence/` stay labeled NOT ACCEPTED.

Identity, selected Wisp home, and durable memory survive a Windows relaunch via the pointer. Models route, Voice mute, plugin/connection/skill snapshots, and pet catalog Apply are not Windows-managed this slice; files already in the home must remain untouched except the pointer attach.

## Proposed implementation order

After independent APPROVE_PLAN against the coordinator-adopted contract/baseline (no code in this dispatch):

1. **Linux-supplemental validators (no Win32).** Add `windows-home.mjs` validators: marker `{version:1,companionId}`; pointer `{version:1,companionId,path}`; reject relative/`..`/bookmark keys/extra keys; existing marker UUID wins; empty-folder mint is a pure function tested with injected UUIDs. BodyPhase table matches accepted-02 (idle↔listening→speaking, interrupt to idle, hide pauses animation). Shortcut chord constants: Ctrl+Alt+W, not Alt+Space. Overlay still lists `tool-pwsh` in `DISABLED_STOCK_IDS`. Product Windows sources (once added) must not mention `SendInput`, `mouse_event`, `WH_KEYBOARD_LL`, or `IUIAutomation` as effect paths. Do not call UIA.

2. **Win32 body + layered click-through (sources on Linux, uncompiled here).** Orb buffer, `UpdateLayeredWindow`, `WS_EX_NOACTIVATE` | `WS_EX_TOOLWINDOW` | topmost, drag on opaque, clamp/geometry, Reduce Motion query, developer raster samples. Mark CMake/MSVC uncompiled on Linux. GUI gate is Windows-only.

3. **Tray + General + shortcut + home pointer (sources on Linux, uncompiled here).** NotifyIcon, General dialog, `IFileOpenDialog`, AppData/test-support pointer, exclusive lock analog, Quit cleanup, `RegisterHotKey` Ctrl+Alt+W with conflict copy. No Node spawn. No permission window.

4. **Docs, identities, Linux tests.** `docs/windows-companion.md`. Update desktop-body docs with a Windows pointer and the 17.x remainder list. Keep macos/engine protocol tests unchanged. Recheck `identity.py`. Hand back proposed proof; independent Reviewer decides. Remaining Windows compile/GUI/hotkey/DACL items go to the SLICES verification backlog; do not self-approve.

Exact filenames above are routine implementation choices.

## Tests

Required deliverables after plan approval; none claimed run in this no-code phase.

1. **Linux-supplemental JS (must pass on this host).** Extend `sh tools/linux-js-tests.sh` with `desktop/tests/windows-home.test.mjs` and `desktop/tests/windows-body-state.test.mjs` covering: marker/pointer schemas; extra keys fail; relative path fail; existing `wisp-home.json` UUID reused; mint only when marker absent; BodyPhase interruption; shortcut label Ctrl+Alt+W and explicit reject of Alt+Space as the Windows product chord; `DISABLED_STOCK_IDS` still contains `tool-pwsh`; inventory/admission files still have no `wisp_uia_` names. Label results Linux-supplemental. They cannot satisfy Win32 layering, tray, hotkeys, DACLs, or GUI Done when items.

2. **No isolated product runtime for 17.** Pin-runtime initialize is not in this slice (no engine attach). Do not claim initialize passed. No cloud, no key read, no model download, no real UIA.

3. **Protocol non-touch obligation.** `desktop/macos/**`, `desktop/engine/permission-protocol.mjs`, `desktop/engine/body-bridge.mjs`, `desktop/engine/plugin-overlay.mjs` `DISABLED_STOCK_IDS`, and `product.patch.yml` remain unchanged by this slice. Existing linux-js-tests continue to pass as regression. If they must change, that is a contract change, not a silent repair. Do not treat 07–15 as accepted.

4. **Windows native compile (Windows runner; uncompiled on Linux).** CMake+MSVC builds `Wisp.exe` (name may vary) and a dependency-free assertion runner covering: pointer decode/reject; marker reuse; General copy that voice/UIA/engine are unavailable; hotkey constants; no `uiAccess` in the manifest. `desktop/scripts/build-windows.ps1` (or equivalent) is skip/missing-platform on this Linux host.

5. **Windows GUI / tray / shortcut / identity (verification backlog, not Linux proof).** On a declared Windows desktop, isolated test-support: launch; click through orb corners and interior gap onto an independent titled target with a click canary; drag opaque pixels; Show Companion from the tray without activation theft; Choose Folder cancel then choose empty (one UUID) then relaunch (same UUID); choose a fixture home that already contains `wisp-home.json` and confirm no new UUID; Ctrl+Alt+W while the target is focused shows the body without capture; conflict copy if registration fails; Quit removes the icon and leaves no owned process. Native compile assertions pass. Do not spend DeepSeek 0/1. Do not click arbitrary elevated windows. Do not enable UI Access.

6. **Regressions and identities.** Existing macos/engine/spike tests remain applicable and must not be rewritten for Windows claims. Pristine pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`, byte-identical spike and archives 01–06. No 07, 08, 09, 10, 11, 12, 13, or 15 Shipped claim. Final proof maps each Done when item to Linux-supplemental vs Windows-native evidence.
