# Slice 11 — Connections and custom MCP (implementation evidence)

Builder candidate proof for dispatch **11-build-076**. This is not independent review, not slice 11 acceptance, and not a 07/08/09/10 Shipped claim. Native Swift is **uncompiled/unverified on this Linux host**.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215`, porcelain clean. No DeepSeek call, model download, key inspection, merge, publish or spend.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

Result: **130/130 pass**, identity self-test ok. Contract identity remained `744e61e833cbf3dddbd9ee44ae04de77f6620255f9429fb7f653bb64ce3736f6`. Tests include snapshot schema/unknown-version/oversize/invalid note/serverName; enable/disable overlay composition; no YAML interpolation of user strings; overlay contains no sentinels; 10 classifier still rejects `mcp-connection-plugin` and `@` marketplace specs; permission-protocol accept/reject for `mcp__wispdemo__record` / `wisp-mcp` without breaking existing fixture/09 pairs; withhold/deny/cancel/allow-once **0/0/0/1** on a real local stdio fixture (`tools/call` count and ledger); deny/cancel never increment RPC; extra unadmitted MCP tool fails seal; `tools/change` after seal yields zero further RPC; stock ids remain in `DISABLED_STOCK_IDS`; overlay still disables `tool-bash`/`tool-fs`/`tool-web`; MCP inventory/ack events cannot enter TTS.

`desktop/tests/connection-overlay-runtime.mjs` is landed for isolated initialize/seal/registry 0/0/0/1 against a prepared pin runtime. This host has no prepared `.wisp-spike.json` runtime. **Test 2 gap class: missing-external-resource.**

## Native (uncompiled here)

Sources: `ConnectionStore.swift`, `ConnectionCredentials.swift`, `ConnectionsView.swift`, Settings/CompanionController/PermissionState/PermissionWindow/ManagementState wiring, `ConnectionStoreTests` in NativeChecks. `desktop/scripts/test-native.sh` lists `ConnectionStore.swift` and `ConnectionCredentials.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

## Inventory / overlay facts (static)

- Default snapshot `enabled: false`; default composed overlay omits `wisp-mcp-connection`.
- Enable emits one JSON-data insert of covered `mcp-connection.ts` with Wisp-fixed `transport: 'stdio'`, `failOnStartupError: true`, `reconnect.enabled: false`. Command/args are bound in-process (`process.execPath` + covered `mcp-demo-fixture.mjs`); they are not overlay YAML fields.
- `prepare-product.mjs` `productFiles` includes `mcp-connection.ts`, `mcp-demo-fixture.mjs`, `mcp-wrap.mjs`, `connection-config.mjs`, `connection-secrets.mjs`, `mcp-verification.ts`.
- Admission source `wisp-mcp` wraps `execute` on the **same** registered ToolDefinition object. `inventoryValid` requires `ctx.tools.get(name) === admitted.tool`. 09 tools remain Direct. 10 `mcp-connection-plugin` stays unavailable.
- `consume()` runs immediately before the actual MCP `tools/call` of raw name `record`.

## 07 / 10 retest obligations (not claimed here)

11 edits CompanionController Apply/lifecycle (`stopReasoning` / `startAttachment`, `--connection-file`), permission-protocol/PermissionState allowlists, overlay composer (`classifyInsert` / `composeOverlay`), and `wisp.inventory` connections. Record:

1. **07 retest:** shortcut/Wake, no auto-listen after Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend DeepSeek 0/1.
2. **10 overlay/inventory retest:** default composition still omits the demonstration plugin unless enabled; no MCP public names when the connection is disabled; hostile extra tools still fail initialize; Plugins catalog still cannot enable `mcp-connection-plugin`.

Do not treat 07, 08, 09 or 10 Done when as satisfied.

## Suggested verification backlog (not claimed here)

1. Declared-Mac Settings → Connections: catalog labels, Enable confirm vs cancel (cancel: zero overlay/RPC), Advanced Wisp-fixed values not user-overridable, Apply, Remove, restart persistence, unsupported rows not enableable.
2. Permissions lists MCP Ask-each-time only after mount. Spoken or developer-prompted `mcp__wispdemo__record` → native details show public name, operation, ledger destination (no secret) → Deny/Cancel zero `tools/call` → Allow Once one RPC and one ledger line.
3. NativeChecks compile including connection store and isolated-test-keychain CRUD. Never the login keychain.
4. Live local Ollama MCP 0/0/0/1 when a model is present. Then 07 shortcut/mic/TTS retest and 10 overlay/inventory retest.
5. Isolated pin-runtime `connection-overlay-runtime.mjs` when a prepared `.wisp-spike.json` exists.

No secrets or raw engine stderr are in this file.
