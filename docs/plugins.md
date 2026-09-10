# Compatible plugin management

Wisp Settings → Plugins manages a **closed, Wisp-authored catalog**. It does not query a marketplace, `dsh plugin`, pnpm, npm or git registry. The only installable plugin in this slice is the locally authored demonstration `wisp-compatible-plugin`.

## What is supported

- **Demonstration plugin** (`wisp-compatible-plugin`): optional. Default is **not installed**. Install confirmation states that the plugin can register tools and that Wisp will still ask before each action. Cancel performs no overlay change. Apply persists a versioned snapshot under application-support `plugins/` and restarts the hidden engine with a composed `--patch` overlay. The overlay inserts the covered product file `compatible-plugin.ts` using JSON data (user strings never form YAML). Configure writes only a bounded nonsecret `note` (`^[A-Za-z0-9_-]{1,40}$` or empty). Remove unmounts the insert on the next Apply/restart.
- **Status** is one of: not installed, saved, applying, active, incompatible, unavailable. Native status follows the last saved snapshot plus the initialize inventory (`wisp.inventory.plugins`: id, revision, contributed tools, nonsecret config digest).
- **Failed start** leaves the engine unavailable and **keeps** the saved snapshot. Wisp does not keep the old process or auto-revert.
- **Permissions:** installation is not Allow Once. The demonstration tool `wisp_compatible_check` still uses native Allow Once / Deny / Cancel. A saved key, spoken yes, or Install confirmation is not a grant.

## What stays unavailable

The catalog lists, and cannot enable: registry/marketplace installs; arbitrary third-party folders; stock executable-tool enablers (`tool-bash`, `tool-fs`, `tool-web`, skill/sub-agent rows, HMR, telemetry, …); MCP/Connection plugins (plugin-delivered Connections remain unavailable; use Settings → Connections); skills (slice 12); web/chat UI plugins; plugin-supplied model or provider replacements. Models remains the sole owner of reasoning keys.

The 06 developer fixture `wisp-local-permission-plugin` / `wisp_plugin_check` remains `--developer` / `WISP_PERMISSION_FIXTURES` only. It is visible as not a user plugin and is not the Plugins install target.

Cordis is not an OS sandbox. Compatibility is decided by a static classifier on plugin id, covered product path, inject list and overlay operations **before** executable load. Unknown `apply()` is never trial-run.

## Overlay seam

SDK `patchReload: startup` and the disabled `hmr` row are respected: there is no live `loader.create` mount on a stdio session. Identity, selected home, durable memory and the Models route survive plugin Apply because Apply reuses the existing stop/restart generation path.

## Linux vs Mac

Linux-supplemental JS tests cover schema, classifier, overlay composition, inventory honesty and admission wiring. Isolated product-adapter initialize tests require a prepared pin runtime (`desktop/tests/plugin-overlay-runtime.mjs`). Native Swift `PluginStore` / `PluginsView` / NativeChecks are **uncompiled/unverified on Linux**. macOS Settings pointer/keyboard, live Ollama 0/0/0/1 and restart persistence are verification-backlog items.

No Harness web UI, prompt composer, `dsh` CLI, reserved DeepSeek call, model download or key inspection is part of this surface.
