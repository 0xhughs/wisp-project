# Computer control (fixture Accessibility and Drawn Canary)

Wisp can act on one Wisp-owned demonstration window. Structured macOS Accessibility is the Fixture Button path. When Accessibility cannot reach a control, one closed visual fallback clicks the Drawn Canary drawing inside the same window. This is the same companion, not a second agent. Each call uses the accepted 06 native gate: Allow Once, Deny, or Cancel Request. There is no Allow Always. Granting Accessibility in System Settings is not Allow Once. Screen Recording and Input Monitoring are not requested by this visual click and are not a grant. A spoken or typed yes, a saved key, plugin install, connection save, skill Enable, pet Apply or memory instruction is not a grant.

This slice does not ship general control of other applications, Spotlight or desktop-wide search, general screenshot clicking, or Windows UI Automation.

## Accessibility tools

Source id is `wisp-ax`. The six tools are admitted in normal mode alongside the three slice-09 Direct tools.

| Tool | Arguments | Destination | After Allow Once (TCC trusted) |
| --- | --- | --- | --- |
| `wisp_ax_focus_window` | `{title}` exactly `Wisp Accessibility Fixture` | `ax-fixture-window` | One structured raise/focus of that fixture window |
| `wisp_ax_move_window` | `{title,dx,dy}` | `ax-fixture-window` | One bounded position nudge, clamped onto a visible screen |
| `wisp_ax_read_focused` | `{}` | `ax-fixture-focused` | One bounded snapshot of focus inside the fixture only |
| `wisp_ax_click_named` | `{name}` exactly `Fixture Button` | `ax-fixture-control:Fixture Button` | One press of that unique control |
| `wisp_ax_type_named` | `{name,text}` name `Fixture Field` | `ax-fixture-field:Fixture Field` | One set-value of that unique field (not key synthesis) |
| `wisp_ax_find_named` | `{name}` one of Fixture Button / Fixture Field / Fixture Marker | `ax-fixture-search:<name>` | One bounded tree search; never press or type |

Unknown titles, names, `(0,0)` deltas, extra keys and non-printable text fail closed before a native prompt. `Drawn Canary` is not an AX find name.

`dx` / `dy` are strings matching `^-?(0|[1-9][0-9]?)$`, integers in `[-64,64]`, not both `0`. `text` is length 1–80 with no control, bidi or NUL characters.

## Visual fallback

Source id is `wisp-visual`. One tool is admitted in normal mode in addition to the 09 three and the 15 six.

| Tool | Arguments | Destination | After Allow Once |
| --- | --- | --- | --- |
| `wisp_visual_click_drawn` | `{title,target}` exactly `Wisp Accessibility Fixture` + `Drawn Canary` | `visual-fixture-canary:Drawn Canary` | Unique Drawn Canary pixel match inside the owned fixture, then one left mouse down/up at that local point. `Drawn Count` +1. `Fixture Count` unchanged. |

`target` `Fixture Button` (and any other name) fails closed before a native prompt. `wisp_ax_click_named` remains the only Fixture Button path.

After Allow Once, native rasters only that Wisp-owned fixture content view in-process (`bitmapImageRepForCachingDisplay` / `cacheDisplay`). It does not capture the desktop, other applications, or the menu bar. Unique match is exactly one 8×8 core (sRGB 255,255,255) with surrounding fill (sRGB 190,18,60) whose centroid lies inside the 48×48 canary. Zero or more than one match completes `failed` with zero mouse events. Deny, Cancel, Escape/close, timeout, stale generation and missing grant never notify native: zero bitmaps, zero mouse events, zero `Drawn Count` change. The bitmap is discarded after the match.

Drawn Canary is a 48×48 DIP `NSView`, not a button. `isAccessibilityElement` is false. It has no accessibility title, label, or description. Independent `Drawn Count: N` starts at 0. The increment comes from the mouse event hitting that view.

## TCC

Computer control Accessibility tools use macOS Accessibility. Grant it in System Settings → Privacy & Security → Accessibility. Wisp will not act on those tools without both TCC and Allow Once. Turning Accessibility on is not a standing tool grant. Settings → Permissions includes a user-initiated Open Accessibility Settings control; that control may prompt TCC. Launch, initialize, tool describe and tool execute do not prompt TCC and do not start background Accessibility observers. If the process is not trusted, native AX performs zero Accessibility element calls and completes `untrusted`. Linux has no TCC.

The visual path does not call Accessibility APIs and does not request Screen Recording or Input Monitoring.

## Native channels

The engine child has no AppKit. After `consume()`, AX tools notify `wisp.ax.requested`. Native handles `ax-request`, re-validates, then completes `wisp/ax.complete`. Visual tools notify `wisp.visual.requested`. Native handles `visual-request`, re-validates, then completes `wisp/visual.complete`. The two channels stay separate. Lost acknowledgement is not retried. Deny, Cancel, Escape/close, timeout, stale generation and missing grant never notify native.

The demonstration target is the titled fixture window, not the mascot and not Settings. It exposes Fixture Button, Fixture Field, Fixture Marker, Fixture Count, Drawn Canary, and Drawn Count. The mascot stays non-key/non-main; idle transparent regions still click through.

Linux checks use recording drivers and never call Accessibility APIs, raster pixels, post mouse events, or spawn helpers.

## Boundaries

Slice 09 URL/file/time stay Direct (`wisp-safe-action`) and keep their own `wisp.open.requested` channel. Stock `tool-bash`, `tool-fs` and `tool-web` stay disabled. Other applications, Spotlight, menu bar, Dock, drag, scroll, OCR, and Windows `SendInput` remain later remainder, not this demonstration.

Outcomes use existing voice and Wisp surfaces; there is no chat composer. Slices 07 and 15 are not assumed working.
