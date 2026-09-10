# Computer control (fixture Accessibility)

Wisp can act on one Wisp-owned demonstration window through structured macOS Accessibility APIs. This is the same companion, not a second agent. Each call uses the accepted 06 native gate: Allow Once, Deny, or Cancel Request. There is no Allow Always. Granting Accessibility in System Settings is not Allow Once. A spoken or typed yes, a saved key, plugin install, connection save, skill Enable, pet Apply or memory instruction is not a grant.

This slice does not ship general control of other applications, Spotlight or desktop-wide search, visual clicking, or Windows UI Automation.

## Tools

Source id is `wisp-ax`. The six tools are admitted in normal mode alongside the three slice-09 Direct tools.

| Tool | Arguments | Destination | After Allow Once (TCC trusted) |
| --- | --- | --- | --- |
| `wisp_ax_focus_window` | `{title}` exactly `Wisp Accessibility Fixture` | `ax-fixture-window` | One structured raise/focus of that fixture window |
| `wisp_ax_move_window` | `{title,dx,dy}` | `ax-fixture-window` | One bounded position nudge, clamped onto a visible screen |
| `wisp_ax_read_focused` | `{}` | `ax-fixture-focused` | One bounded snapshot of focus inside the fixture only |
| `wisp_ax_click_named` | `{name}` exactly `Fixture Button` | `ax-fixture-control:Fixture Button` | One press of that unique control |
| `wisp_ax_type_named` | `{name,text}` name `Fixture Field` | `ax-fixture-field:Fixture Field` | One set-value of that unique field (not key synthesis) |
| `wisp_ax_find_named` | `{name}` one of Fixture Button / Fixture Field / Fixture Marker | `ax-fixture-search:<name>` | One bounded tree search; never press or type |

Unknown titles, names, `(0,0)` deltas, extra keys and non-printable text fail closed before a native prompt.

`dx` / `dy` are strings matching `^-?(0|[1-9][0-9]?)$`, integers in `[-64,64]`, not both `0`. `text` is length 1–80 with no control, bidi or NUL characters.

## TCC

Computer control uses macOS Accessibility. Grant it in System Settings → Privacy & Security → Accessibility. Wisp will not act without both TCC and Allow Once. Turning Accessibility on is not a standing tool grant. Settings → Permissions includes a user-initiated Open Accessibility Settings control; that control may prompt TCC. Launch, initialize, tool describe and tool execute do not prompt TCC and do not start background Accessibility observers. If the process is not trusted, native performs zero Accessibility element calls and completes `untrusted`. Linux has no TCC.

## Native channel

The engine child has no AppKit and no Accessibility APIs. After `consume()`, tools notify `wisp.ax.requested`. Native handles `ax-request`, re-validates the granted destination and fixture identity, then completes `wisp/ax.complete`. Lost acknowledgement is not retried. Deny, Cancel, Escape/close, timeout, stale generation and missing grant never notify native.

The demonstration target is the titled fixture window, not the mascot and not Settings. It exposes Fixture Button, Fixture Field, Fixture Marker, and a click canary `Fixture Count: N`. The mascot stays non-key/non-main; idle transparent regions still click through.

Linux checks use a recording driver and never call Accessibility APIs or spawn helpers.

## Boundaries

Slice 09 URL/file/time stay Direct (`wisp-safe-action`) and keep their own `wisp.open.requested` channel. Stock `tool-bash`, `tool-fs` and `tool-web` stay disabled. Visual click remains slice 16. Windows UI Automation remains slice 17. Other applications, Spotlight, menu bar, Dock, drag, scroll and resize beyond the ±64 nudge are later remainder, not this demonstration.

Outcomes use existing voice and Wisp surfaces; there is no chat composer. Slice 07 is not assumed working.
