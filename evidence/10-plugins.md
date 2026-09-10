# Slice 10 — compatible plugin management (implementation evidence)

Builder candidate proof for dispatch **10-build-064**. This is not independent review, not slice 10 acceptance, and not a 07 Shipped claim. Native Swift is **uncompiled/unverified on this Linux host**.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215`, porcelain clean. No DeepSeek call, model download, key inspection, merge, publish or spend.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

Result: **49/49 pass**, identity self-test ok. Contract identity remained `7f1000a6a82ea105753ba332957e871dd1b8a10e8ebcce7e9321404cd8ad1636`. Tests include schema/unknown-version/oversize/invalid note, enable/disable overlay composition, incompatible refusal before `apply()`, no YAML interpolation, developer-fixture orthogonality, inventory honesty (enablement does not admit tools), native-store revision accepted on compose, and the closed `wisp_compatible_check` / `wisp-compatible-plugin` permission-protocol pair.

`desktop/tests/plugin-overlay-runtime.mjs` is landed for isolated initialize/seal/registry 0/0/0/1 against a prepared pin runtime. This host has no prepared `.wisp-spike.json` runtime (pnpm 10.33.3 vs required 11.7.0 for `spike/prepare.mjs`). **Test 2 gap class: missing-external-resource.**

## Native (uncompiled here)

Sources: `PluginStore.swift`, `PluginsView.swift`, Settings/CompanionController/PermissionState wiring, `PluginStoreTests` in NativeChecks. `desktop/scripts/test-native.sh` lists `PluginStore.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

## Inventory / overlay facts (static)

- Default snapshot `enabled: false`; default composed overlay omits `wisp-compatible-plugin`.
- Enable emits one JSON-data insert of covered `compatible-plugin.ts` with validated `config.note`.
- `prepare-product.mjs` `productFiles` includes `compatible-plugin.ts` and `compatible-verification.ts`.
- Admission source `wisp-compatible-plugin` is added only when that plugin’s `apply()` runs. 06 fixture overlay is unchanged when the demonstration is disabled.

## Suggested verification backlog (not claimed here)

1. Declared-Mac Settings → Plugins: catalog labels, Install confirm vs cancel, Configure note, Apply, Remove, restart persistence, unsupported rows not enableable.
2. Live local Ollama demonstration-tool 0/0/0/1 and post-remove absence; 06 `wisp_plugin_check` still 0/0/0/1 in developer mode.
3. NativeChecks compile including plugin store assertions.
4. Shared Apply/restart: 10 edits `CompanionController` stop/attach — re-run 07 Apply/Quit/continuity items and 06 pending-approval Apply. Do not treat 07 as accepted.
5. Slice 11: plugin-delivered Connections remain unavailable.

No secrets or raw engine stderr are in this file.
