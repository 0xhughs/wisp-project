# Slice 06 — permission evidence

Builder candidate proof. Independent review042 rejected the prior candidate for three P2 issues; see `06-repair-043.md` for repair comparison and current proof. Prior040/041 observations below are retained as history and do not imply approval. Host: macOS 26.5.2 (25F84), Mac16,11, Apple M4 Pro, 24 GiB unified memory. Local inference: existing Ollama `qwen3:8b` through loopback `/v1`; no hardware performance recommendation is inferred. Harness reference and installed runtime retain pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`. No slice 06 cloud call or real-key access occurred; immutable slice 05 cloud evidence is not new-adapter evidence.

External artifact roots below are relative to the workspace: `A = work/wisp-06/06-build-040`, `B = work/wisp-06/06-resume-041`. Sanitized machine results are copied into `06-sanitized-results.json`; private native/runtime event records remain external. The accepted spike and slice archives are byte-identical to baseline 06.

| Criterion | Evidence and result | Limits |
| --- | --- | --- |
| 1 Native scoped decisions | A/gui01/run-1788981155360: actual native keyboard Deny → direct0, Allow Once → plugin1, Escape → direct0, window close → plugin0. Trusted source/destination/record details and Cancel initial focus observed. B/gui01: actual queue selection chooses second/plugin, allows only its call/digest, denies direct; two requests stay distinct. | Native outcomes are checked with isolated ledgers; no real account action. Final status repair verification recorded below. |
| 2 Mandatory gate | A/policy-tests.log:34 actual pinned registry/approval tests; allow-first hostile listener, registration replacement while pending/after guard, foreign/missing/duplicate/changed call facts, destination change, replay, child/nested/unknown route, overflow and grant cancellation. B/queue02: real registry two pending bodies withheld, reverse decisions, replay rejected, exact plugin effect1 and two persisted audit pairs. | Test agents in the fast registry suite are identity carriers; live parent/child/native tests supply actual agent evidence. |
| 3 Cancellation/lifecycle | B/lifecycle01: actual bridge+registry cancel, EOF, SIGTERM, malformed decision and stale generation each start2pending and end0effects with clean process release. A/policy-tests.log distinguishes cancellation pending, allowed-but-unused0 and after-effect1. Native model Apply while queue pending cancels both, emits completed2allowed0 and attaches a fresh generation. | Cancellation does not claim rollback. Invalid/stale bridge input makes the product unavailable. |
| 4 Actual route coverage | A/live01 direct-deny0, A/live02 plugin-allow1; B/live-direct-allow1 and B/live-plugin-deny0. Real Ollama calls through product bridge/actual registry; every completed scenario complied on attempt1. A/child01 + child03 prove actual spawn/fork `never`, parent effect1/child0 and correlated lineage/asked/rejected; child04/05 prove parent cancellation, child aborted0 and clean disposal. | Native Escape/direct and close/plugin provide actual model cancellation. No child approval forwarding or general delegation tool is enabled. |
| 5 Credentials/admission | A/credential01: generated sentinel-only loopback wire auth and model/caps, missing reference without ambient fallback, clean process release, no artifact sentinel. A/bridge-security01: hostile provider echo/duplicate bootstrap/missing cloud key produces fixed safe product output. Permissions has no key editor or broad grant; normal inventory is empty. | Raw private SDK failure frames can contain provider echo; product sanitization is a separate passed assertion. No real cloud key or service tested in 06. |
| 6 Regressions | B/build04.log successful native build; B/native01.log full native state/home/memory/models/credential/frame suite; B/js-tests.log29 passed; B/spike-client.log accepted client regression. Native body/menu/model/recall/draft observations are recorded below. | SDK deprecation warnings concern isolated legacy Keychain test APIs, not failed assertions. |

## Native queue and status repair

Coordinator `/root` alone performed GUI input after the user resumed; Builder made no CUA calls or computer sessions. B/gui01/run-1788983131501 used build03 native4535, bridge4536 and engine4543. With both pending, both ledgers were empty. Request2 displayed plugin destination and `queuesecond`; keyboard Allow Once executed only `queue-1`, digest `1b5299…1998`; direct Request1 was denied, completed2/allowed1/modelCalls0. The subsequent native Apply while two requests were pending produced no additional record, cancelled both and replaced bridge/engine with4700/4705.

The first queue revealed that the remaining request displayed the previous request's Allowed status. Build04 corrects this: status is derived from the selected pending request (waiting or sending); a closed outcome displays only without a pending selection. The new native assertion checks both sending isolation and remaining-request isolation. The red compile result and green assertions are B/native-red.log and B/native01.log. This finding occurred during Builder verification and is not a reviewer rejection.

## Failures retained honestly

A/child02 used an incorrect fork oracle counting inherited parent seed events; child03 corrects it using first live sequence and proves actual fork rejection. A/queue01 lacked the required upstream tool-result surface operation and failed; corrected queue02 completed both actual registry requests. B/queue01 initially treated flat persisted events as nested wrappers and expected a wrong allowed outcome name; B/queue02 uses actual durable `approval/asked` / `approval/decided` records and `allowed-once`. These are fixture/oracle failures, not successful tests or model noncompliance retries. Every actual local model noncompliance cap remains two attempts per scenario; no noncompliance retry was used. The pinned scheduler prepares actual model approvals serially, so simultaneous native queue proof uses the explicit deterministic actual-registry fixture with modelCalls0.

## Route and command map

The exact inventory, admission and future obligations are in `docs/permissions.md`. Direct and one locally authored loader plugin are developer fixtures only. MCP, skill discovery/invocation, external children, nested/PTC and stock executable tools are disabled. Actual spawn/fork developer proof retains upstream never; source maps do not stand in for future live route approval.

Commands run from workspace root include:

```
node --test outputs/wisp-project/desktop/tests/*.test.mjs
node --test outputs/wisp-project/spike/tests/client.test.mjs
outputs/wisp-project/desktop/scripts/test-native.sh <B/native01>
outputs/wisp-project/desktop/scripts/build-macos.sh --scratch <B/build04>
node outputs/wisp-project/desktop/tests/permissions-queue.mjs --scratch <B/queue02> --runtime-root <work/wisp-01/builder-01>
node outputs/wisp-project/desktop/tests/permissions-lifecycle.mjs --scratch <B/lifecycle01> --runtime-root <work/wisp-01/builder-01>
node outputs/wisp-project/desktop/tests/permissions-live.mjs --scratch <fresh> --runtime-root <runtime> --case direct-allow
node outputs/wisp-project/desktop/tests/permissions-live.mjs --scratch <fresh> --runtime-root <runtime> --case plugin-deny
```

A/policy-tests.log records direct installed Vitest invocation using the external prepared upstream and copied `wisp-product/tests/permissions/vitest.config.ts`; pin/tracked-source and overlay integrity are enforced before product launch. `permissions-native.mjs` owns process logging/cleanup but never supplies GUI actions. User-facing surfaces remain Wisp settings, permission details and body; no composer/transcript/Harness UI was introduced.

## Coordinator body and pending-Quit regression

B/gui01/run-1788983131501 and external `work/loop-state/06-resume-041-root-ui.md` record one GUI controller. A verified owned ClickTarget underneath Wisp received a global transparent-gap click (count1), scrolling changed0→240, opaque dragging moved Wisp from Quartz500/880 to600/880, and the fixed `wisp-test` entry was observed in the owned target. The target then stopped. A corner click dismissed a target popup and is not claimed as click-through proof. Unsolicited text observed before operator typing is excluded from the test evidence.

A third native queue remained pending when actual Command-Q quit Wisp. It completed2/allowed0, native exit0 and bridge exit0; runner cleanup true, no forced stop, two generations. Native4535, original bridge4536/engine4543, replacement4700/4705 and ClickTarget4951 were absent afterward. Across all three queues, only the first intentionally allowed plugin record exists. No CUA selection was performed after Quit. These are Builder-phase coordinator observations, not independent approval.

## Final build04 native proof and memory continuity

B/gui01/run-1788983459335 used verified native5035 and the corrected build04. Allowing direct Request1 left plugin Request2 visibly Waiting for your decision; denying that plugin left exactly one allowed direct effect. This verifies the status fix on actual native input in addition to the state assertions.

Native Memory saved a generated verification phrase, then held an unrelated unsaved draft while Models Save and Apply restarted the engine. Reopening Memory preserved that draft; Cancel restored the saved phrase. Companion/home/controller remained the same, and the attached saved memory revision became `5103d2074559263fe92c3eafe038371dc2cd517a08b8c9705456f730a3dbcc4a`. Actual Models Test Connection completed a nonempty local qwen3:8b response (turn1/effects0). Fixed recall completed turn2 and matched the saved generated phrase (effects0); private events supplied the text oracle. Settings close/reopen reused native window12090. After a user-changed UI notice, the coordinator refreshed live accessibility state before actual Command-Q. Exit0/cleanuptrue/noForcedStop, two generations.

The coordinator then fully restarted the same build04 with the same isolated home, B/gui01/run-1788983664762, native5166/bridge5168/engine5174. A new native controller retained the same companion `1efb210b-f8f1-436d-a3cb-e0f05eb4c2d8` and saved revision. Actual local recall again matched the saved phrase on turn1/effects0. Command-Q produced exit0/cleanuptrue/noForcedStop, one generation. All owned apps and bridge/engine processes were stopped. No cloud call, real-key access or additional computer controller was used.

Required Builder proof is complete for this candidate. Independent implementation review remains mandatory; these coordinator input observations do not grant approval. Future route and release gates remain as documented.
