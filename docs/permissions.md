# Permissions

Wisp asks for each supported tool action. The native request identifies the actual operation, source, destination and complete nonsecret inputs. Allow Once permits only that invocation; Deny prevents it; Cancel Request stops the owned request and associated work. Escape or closing the window cancels the owned operation and its queued requests with one cancellation batch. Repeated close gestures cannot send duplicate decisions. The initial focus is Cancel Request. Tab traverses request selection, scrollable details and the three decisions. Switching requests changes both the details and their waiting/sending status.

Settings → Permissions shows admission status. Models alone owns reasoning keys. A configured key, installed plugin, skill instruction, selected model or parent approval gives no action permission. There is no Allow Always. Useful actions in this slice are the three Wisp-owned tools `wisp_open_url`, `wisp_open_file`, and `wisp_tell_time` (source `wisp-safe-action`). Settings → Permissions lists them as Ask-each-time. Development verification tools remain harmless ledger appends and are absent in normal mode.

## Enforcement boundary

The product overlay in `desktop/engine` uses the full pinned Harness SDK/base composition at `d347e703908d0406b7a7ef80e3a0e594d86b2215`. It supplies Wisp extension methods for approval decisions and cancellation; these are not stock SDK methods. Normal launch no longer uses the accepted spike adapter. The immutable spike remains a regression reference.

A closed adapter table binds each admitted registered tool object and revision to its trusted source, exact argument schema, canonical descriptor, destination and effect contract. The actual current agent, open turn, tool call and cancellation signal determine ownership. Approval uses the actual upstream asked/decided audit and a mandatory registry guard; a preceding allow-returning listener cannot bypass it. A grant is consumed once immediately before the bounded effect. Unknown registrations, changed arguments or destination, registry replacement, replay, timeout, stale generation and missing facts fail closed. Native queues admit at most eight pending requests; scope exceeding field/frame limits is unavailable rather than silently truncated. The decision deadline is 120 seconds.

Cancellation and teardown revoke pending/unused grants before disposing agents and persistence. Accepted effects are not rolled back or retried after lost acknowledgement. Bridge EOF/failure, app Quit and model/home replacement terminate the owned generation. Failure to establish process release leaves Wisp unavailable. Categorical closed outcomes are drained before operation completion and teardown. Bridge results carry an operation type, unique ID and generation; only the matching actual connection-test response can mark Models verified. A permission fixture or late completion after failure cannot do so.

## Route admission

| Route | Slice 06 status | Required before future admission |
| --- | --- | --- |
| Direct | Three Wisp-owned tools `wisp_open_url`, `wisp_open_file`, `wisp_tell_time` (source `wisp-safe-action`) plus the developer-only registry fixture. Ask-each-time; Allow Once / Deny / Cancel only | Stock shell/fs/web stay disabled. Accessibility (15), visual click (16) and Windows (17) remain unavailable |
| Local Cordis plugin | One Wisp-authored demonstration (`wisp-compatible-plugin` / `wisp_compatible_check`) can be mounted from Settings → Plugins via overlay insert + restart. Installation is not Allow Once. The 06 developer fixture remains `--developer` only | Classifier + admission adapter; unknown/third-party/skill plugins stay unavailable (12). Plugin-delivered MCP stays unavailable; use Settings → Connections |
| MCP | Demonstration stdio Connection (`wisp-demo-connection`) can mount one tool `mcp__wispdemo__record` (source `wisp-mcp`, raw name `record`). Ask-each-time when mounted; otherwise MCP is unavailable. Connection save is not a grant. Extra advertised tools fail initialize. Resources/prompts stay unsupported | Named SaaS connectors, remote HTTP, `npx`/user-chosen executables and plugin-delivered MCP remain unavailable |
| Skills | Invocation/discovery disabled | Real registry load/invoke and subsequent gated actions in 12 |
| In-process spawn/fork | Developer fixture proves both actual child policies and cancellation | General delegation disabled; consequential child asks retain upstream `never`; no parent grant transfer |
| External children | Disabled | Process-boundary ownership, credentials, approvals and cancellation proof |
| Nested/PTC, stock shell/filesystem/web/jobs/workflows/goals | Disabled | Actual dispatch lineage and guarded effect proof before availability |

Cordis is not an OS sandbox. Arbitrary executable plugins can run code outside tool bodies, so installation cannot itself establish safety. Slice 10 admits only the covered demonstration path after static classification; Install confirmation is not a grant. A future credential-bearing action requires opaque references, explicit endpoint binding and safe complete rendering; secret-bearing argument strings are not an admitted shortcut.

## Development proof

From the workspace root, run `node outputs/wisp-project/desktop/tests/permissions-queue.mjs --scratch <fresh-external-path> --runtime-root <prepared-runtime>` for actual registry queue/effect/audit/replay assertions without inference. `permissions-lifecycle.mjs` uses the same arguments for pending cancellation, EOF, signal, invalid frame and stale-generation cleanup. Compile `PermissionCloseProbe.swift` with the current native `PermissionState.swift` outside the checkout and pass `--native-close-probe <binary>` to also exercise the native cancellation seam against the real bridge through two successive queues. `permissions-live.mjs` additionally accepts `--case direct-allow` (or direct/plugin deny/cancel/allow) and uses actual local Ollama. Every model noncompliance run must be preserved, with at most two attempts per scenario.

`permissions-native.mjs` accepts an exact built executable and isolated scratch/runtime, launches only one owned native app, and exposes fixed developer commands; an operator supplies native input. It does not drive the desktop. Use one computer controller for all GUI work. Cloud calls and real-key discovery are forbidden for slice 06; generated sentinel loopback tests validate transport separately. See `evidence/06-permissions.md` for proof and limitations.
