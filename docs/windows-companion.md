# Wisp Windows companion (slice 17)

This host is a **closed increment**: a transparent always-on-top Win32 mascot with per-pixel click-through, a Wisp-owned tray, and **Ctrl+Alt+W**. It reads the same user-chosen home (`wisp-home.json` companion UUID, `memory.json`) that macOS already uses. Changing OS does not mint a second agent.

macOS AppKit evidence in `desktop-body.md` and accepted-02 archives is **not** rewritten here and does **not** prove Windows.

This slice does **not** attach the hidden engine, capture voice, manage models, ship eleven-section Settings, open URL/file/time, call UI Automation, or install/sign the app. Those remain later **17.x** work.

## Build

Documented Windows runner: CMake + MSVC, C++17, per-monitor-v2 DPI in `desktop/windows/wisp.manifest` (`uiAccess` is **false**).

```
desktop/scripts/build-windows.ps1 -Scratch <absolute-external-path>
```

This Linux/cloud host **cannot** compile `windows.h` sources. `desktop/scripts/build-windows.sh` prints `missing-platform` and does not produce `Wisp.exe`. Optional portable objects (`BodyState`, `Geometry`, `OrbRaster`, `HomeIdentity`) contain no `windows.h`; compiling them with g++ is Linux-supplemental only and is not a Win32 GUI pass.

Native assertion runner (Windows): `WispNativeChecks <repo>/desktop/windows/wisp.manifest`.

## Launch

Isolated developer launch (scratch **outside** source, marked `.wisp-owned`):

```
<scratch>/Wisp.exe --developer true --scratch <absolute-scratch> --test-support <scratch>\support
```

`--test-support` must be a **direct child** of `--scratch`. Ordinary launch uses `%LOCALAPPDATA%\Wisp\home.json` as the private pointer, never as the user-visible home. Never point tests at a real operator AppData tree.

The process does not start Node, does not load `body-bridge`, and does not show a permission window. Closing Settings/General leaves the body and tray running. **Quit Wisp** removes the notify icon, destroys the body, unregisters the hotkey, and exits.

## Body and click-through

The body is a borderless layered HWND: `WS_EX_LAYERED` + `UpdateLayeredWindow` with a 32-bit premultiplied BGRA buffer (not color-key-only). Extra styles: `WS_EX_NOACTIVATE` | `WS_EX_TOOLWINDOW` | `HWND_TOPMOST`. Idle transparent pixels (corners and the accepted-02 orb interior gap) return `HTTRANSPARENT`. Opaque pixels return `HTCAPTION` for drag. The product does not capture clicks and post them underneath.

Closed drawing: accepted-02 even-odd `wisp-orb`, 160×160 DIP. Corner alpha 0, interior-gap alpha 0, unique opaque sample matching `RASTER_SAMPLES['wisp-orb']` (`[40,80]`). Fox/robot switching is not this slice. Developer `listen` / `speak` / `sequence` are simulated presentation states (no microphone or TTS). Hide and destroy pause timers. `SystemParametersInfo` client-area / window animation queries: when animations are off, draw a static idle frame.

Protected system UI (UAC secure desktop, exclusive full-screen) may supersede Wisp. Geometry clamp covers negative virtual-screen coordinates.

## Tray, General, shortcut

Exactly one `Shell_NotifyIconW` item, name **Wisp**. Menu: Show Companion, Choose Wisp Folder…, Settings/General, Quit Wisp. **Wake Voice** and **Mute** are present and disabled, labeled voice unavailable.

Folder picking uses in-process `IFileOpenDialog` with `FOS_PICKFOLDERS`. Do not spawn a pin directory picker, PowerShell, or Explorer as the chooser.

Global shortcut: `RegisterHotKey` **Ctrl+Alt+W** (`MOD_CONTROL|MOD_ALT`, `'W'`). **Alt+Space** is the Windows system window menu and is not registered. Success copy: `Ctrl+Alt+W · registered`. Failure: `Ctrl+Alt+W unavailable (conflict); use Show Companion`. No low-level keyboard hook fallback.

## Same identity

`wisp-home.json` keys are exactly `version` and `companionId` (`version` 1). The Windows pointer `%LOCALAPPDATA%\Wisp\home.json` (or test-support `home.json`) keys are exactly `version`, `companionId`, `path`. Fully qualified `C:\...` or `\\server\share\...` only. Relative paths, `..`, NTFS ADS suffixes, bookmark keys, and extra keys are refused. An existing marker UUID wins; mint uses an injected UUID in tests and `CoCreateGuid` in production. README format is unchanged. Windows owner-only DACLs replace POSIX `0700`/`0600`. Exclusive lock analog: `LockFileEx` on `.wisp-lock` / `owner.lock`. If the lock is held, refuse that home.

Diagnostics/General may show the nonsecret UUID, folder path, hotkey status, and `engine not attached (Windows 17)`. Never keys, bookmark blobs, or engine stderr.

## Tests

Linux-supplemental (this host): `sh tools/linux-js-tests.sh` includes `desktop/tests/windows-home.test.mjs` and `desktop/tests/windows-body-state.test.mjs`. Those cannot satisfy layered click-through, tray, hotkeys, DACLs, or GUI Done when items.

Windows GUI procedure: `desktop/tests/gui/windows/README.md`. Independent `ClickTarget.cpp` is test-only.

## 17.x remainder (out)

- **17.x-engine** — attach Node `body-bridge` / pinned Harness
- **17.x-voice** — speech recognition/TTS; shortcut → microphone
- **17.x-models** — hardware inspect / Ollama onboarding
- **17.x-management** — eleven-section Settings
- **17.x-actions** — URL/file/time via a Wisp-owned opener
- **17.x-uia** — structured UI Automation
- **17.x-installer** — installer, Start Menu, signing
