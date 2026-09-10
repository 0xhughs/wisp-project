# Slice 17 Windows companion — Builder proposed proof (NOT ACCEPTED)

Dispatch **17-build-092**. Independent Builder proposed evidence. This is **not** independent review, **not** 17 acceptance, and **not** Shipped. Slices 07–15 remain implemented with verification pending. No `slices/17-*.md`.

## What this increment contains

Windows desktop body + per-pixel click-through + tray + Ctrl+Alt+W + same `wisp-home.json` identity. Honest remainder (engine attach, voice, models, eleven-section Settings, 09 openers, UIA, installer) stays Out.

## Linux-supplemental (this host)

- `desktop/engine/windows-home.mjs`, `desktop/engine/windows-body-state.mjs`
- `desktop/tests/windows-home.test.mjs`, `desktop/tests/windows-body-state.test.mjs`
- `tools/linux-js-tests.sh` extended (existing tests kept)
- `desktop/scripts/build-windows.sh` prints `missing-platform` and does not compile Win32

These checks cannot satisfy layered HWND hit-testing, tray, `RegisterHotKey`, `IFileOpenDialog`, DACLs, or GUI Done when items (`missing-platform` / `human-test`).

## Win32 sources (uncompiled / unverified here)

`desktop/windows/` CMake+MSVC sources, `wisp.manifest` (`dpiAware`, `uiAccess` false). Portable objects have no `windows.h`. `WispNativeChecks` is the Windows assertion runner, not a Linux GUI pass.

## Sanitized facts

- Marker keys: `version`, `companionId`. Pointer keys: `version`, `companionId`, `path`. No bookmark blob.
- Overlay `DISABLED_STOCK_IDS` still contains `tool-pwsh` (file not edited).
- Inventory/admission files have no `wisp_uia_` names.
- Product Windows sources do not call synthetic input, a low-level keyboard hook, or UI Automation as effect paths.
- Pin `d347e703908d0406b7a7ef80e3a0e594d86b2215` not edited.
- `desktop/macos/**`, `permission-protocol.mjs`, `body-bridge.mjs`, overlay `DISABLED_STOCK_IDS`, `product.patch.yml` not edited.

## Not claimed

MSVC compile, layered click-through over Notepad, tray Show Companion without activation theft, live `RegisterHotKey`, AppData DACLs, `IFileOpenDialog` on a Windows desktop. No DeepSeek call, no model download, no key inspection.
