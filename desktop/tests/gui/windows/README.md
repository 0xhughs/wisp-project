# Independent Windows GUI notes (test-only, not shipped)

These notes are for a later Windows desktop runner. They are **not** Linux proof and **not** slice 17 acceptance. Do not treat CUA screenshots, mocked HWNDs, or this Linux host as click-through evidence.

## Product under test

Build on Windows with MSVC (never claimed on Linux):

```
desktop/scripts/build-windows.ps1 -Scratch <absolute-external>
```

Linux:

```
desktop/scripts/build-windows.sh
```

prints `missing-platform` and does not compile `windows.h` sources.

Launch isolated:

```
<scratch>/Wisp.exe --developer true --scratch <absolute-scratch> --test-support <scratch>\support
```

`<scratch>` must contain `.wisp-owned`. `--test-support` must be a direct child. Do not use a real operator `%LOCALAPPDATA%\Wisp`.

## Independent target

`ClickTarget.cpp` is a separate titled window with a click counter. Compile it outside the Wisp binary; do not link it into `Wisp.exe`. Place it under the orb. Record stdout JSON `count` / `x` / `y`. Raise this target, not arbitrary elevated windows. Do not enable UI Access.

## Raster / hit points (160×160 DIP, top-left)

Matches `RASTER_SAMPLES['wisp-orb']` and accepted-02 even-odd orb:

| Sample | DIP | Expected alpha |
|---|---|---|
| corner | 0,0 | 0 |
| interior gap | 80,98 | 0 |
| unique opaque | 40,80 | >0 |

Also click the other three corners. Developer `{"op":"raster"}` should report the same alphas from the actual DIB. Opaque pixels drag (`HTCAPTION`); alpha-0 returns `HTTRANSPARENT` and must reach the target (including an immediate opaque-edge → gap click). Do not use whole-window transparent extra style or color-key-only.

## Tray / shortcut / identity

- Tray accessible name `Wisp`. Menu: Show Companion, Choose Wisp Folder…, Settings/General, Quit Wisp. Wake Voice and Mute present and disabled (voice unavailable).
- Show Companion reveals/clamps without activation theft and without audio.
- Choose Folder: cancel changes nothing; empty folder mints one UUID; existing `wisp-home.json` UUID is reused; relaunch via pointer keeps that UUID.
- Register `Ctrl+Alt+W` (`MOD_CONTROL|MOD_ALT`, `'W'`). Alt+Space must not be registered. Conflict copy: `Ctrl+Alt+W unavailable (conflict); use Show Companion`. No low-level keyboard hook fallback.
- Quit removes the icon and owned process.

## Honest remainder

No engine attach, no microphone/TTS, no eleven-section Settings, no 09 openers, no UI Automation, no installer. Native compile assertions: `WispNativeChecks <path-to-wisp.manifest>`.
