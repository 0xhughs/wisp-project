# Independent desktop input test

`ClickTarget.swift` is a separate AppKit application with a real scroll view, clickable document and editable field. Its stdout JSON reports native click screen coordinates/count, actual scroll offset, fixed test text and key-window state. It is never shipped inside Wisp.

Build a target outside the source tree:

```sh
mkdir -p /absolute/scratch/ClickTarget.app/Contents/MacOS
swiftc desktop/tests/gui/ClickTarget.swift -o /absolute/scratch/ClickTarget.app/Contents/MacOS/ClickTarget
swiftc desktop/tests/gui/InputProbe.swift -o /absolute/scratch/InputProbe
```

Create `Contents/Info.plist` with `CFBundleExecutable=ClickTarget`, `CFBundleIdentifier=local.wisp.clicktarget.review`, `CFBundleName=ClickTarget`, `CFBundlePackageType=APPL`. Launch the executable with stdout redirected to the private proof root. Use a unique bundle identifier/path per review to avoid selecting an older compiled target. The target initially occupies AppKit x200/y200/w900/h700. Full-screen transitions may change its restored position; always reread geometry.

The user explicitly authorized this test-only Swift CGEvent driver. It posts to the global HID event stream, never to an app PID. Run `InputProbe permission` first; false means stop, without requesting or bypassing macOS permissions. Driver commands use Quartz global top-left coordinates: `windows`, `click x y`, `edge fromX fromY toX toY`, `drag fromX fromY toX toY`, `scroll x y`, and `type`. The only typing string is fixed `wisp-test`, and typing refuses unless ClickTarget is the foreground app. Verify the field focus independently before typing. Pointer commands are test-operator primitives: the operator must verify both points lie over owned test windows before invoking them. Do not aim at personal/other-app content.

On the observed1440-point-tall display, the initial Wisp panel has Quartz bounds500/880/160/160. Interior gap point580/978, opaque drag start580/925, corners505/885,655/885,505/1035,655/1035. `edge 580 925 580 978` crosses from opaque body to gap and posts the click immediately after the move; `edge 490 1045 505 1035` enters from outside to a clear corner. After drag, reread geometry and adjust points. AppKit target logs convert the received event to bottom-left screen coordinates, so Quartz580/978 is logged580/462.

Raise only the independent target with CUA before global testing. Place its scroll area under Wisp, click all corners/gap, scroll both gap/corner, drag opaque pixels repeatedly, type while its field remains focused, run simulated states/recreate/hide/show and repeat input. Record actual counter/offset/text/frame changes. Use its full-screen button to enter its own full-screen Space; verify Wisp remains onscreen and global gap clicks still reach the target, then Escape to return. Observe ordinary floating level3, non-key state and rendered transparent pixels. Never infer routing from `hitTest`, flags or CUA app-targeted events alone.

Use CUA screenshots for the owned target/body only. CUA's per-window PNG output flattens transparent pixels to white; therefore those images demonstrate the artwork/state/target content, not compositor alpha by themselves. Developer `raster` samples actual rendered corner/gap alpha; public window observations and global input supply the additional native evidence. No unrelated desktop image is needed.

The actual test used ChatGPT/Codex Accessibility access after the user enabled it. The test driver is ad-hoc signed; TCC responsibility should be checked on each host rather than guessed from its executable name. Wisp itself uses no such access. Stop generated apps after testing, restore Reduce Motion if changed, and retain only deliberate private proof. Previous blocked014/015 dispatches are documented in their immutable external handbacks; their failed/unperformed input attempts are not counted as passes.

## Management shell proof

Use `shell-live.mjs` alongside these tools. The native `status` response additionally reports the existing status button's AppKit window frame, selected section, safe lifecycle, retained Settings window number, key/main/visibility/minimization, current `NSApp.windows.count`, fixed owner observers and signal sources. These are read-only developer facts. They do not invoke menu actions and are absent without `--developer true`.

On the observed3440×1440 single display the status frame was3039/1410/51/30 (AppKit), so its verified global pointer center was3064/15 (Quartz). The actual owned menu was layer101 at3035/31/267/224. CUA's app AX snapshot on this host exposes the application menu but omits this status popup; `InputProbe windows` uses public `.optionAll` to distinguish visible and retained owned windows. Check `kCGWindowIsOnscreen`; absence means not currently onscreen. No unrelated app windows are printed.

After verifying this own status frame, a global click opens the real status menu. Observed menu centers on this OS: Change Pet3135/142, Change Model3135/164, Settings3135/186, Memory3135/208, Quit3135/242. Always remeasure on another display/OS. Following each action, read CUA Settings selection and private event facts; menu geometry or source selectors alone are not success. Wake/Mute remain disabled. Opening and dismissing the menu must leave the independent target able to type.

For minimize evidence use the actual yellow button in a freshly observed owned Settings frame if the AX action does not minimize. The tested760×542 outer window was at1340/223, with yellow button1379/239; private status then reported `settingsMiniaturized=true`. Reopening via actual Settings menu restores the same window. Resizing to620×440 exposes the navigation scroller; pointer Diagnostics and native End scrolling remain usable. Ten real Command-W/Command-comma cycles exercise close/reopen without generating a second controller. CUA screenshots cover only the owned Settings window; the popup is not included by that capture API, so no menu screenshot is claimed.
