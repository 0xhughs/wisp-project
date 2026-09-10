# Safe computer actions

Wisp can open one http(s) URL, open one viewable local file, and tell the local time. These are the same companion’s tools, not a second agent. Each call uses the accepted 06 native gate: Allow Once, Deny, or Cancel Request. There is no Allow Always. A spoken or typed yes, a saved key, a plugin install or a memory instruction is not a grant.

## Tools

| Tool | Arguments | After Allow Once |
| --- | --- | --- |
| `wisp_open_url` | `{url}` | Native default-handler open of that exact http or https URL |
| `wisp_open_file` | `{path}` (absolute POSIX path) | Native default-handler open of that exact viewable file |
| `wisp_tell_time` | `{}` | One read of this device’s local clock |

Source id is `wisp-safe-action`. Developer fixtures and the mount-gated demonstration plugin stay on their existing routes.

## URL

Only `http:` and `https:` after WHATWG parse. `file:`, `javascript:`, `data:`, `about:`, `blob:`, `vbscript:`, helper schemes, userinfo, empty host, control characters and oversize destinations are refused before a prompt. Wisp does not fetch the page and does not enable stock `tool-web` / `web-fetch-http`. HTML files are opened with `wisp_open_file`, not as `javascript:` or `file:` URLs.

## File

Viewing only. The path must be absolute. The leaf is opened with `O_NOFOLLOW` and must be a regular file. Canonical `realpath` must not fall under the closed privileged prefix set (`/etc`, `/private/etc`, `/System`, `/usr`, `/bin`, `/sbin`, `/var`, `/private/var`, `/dev`, `/proc`, `/root`, `/boot`, `/sys`, `/Library`, and any path containing `/Library/Keychains`). Allowed suffixes: `.txt`, `.md`, `.markdown`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.csv`, `.json`, `.html`, `.htm`, `.rtf`. Executable bits, `#!` shebang, `.app` bundles and script/package suffixes are denied. Native re-checks viewer-eligibility immediately before open (TOCTOU), not only path-string equality.

## Time

Wisp reads the process-local clock once after Allow Once. Tests inject that clock. Native calendar APIs may format the gated reading; they are not a second unsigned clock path. No NTP, no timezone override argument, no opener.

## Native opener

The engine child has no AppKit. After consume, URL and file tools notify `wisp.open.requested` and wait for `wisp/open.complete`. Native re-validates, then calls `NSWorkspace.shared.open` once (default handler, no application identifier, no extra argv). Linux checks use a recording opener and must never spawn `xdg-open`. Lost acknowledgement is not retried.

Stock `tool-bash`, `tool-fs`, `tool-web` and shell wrappers stay disabled. Outcomes use existing voice and Wisp surfaces; there is no chat composer. Slice 07 is not assumed working.
