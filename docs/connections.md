# Connections and custom MCP

Wisp Settings → Connections manages a **closed, Wisp-authored catalog**. It does not query GitHub, Google Drive, Notion, Calendar, Slack or any marketplace. The only installable Connection in this slice is the locally authored stdio demonstration `wisp-demo-connection`.

## What is supported

- **Demonstration Connection** (`wisp-demo-connection`): optional. Default is **not installed**. Enable confirmation states that the connection can register one MCP tool and that Wisp will still ask before each action. Connection save is not Allow Once. Cancel performs no overlay change. Apply persists a versioned snapshot under application-support `connections/` and restarts the hidden engine with a composed `--patch` overlay. The overlay inserts the covered product adapter `mcp-connection.ts` using JSON data (user strings never form YAML). Configure writes a bounded `serverName` (`^[A-Za-z0-9_-]{1,32}$`, default `wispdemo`), optional nonsecret `note` (`^[A-Za-z0-9_-]{1,40}$` or empty), and an optional opaque credential id. Remove unmounts the insert on the next Apply/restart.
- **Advanced custom MCP** is the same compatible class, not a second ecosystem. Accepted pin field names are visible. Wisp-fixed and not user-overridable: `transport: 'stdio'`, `command`/`args`/`cwd` bound to the engine Node plus the covered fixture (no `npx`, no user-chosen executable), `failOnStartupError: true`, `reconnect.enabled: false`. Command and arguments are resolved in-process in the adapter; they are not written into overlay YAML.
- **Status** is one of: not installed, saved, applying, active, incompatible, unavailable. Native status follows the last saved snapshot plus the initialize inventory (`wisp.inventory.connections`: id, serverName, public tool names, transport `stdio`, nonsecret config digest).
- **Failed start** leaves the engine unavailable and **keeps** the saved snapshot. Wisp does not keep the old process or auto-revert.
- **Permissions:** the demonstration tool public name is `mcp__wispdemo__record` (identity `(wispdemo, record)`). Source id is `wisp-mcp`. Native confirmation shows the public name, operation `append-test-record`, and the launch-owned ledger destination. Controls remain Allow Once, Deny, and Cancel Request. A spoken or typed yes, saved key, connection save, plugin install, or memory instruction is not a grant. `consume()` runs on the admitted object immediately before the actual MCP `tools/call` of raw name `record`.

## What stays unavailable

The catalog lists, and cannot enable: GitHub, Google Drive, Notion, Calendar, Slack; remote or non-loopback HTTP MCP; `npx`/npm/git MCP servers; MCP resources and prompts; plugin-delivered MCP. Settings → Plugins still cannot enable `mcp-connection-plugin`. Stock `tool-bash` / `tool-fs` / `tool-web` stay disabled. Slice 09 URL/file/time tools remain Direct (`wisp-safe-action`), not MCP.

Credentials for optional connection secrets use macOS Keychain (service `com.wisp.connection.<companion-uuid>`) or an isolated 0600 Linux test store. Opaque ids appear in the snapshot. Secret values never appear in `memory.json`, Diagnostics, overlay YAML, argv, or plugin notes. Ambient pin scrubbing is not a substitute for that isolation.

## Overlay seam

SDK `patchReload: startup` and the disabled `hmr` row are respected. Product reconnect stays disabled; remount uses Connections Apply / process replacement, matching Plugins. Identity, selected home, durable memory, Models route and the plugin snapshot survive Connections Apply. Enabling a connection does not write `memory.json`. Extra unadmitted MCP tools fail initialize. After `seal()`, list-change invalidates unused grants and further `tools/call` stays zero.

## Linux vs Mac

Linux-supplemental JS tests cover schema, classifier, overlay composition, same-object wrap, permission-protocol, real local stdio 0/0/0/1, extra-tool seal failure, tools/change invalidation and secret isolation. Isolated product-adapter initialize tests require a prepared pin runtime (`desktop/tests/connection-overlay-runtime.mjs`). Native Swift `ConnectionStore` / `ConnectionsView` / `ConnectionCredentials` / NativeChecks are **uncompiled/unverified on Linux**. macOS Settings pointer/keyboard, Keychain CRUD against the login keychain, live Ollama 0/0/0/1 and 07 shortcut/mic/TTS retest are verification-backlog items.

No Harness web UI, prompt composer, `dsh` CLI, reserved DeepSeek call, model download or key inspection is part of this surface.
