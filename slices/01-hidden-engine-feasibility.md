# BUILD — active contract

Slice: 01 Hidden engine feasibility proof
Archive: slices/01-hidden-engine-feasibility.md


## Goal

Prove that the pinned DeepSeek Harness serves one harmless live reasoning turn and scoped harmless approval effects through a Wisp-owned stdio boundary, with no Harness UI. Build a disposable TypeScript/Node SDK extension and technical client over the full SDK/base composition. Preserve Harness services; restrict the spike's executable tools and unsolicited inputs. Source investigation alone and mocked reasoning do not satisfy completion.

## Done when

1. Record upstream URL/pin, pristine verification, MIT and third-party distribution findings, actual Node/pnpm versions, and reproducible setup/launch commands. Use Node matching `^22.19.0 || >=24.0.0`, pnpm `11.7.0`, Git >=2.26. Retain upstream lockfile and source identity. Distribution conclusions distinguish spike use from packaging readiness.
2. The owned client launches the pinned SDK/base runtime with the Wisp overlay, initializes an authorized live model route, sends one harmless request in one fresh session, observes the correlated completed turn and nonempty final text, and shuts down cleanly. It never launches or serves the Harness web/chat UI. Exactly one outstanding prompt per process is allowed; fresh process/home/session per test case. Buffered events handle notifications arriving before RPC replies. A queue receipt or an idle event alone is not success.
3. `docs/engine-capabilities.md` covers models/providers, plugins, MCP, skills, tools, sessions, storage, credentials, approvals and sub-agents. Each row identifies pinned source/API, proposed Wisp integration, permission/UI implications, actual evidence and verified/conditional/unavailable status. Only directly exercised behavior is verified; disabled capability routes are conditional or unavailable with reasons, not claimed verified by inheritance.
4. Real Harness tool dispatch and ApprovalService reach the owned answerer before the harmless test effect. Client-visible descriptor exactly matches immutable tool execution identity/arguments. Withhold, deny and cancel cause zero effect records. Allow yields exactly one record matching the displayed descriptor. Wrong-session, wrong-digest, missing/expired/replayed decisions cannot grant effects. A new or materially different action requires a fresh request. The spike does not claim global delegated-route enforcement; slice 06 remains responsible for that integration.
5. `docs/engine-boundary.md` specifies lifecycle, reasoning, session/events, approvals and errors separately from future speech/body clients. It identifies the future single Wisp identity and user-chosen state attachment without implementing memory, voice or UI. Document stdin/stdout pipe ownership, no listener endpoint, process lifecycle and all failure deadlines below.
6. Reproducible tests produce sanitized evidence for live completion and approval cases, configuration/startup failure, cancellation, EOF/SIGTERM/protocol shutdown and no orphan process. Audit durable turn and approval pairs after successful root disposal. No secrets enter tracked files or proof. Missing live resource, unsupported model/tool protocol, unresolvable adapter loading, or an unclosed lifecycle acceptance failure blocks acceptance; do not replace these with mocks or mark the milestone complete.

## Out
- Production mascot, tray/menu-bar or Settings UI; speech capture/playback; product local-model onboarding/download flows; durable product memory; real computer control; remote access; Windows delivery; full skin catalog. Exception: user authorization on 2026-09-07 permits external local runtime and test-model provisioning for slice 01; this does not implement slice 08 or authorize distribution.
- Reimplementing the complete Harness capability system, substituting another runtime or exposing the Harness UI to bypass a gap.
- Claiming all upstream integrations compatible or the full product ready from this spike.


## Constraints

### Files owned by Wisp (all covered by snapshot identity)

- `spike/engine/wisp-sdk.ts`: named Cordis plugin exports, one transport/server lifecycle, method validation, request ownership, completion state, actual agent cancellation.
- `spike/engine/approval-bridge.ts`: immutable pending-call records, scoped approval answerer, nonce/digest/one-shot decisions and signal cleanup.
- `spike/engine/test-effect.ts`: exactly one `wisp_test_effect` tool; schema allows a short case label and fixed operation `append-test-record`. It can write only the process-configured test ledger; arguments cannot choose a path or shell command.
- `spike/profile/wisp.patch.yml`: Wisp persona and explicit SDK/base overrides.
- `spike/profile/live-route.example.json`: credential-free schema/example for user-supplied endpoint/model metadata, with placeholders clearly invalid until supplied.
- `spike/client.mjs`: Node standard-library child-process/JSON-RPC client, event buffer, test scenario runner and sanitized proof projection.
- `spike/prepare.mjs`: verify prerequisites/pin, create isolated clone, install/build, copy covered adapter/test files, generate runtime paths/profile settings and print exact executable argv without secrets.
- `spike/run.mjs`: controlled environment/paths, live-resource validation, dump-config/unit/live/lifecycle command entrypoints; no implicit resource provisioning.
- `spike/cleanup.mjs`: stop owned process group and delete only a validated run-root marked by this spike.
- `spike/tests/approval.spec.ts`: actual Harness tool/approval service fixtures, no fake approval grant implementation; identity/replay/race tests.
- `spike/tests/client.test.mjs`: meaningful protocol-buffer/correlation/failure tests using fabricated frames clearly labeled transport tests.
- `spike/tests/vitest.config.ts`: include only Wisp tests, resolve through pinned upstream TypeScript source aliases in isolated copy.
- `docs/engine-boundary.md`, `docs/engine-capabilities.md`, `evidence/01-engine-feasibility.md` and `evidence/01-sanitized-results.json`: reviewable deliverables and sanitized assertions/source pin/versions. No raw trajectories, credentials or install output in covered evidence.

### SDK adapter wiring

Retain the `sdk` profile's `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-sdk-app` bundle composition. Disable the stock `sdk-jsonrpc-server` row, insert `wisp-sdk` with an absolute path to the isolated copy of `spike/engine/wisp-sdk.ts`, and inject `sdkAppStartup`, `loader`, `agents`, `tools`, `approval`. Keep the SDK startup provider for EOF handling. Named exports (no default) preserve loader metadata.

`wisp-sdk.ts` owns the only `JsonRpcLineTransport(process.stdin, process.stdout)` and constructs exported `HarnessSdkJsonRpcServer(ctx, transport, {maxTokensAsSuccess:false})`. It delegates validated `initialize`, `session/prompt`, `shutdown` to that server, preserving initialization's `await ctx.get('loader')?.await()` readiness barrier. The wrapper rejects reinitialization, unexpected session IDs and concurrent prompts. It tracks only sessions it accepted; cancellation cannot target any unrelated agent. The stock server's session/status notifications remain the authoritative engine events. Wisp adds only:

- request `wisp/approval.decide`: `{requestId, sessionId, callId, actionDigest, decision:'allow-once'|'deny'}`. Return accepted only when it matches the active pending record; stale/unknown/mismatched/duplicate requests are errors. No wildcard, duration grant or policy switch.
- request `wisp/session.cancel`: `{sessionId}`. For the currently owned active session call `ctx.agents.get(brandedSessionId).cancel({kind:'user'})`; acknowledge cancellation requested, never claim turn completion from this ack. Resolve all matching pending approvals cancelled immediately and observe real request signals/turn convergence. An idle/unknown session cannot arm a future cancel or permission.
- notifications `wisp.approval.requested` and `wisp.approval.closed`, carrying the immutable descriptor and bridge outcome. The bridge-generated random request ID is distinct from ApprovalService's audit ID (which is not supplied in `approval/request`); document both namespaces and correlate the audit pair through the actual tool call/session, never invent access to the private audit ID.

Access boundary is inherited anonymous stdio pipes between the client and its child, not TCP/Unix listeners. No reusable service is exposed, no auth token is printed, and no Web server plugin is composed. Losing the client or a malformed decision cannot produce an approval.

### Actual action correlation and enforcement

Install a `tools/pre-execute` listener before initialization is allowed. For any tool other than `wisp_test_effect`, return deny. For the test tool, validate the fresh owned agent/session and active turn, snapshot the registry's parsed `exec.arguments`, `exec.callId`, `exec.name`, `exec.agent.session.id` and the open turn number. Compare with the session's prior `tool/call` fact after parsing its raw arguments; unknown/missing/mismatched facts fail closed. Derive the displayed descriptor from this validated immutable snapshot, including fixed effect destination role (disposable test ledger), operation and case label. Compute SHA-256 of a specified stable canonical JSON encoding. Return `{kind:'ask', reason:'Append one harmless test record to this isolated run ledger'}`.

This invokes the real registry `serviceAsk()` → `ApprovalService.request()` → `approval/request` waterfall. The answerer claims only the exact owned call, uses the captured descriptor instead of model-provided prose, creates a cryptographically random request nonce and returns a pending promise. Requests lacking the matching captured call fail `unavailable`. Attach the request `signal` before notifying; check already-aborted state both before and after listener registration. Never serialize AbortSignal or Agent objects. No other answerer is composed in the spike.

The Wisp reply handler validates strict allowed fields/enums and all identity fields, then atomically removes/settles the pending entry before resolving its promise. A valid allow makes a one-use grant keyed by session+turn+callId+digest; the harmless body synchronously consumes it, checks the original execution signal and exact descriptor, and synchronously appends exactly one JSON record using the configured ledger path. There is no async gap between this final check/consume and the harmless effect. A monotonic `tools.guard()` additionally denies every non-test call. No reply can change tool arguments. No generic `allowed-once` cache exists. Cancellation processed before grant consumption wins; cancellation after a completed synchronous effect does not undo it and is reported honestly. Tests must cover both orderings.

Pending decision deadline: 30 seconds, yielding `unavailable` with zero effects. Client disconnection/shutdown and request-signal abort resolve pending entries `cancelled`, purge unconsumed grants and remove listeners/timers. Unknown replies remain errors after purge. A second invocation with the same label must still create a new nonce; approval for the first cannot approve it. These are spike safety/test bounds, not product performance promises.

### Profile changes and isolation

`wisp.patch.yml` changes `system-prompt.persona` to a short Wisp identity that describes this technical spike and requests only the allowed tool. Keep `session-title-llm` disabled; set max-token success false explicitly. Disable `session-telemetry-otel` by row and pass `DSH_TELEMETRY_DISABLED=1`; source says even feedback-only sharing can export raw session records, so defaults are insufficient. Disable `hmr` and initialize generated profile manifest with `patchReload:'startup'`.

Explicitly disable these base row IDs: `tool-bash`, `tool-pwsh`, `tool-jobs`, `tool-fs`, `tool-fs-search`, `tool-skill`, `tool-subagent-control`, `tool-subagent-list-agents`, `tool-subagent`, `tool-subagent-fork`, `tool-workflow`, `tool-todo`, `tool-goal`, `tool-ralph`, `tool-str-replace-editor`, `tool-web`. Disable `agent-instructions`, `skill-filesystem`, `command-feedback`, `goal-round-driver`, `command-goal`, `plan-mode` and `command-compact` to prevent ambient instructions, skill discovery or unsolicited extra turns. Leave underlying capability services such as settings, credentials, sessions, storage, subagent and skill registries present for inspection, not execution claims. Disable unused `llm-deepseek`, `web-search-deepseek` and `web-fetch-http` for the chosen custom pi-ai route. Set `tools` native presentation. Before accepting initialize, assert sorted `ctx.tools.schemas().map(schema=>schema.name)` equals only `wisp_test_effect`; unexpected capabilities fail startup. This uses inspection plus a gate, not trust in a persona prompt.

All runtime/dependency/generated state is outside the candidate under `../../work/wisp-01/<run-id>/`:

- `upstream/`: independent local clone at the pin, never a Git worktree or symlink into pristine reference. Install/build mutations and Git hooks remain in this clone.
- `upstream/wisp-spike/`: copied candidate adapter/profile/tests and generated tsconfig; compare source-copy hashes to candidate before/after tests.
- `workspace/`: empty engine cwd; no user project files, `.env`, AGENTS or skills.
- `dsh-home/`: mode 0700; isolated settings, `.credentials.yaml` if needed, sessions/storages/attachments and generated `profiles/sdk`.
- `tmp/`, `cache/`, `proof/`: isolated temporary files, dependency store, raw local diagnostics and effect ledgers. Raw evidence stays private; only allowlisted projections are copied to tracked evidence.

Build and engine are spawned with a constructed minimal environment, not inherited `process.env`: known tool `PATH`, temporary/cache variables and explicit `DSH_HOME`; strip provider keys, proxy settings, NODE_OPTIONS and ambient configuration. Do not repurpose shell `$HOME`/`$CODEX_HOME`; use absolute paths and documented `DSH_HOME`. Source credential fallback reads only invocation cwd/.env and DSH_HOME/.env, both inside this empty run. The custom noncatalog pi-ai route must name explicit `apiKeyEnv`, preventing provider-native ambient discovery. No runtime read of personal credential stores is needed. Absolute node/pnpm paths are resolved at setup and recorded. Failed prerequisites are reported, not silently installed globally.

### Live provider input: authorized local test resource

On 2026-09-07 the user answered “you are authorized” to the explicit request for local runtime/model provisioning. The coordinator records this authority and provisioning observations in `../../work/loop-state/provisioning.json`. This permits the external Ollama test resource and its local model download; application implementation still requires independent APPROVE_PLAN.

Selected route: Harness `llm-pi-ai`, custom provider `wisp-spike`, protocol `openai-completions`, exact model `qwen3:8b`, base URL `http://127.0.0.1:11434/v1`. No cloud account or production credential is needed. Generate this isolated `dsh-home/settings.yaml`:

```yaml
llm-pi-ai:
  providers:
    wisp-spike:
      api: openai-completions
      baseURL: http://127.0.0.1:11434/v1
      apiKeyEnv: WISP_SPIKE_MODEL_KEY
      reasoning: off
      compat:
        maxTokensField: max_tokens
        supportsStore: false
        supportsDeveloperRole: false
        supportsStrictMode: false
        supportsReasoningEffort: true
        supportsUsageInStreaming: true
        thinkingFormat: openai
      models:
        - id: qwen3:8b
          contextWindow: 8192
          maxTokens: 1024
          input: [text]
          reasoningEfforts:
            off: none
            high: high
```

The client initializes with `{cwd:<isolated-workspace>,provider:'wisp-spike',model:'qwen3:8b'}`. The constructed child environment includes `WISP_SPIKE_MODEL_KEY=ollama`, a public placeholder scoped to this exact loopback route. This is not a secret and must never be forwarded to an arbitrary remote endpoint. Keep explicit `apiKeyEnv`, stripped ambient credentials, isolated homes and existing output sanitization. The credential-free external route metadata file records the endpoint, model, settings above, placeholder credential kind, authorization reference, runtime/model observations and source references. It contains no real credential.

`contextWindow:8192` describes the coordinator-configured service allocation, not the model's maximum capability; `maxTokens:1024` is an explicit conservative spike request cap, not a manufacturer maximum. Source `config.ts` and `adapter.ts` distinguish explicit model caps from catalog/fallback sizes. `reasoning:off` is the test default: the model still performs live inference. The `off:none` map deliberately sends the documented wire value; a high level is declared because Harness rejects an off-only reasoning map. High-mode performance is not claimed or part of this proof. The disabled compatibility fields conservatively omit optional store/developer-role/strict-tool extensions; they are not findings that Ollama universally lacks those features. Tool support is a resource capability verified by preflight and live cases, not an invented `supportsTools` settings key.

Coordinator reports Ollama 0.33.3 installed with Homebrew and started explicitly at `127.0.0.1:11434`, with `OLLAMA_NO_CLOUD=1`, `OLLAMA_MODELS=<workspace>/work/ollama-models`, `OLLAMA_CONTEXT_LENGTH=8192`, `OLLAMA_NUM_PARALLEL=1`. Host observations are Apple M4 Pro, 24 GiB unified memory and approximately 240 GiB free disk. Model pull completed and coordinator preflight passed streamed text, native tool call and tool-result follow-up on 2026-09-08; actual service context 8192 and model digest 500a1f067a9f782620b40bee6f7b0c89e17ae61f686b92c24933e4ca4b2b8b41. Evidence: ../../work/loop-state/local-model-probe.json. Route metadata ../../work/wisp-01-authorized-route.json SHA-256 5afb9e4971433c059e1ec76ea772da8527981ad9ccdcccf951dc2543a1571f5d. Recheck that exact nonsecret metadata before consuming plan approval; runtime rechecks do not substitute for Harness proof. These observations select a bounded test resource; they do not prove memory headroom with speech, latency, compatibility, or readiness. The runtime and weights remain external to candidate coverage and per-case cleanup; do not remove or terminate the coordinator-owned server through `spike/cleanup.mjs`. `run` does not implicitly install, pull or start it.

Resource preflight must require this metadata, inspect the exact local runtime version/model inventory and model digest/capabilities, and establish that the configured service context matches 8192. Record sanitized findings after download completes. Probe actual streamed `/v1/chat/completions` with the same model, `reasoning_effort:'none'`, `max_tokens:1024`, text input, native function-tool schema and tool-result follow-up. Require nonempty final text and correctly parsed tool calls, including terminal stream behavior. This resource-level probe is readiness evidence only: it does not satisfy the later live Harness turn or ApprovalService acceptance tests. Preserve all existing live completion/approval/lifecycle oracles and deadlines.

Missing endpoint/model/metadata, incomplete pull, mismatched configuration or unavailable resource fails preflight with `LIVE_RESOURCE_UNAVAILABLE`; unsupported wire behavior fails with an explicit compatibility error. No skipped live success, mocks, silent model/protocol substitution or indefinite retry. A necessary substantive route/configuration change returns through contract review. Source-backed configuration and authorization alone cannot mark live completion passed.

Sources: [Harness pi-ai README](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/llm/llm-pi-ai/README.md), [configuration](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/llm/llm-pi-ai/src/config.ts), [catalog resolution](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/llm/llm-pi-ai/src/catalog.ts), [provider construction](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/llm/llm-pi-ai/src/provider.ts), and [adapter](https://github.com/deepseek-ai/deepseek-harness/blob/d347e703908d0406b7a7ef80e3a0e594d86b2215/packages/llm/llm-pi-ai/src/adapter.ts). The pristine lockfile resolves `@earendil-works/pi-ai` to 0.84.2. Inspection of its integrity-matching [published package](https://registry.npmjs.org/@earendil-works/pi-ai/-/pi-ai-0.84.2.tgz), `dist/api/openai-completions.js`, confirms max-token field selection, optional-field omission and off-level wire mapping. [Ollama compatibility documentation](https://docs.ollama.com/api/openai-compatibility) documents the local v1 endpoint, ignored placeholder key, streaming tools, usage, `max_tokens` and reasoning effort `none`. [Official selected model](https://ollama.com/library/qwen3:8b) lists tools/thinking, 8.19B parameters, Q4_K_M and 5.2 GB. These are documentation claims pending local verification.


## Data / state impact

Create only disposable isolated engine state during implementation. Settings/credentials services remain Harness-owned inside this test home; no personal data is migrated. JSONL sessions are internal test evidence, not product conversation history. Future durable Wisp identity/user-selected home is an attachment point described in the boundary document. Cleanup after evidence projection and process exit removes only the marked run root with validated canonical path under `work/wisp-01`; reject root, ancestor paths and symlink escapes.

## Tests

These commands are proposed implementation entrypoints, not files or results that already exist. From the candidate root:

```sh
python3 ../../work/loop-state/identity.py .
git -C ../../work/deepseek-harness rev-parse HEAD
git -C ../../work/deepseek-harness status --porcelain --untracked-files=all
node spike/prepare.mjs --run-id builder-01 --source ../../work/deepseek-harness --root ../../work/wisp-01/builder-01
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case dump-config
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case unit
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case lifecycle
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case live --route-file ../../work/wisp-01-authorized-route.json
node spike/cleanup.mjs --root ../../work/wisp-01/builder-01
python3 ../../work/loop-state/identity.py .
```

The route file is a user-authorized external input containing metadata and a source reference, never a credential value. Absence is a blocking exit, not a skipped success. `prepare` must expose each underlying command/result and execute sequentially in its independent clone:

```sh
git clone --no-hardlinks --no-checkout <absolute-pristine-source> <run-root>/upstream
git -C <run-root>/upstream checkout --detach d347e703908d0406b7a7ef80e3a0e594d86b2215
pnpm --version
pnpm install --frozen-lockfile --store-dir <run-root>/cache/pnpm-store
pnpm run build
```

Use actual resolved pnpm binary and assert version 11.7.0 before install; the last two commands have cwd `<run-root>/upstream`. Upstream docs require a build before source-checkout profile demos; full build is chosen here to avoid assuming an unverified partial closure. It builds artifacts but never opens a Web UI. No global Corepack mutation, package install or dependency download occurs in this proposal phase.

`prepare` copies the covered spike source into the clone. `run` creates fresh per-case home/workspace/ledger and starts an absolute Node command, cwd the empty case workspace:

```text
<node> --import <resolved-absolute-tsx/esm-entry> <run-root>/upstream/apps/cli/src/bin.ts --profile sdk --patch <run-root>/upstream/wisp-spike/profile/wisp.patch.yml
```

Resolve `tsx/esm` with `createRequire(<upstream>/package.json).resolve('tsx/esm')`, set `TSX_TSCONFIG_PATH=<upstream>/tsconfig.json` for source aliases; patch generation inserts absolute copied adapter path. The dump uses this same argv plus `--dump-config` in a separate process. Run tests using `<upstream>/node_modules/.bin/vitest run --config <upstream>/wisp-spike/tests/vitest.config.ts` and `<node> --test <upstream>/wisp-spike/tests/client.test.mjs`. New TypeScript config extends the upstream base, checks Wisp host files with noEmit and is checked by the upstream TypeScript executable; no host/client aggregates are mixed. Verify configuration composition and runtime tool inventory independently; `--dump-config` does not evaluate `!!js` and is insufficient alone.

### Completion/lifecycle oracles

- Start receiving stdout immediately and require every nonempty output line to be a valid protocol frame; reject accidental logging. Buffer events by session ID and sequence regardless of request-response ordering.
- Startup/initialize deadline 30 seconds. Successful initialize must follow loader settlement and resource route validation. Check no HTTP listener or browser process is launched via child process and socket observations (`ps`, `lsof` limited to owned PID/group); this supplements disabled plugin inspection.
- One fresh unique session; reject a second outstanding prompt with a Wisp busy error before reaching upstream. After prompt returns `{messageId}`, find that exact `user/message.data.id` in buffered events inside a preceding `turn/start`. Track its turn number and require ordered session seqs, at least one non-interrupted `assistant/message` with nonempty text for that turn, `turn/end.data.reason.kind === 'completed'` for that turn, and subsequent/observed quiescent `session.status` idle. Ignore other sessions; error if another user message, tool outside test scenario or unsolicited turn appears. Do not infer completion from prompt ack, token deltas, assistant text alone, or any idle transition before this turn. `max-tokens`, `blocked`, `aborted`, `error`, malformed/gapped correlation, EOF and crash are failures, never text success.
- Live turn deadline 120 seconds (test bound). On timeout first cancel through the added method, then allow 10 seconds for idle/quiescence, then shutdown. Do not retry indefinitely or switch model. Record timeout as failure even if text was received.
- Success shutdown requires a flushed matching shutdown RPC response, root disposal and exit 0 within 10 seconds. Preserve server shutdown-before-transport-close; abort pending approvals first, await server/root disposal and transport flush, and report disposal errors nonzero rather than copying upstream's ignore-all-teardown-errors success behavior. Competing shutdown calls share one exit task. If graceful close fails, SIGTERM the owned process group, after 5 seconds SIGKILL as bounded cleanup; forced termination fails clean-shutdown acceptance. Verify `kill(pid,0)` fails ESRCH and no owned group descendants remain.
- Independently test stdin EOF and SIGTERM, including an approval pending, require bounded child exit, no effect and no orphan. After graceful shutdown parse isolated session JSONL and confirm completed turn and paired approval/asked + approval/decided facts survive, not just in-memory notifications.
- Configuration failure cases: invalid overlay import/path must fail before readiness and terminate nonzero; unknown provider/model initialize returns structured error without success or a prompt; malformed inputs/concurrent prompt rejected. The client emits sanitized Wisp error category, kills/joins as necessary and leaves no orphan.

### Approval test oracles

Use actual live model requests for normal and deny/cancel/allow smoke cases, each in a fresh process/session and with exactly `wisp_test_effect` available. Prompt the model to call the tool once with that case's known label; absent tool call, repeated undesired calls, incompatible tool protocol or timeout is failed live evidence, not permission to inject a fake success. Source-grounded deterministic tests of real Harness service/registry dispatch cover the hard-to-force identity/race matrix separately.

At `wisp.approval.requested`, parse descriptor and assert matching session/turn/callId/arguments/digest with recorded tool/call. Read the private ledger: count 0. Withhold decision for an explicit 250ms observation checkpoint, assert still 0 (supplemented by structural no-effect-before-grant checks, not a timing-only security claim). Deny: send deny, await closed rejected and settled tool/turn, count 0. Cancel: send `wisp/session.cancel`, await cancelled audit outcome and aborted turn/idle, count 0; late allow fails and remains 0. Allow: send exact reply, await completed turn, ledger exactly one expected record, replay fails and ledger remains one. Missing answerer and expiration are deterministic fail-closed cases. Wrong nonce/session/callId/digest and changed arguments cannot settle allow; cancel remaining pending work and assert zero. Deterministic race tests exercise cancel-before-consume and effect-before-cancel, with the latter honestly retaining the already completed single effect.

### Capability-map inspection and evidence

For each required category, inspect the pinned base row and referenced package README/public source; record the actual `rg`/read paths used in the evidence, API names and source line references. Start from `packages/bundle/base/cordis.patch.yml`, SDK server, `llm/llm-pi-ai`, `boot/app-boot` profile/plugin functions, MCP packages discovered with `rg --files packages | rg '/mcp'`, skill packages, core tools/session/agent, session persistence/storage, credentials-local, user-approval and subagent packages. Record profile dump plus runtime inventory, live outcomes and exclusions. A claim of conditional compatibility includes the concrete necessary adapter/management seam, not an unqualified checkbox.

Independent Reviewer repeats from an exact candidate copy under `work/wisp-01-review/<dispatch>/candidate`, while dependencies/runtime remain in a separate marked run root. Compute identities before/after on the actual candidate and test copy; isolate mutating build/tests; verify copied adapter hashes and external source pin. Do not let generated evidence mutate the reviewed candidate: Reviewer output stays outside it and compares to Builder's sanitized evidence. No application/UI or next-slice work begins in this proposal phase.

### Source evidence supporting the revision

All paths below are in the pristine pinned upstream; no network claims or installed runtime results are inferred.

- `package.json`: exact Node engine/pnpm pin, source CLI command, full build command. `docs/development.md` setup tutorial and profile runs: pnpm install and build before source-checkout demos; install hook writes are why clone isolation is required.
- `packages/bundle/sdk-app/cordis.patch.yml`: SDK server row, persona, startup provider, max-token override and disabled title generator. `README.md`: protocol-only stdout, EOF disposal and profile restart constraints.
- `packages/sdk/server/src/index.ts`: named plugin exports, single transport, readiness loader await, root disposal/flush/exit wiring; `src/server.ts`: exported server, initialize, queue receipt, session/status events, registry ownership and shutdown. Stock dispatch has no approval reply or cancel method.
- `packages/sdk/protocol/src/transport.ts`: JsonRpcLineTransport, asynchronous RPC handlers, notification/flush/close behavior. Source ignores malformed input lines; Wisp client adds stricter output validation without asserting upstream changes.
- `packages/core/session/src/types.ts:178–210,257–334`: cancel reasons, completed/aborted/error outcomes, turn/start/end, user/message, assistant/message and tool/call fields. `packages/core/agent/src/runtime-types.ts:114–137`: Agent.cancel and whenIdle are actual in-engine methods; `packages/core/agent/src/index.ts:578`: registry get accepts session ID.
- `packages/core/tools/src/index.ts:134–160,577–584,1062–1108,1225,1680–1725`: pre-execute ask, guards, schemas and exact ApprovalService routing with callId/signal; restriction is agent-scoped, so this proposal does not invent a global restrict API.
- `packages/interaction/user-approval/src/index.ts` and `types.ts`: open-turn audit precondition, unique audit IDs, answerer event lacks audit ID, signal cancellation, unavailable fail-closed, allowed-once mapping. `packages/todo/tool-todo/src/index.ts`: source example of named plugin exports and defineTool registration.
- `packages/bundle/base/cordis.patch.yml`: full service/tool rows, credentials fallback, settings namespace, state roots, feedback-gated raw telemetry, tool-web and subagent defaults.
- `packages/llm/llm-pi-ai/README.md:35–78,109–113,218` and `src/config.ts`: custom route schema, explicit credential reference, required custom API/baseURL/model catalog, local placeholder constraint and ambient-discovery warning.
- `packages/credentials/credentials-local/src/index.ts:1–10,63–91,568–623`, `packages/boot/app-boot/src/index.ts:198–221`: exact environment/home/project fallback. `packages/boot/app-boot/src/profile.ts`: profiles under DSH_HOME and installation/profile module anchors. `apps/cli/src/profile-boot.ts:62–120`: home patch, explicit telemetry disable and profile file writes; `apps/cli/src/dump-config.ts`: source-layer dump without expression evaluation.

## Proof
Repair Builder01-repair-010 returned full proposed proof at ../../work/loop-state/01-repair-010-result.md. Both rejected failure classes reproduced RED, then13 Vitest+7 Node/typecheck,7 lifecycle and4 live cases pass. Pending EOF/SIGTERM now reportedly durable cancelled pair+aborted turn+post-turn idle,0effects/exit0/no orphan. Material repair claims pending independent review. Prior proof/results retained.

## Review
Prior HUMAN_REQUIRED by /root/reviewer_01_plan003, dispatch 01-plan-003, resource now resolved; superseded at the plan gate by APPROVE_PLAN01-plan-005. Verbatim result: ../../work/loop-state/01-plan-003-review.md. Prior REJECT_PLAN retained in review history.
Plan approval: APPROVE_PLAN / /root/reviewer_plan005 / 01-plan-005 / contract 092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587 / baseline b15f42ccc15c202d2abeea545d907aa77ab76f3788bcaa7d03a54c471006c45a / ../../work/loop-state/01-plan-005-review.md
Implementation approval: APPROVE_IMPLEMENTATION / /root/reviewer_repair011 / 01-review-011 / contract 092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587 / candidate 5861282eef9a864d0bb9a3723bf6f4497c843759ecd468813cb3c63d9c008ce6 / ../../work/loop-state/01-review-011.md
Each result records dispatch ID, reviewer identity, verdict, contract identity, snapshot identity, evidence and criterion-specific blockers.

## Loop state
Execution mode / tool adapter: collaboration.spawn_agent; send_message/followup_task; list_agents/wait_agent; interrupt_agent. One active worker per checkout; independent fresh Reviewer contexts.
Coordinator: /root in task 01a07388-ab31-7da0-a45c-57928e06779e
Worker / role / phase: none; /root/reviewer_repair011 completed / Reviewer / accepted repair
Dispatch ID / launch state / input identity: 01-review-011 / completed and consumed / contract 092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587; candidate 5861282eef9a864d0bb9a3723bf6f4497c843759ecd468813cb3c63d9c008ce6
Pending result / last consumed dispatch: none / 01-review-011
Snapshot capture and recheck commands / coverage / exclusions: Run `python3 ../../work/loop-state/identity.py .` from repository root. SHA-256 sorted relative file manifest includes untracked files, bytes, types, modes, symlink targets; excludes only .git and mutable BUILD/SLICES bookkeeping. Contract canonicalizes BUILD through Tests and SLICES excluding Run status/Release evidence/placement headings, plus full AGENTS/LOOP/BUILDER/REVIEWER and identity.py bytes. Manifest JSON stored outside coverage at ../../work/loop-state/. No dependency or generated paths currently excluded: place dependencies/test outputs outside checkout. Pinned upstream source is an external reference at ../../work/deepseek-harness; verify `git -C ../../work/deepseek-harness rev-parse HEAD` and `git -C ../../work/deepseek-harness status --porcelain --untracked-files=all`; only pristine pin d347e703908d0406b7a7ef80e3a0e594d86b2215 may support source claims. Any adapter edits must live in covered project files. Snapshot rules are bound via this exact identity.py algorithm; changing rules requires plan re-review. Baseline copy: ../../work/loop-state/baseline-01-r3/. Original initial baseline and identity-v1.py retained for review history.
Baseline snapshot: b15f42ccc15c202d2abeea545d907aa77ab76f3788bcaa7d03a54c471006c45a
Contract identity: 092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587
Candidate snapshot: 5861282eef9a864d0bb9a3723bf6f4497c843759ecd468813cb3c63d9c008ce6
Rejection count: 2
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: none; both01-review-009 blockers materially resolved by fresh independent reproduction, lifecycle disk audit and completion negative.
Repair awaiting review: false
Control event: 01-proposal-002 completed; proposal persisted; inputs matched original contract/snapshot; 4-gap repair comparison in ../../work/loop-state/01-proposal-002.md. Counters retained.
Review events: 01-plan-001 / plan / REJECT_PLAN / contract 35afcd9883411ef51d1e182e574e7d680644077717b8d74cf43b4db4a7c20f0e / snapshot 9de26e900cf6b2134ad442d4c63f32402337cc17896227f398f8e5c8e190cc39 / gaps: executable setup, approval transport, completion oracles, deliverable/isolation paths / initial rejection; no repair comparison applicable / rejections=1, no-progress=0. Verbatim result: ../../work/loop-state/01-plan-001-review.md
Review event: 01-plan-003 / plan repair / HUMAN_REQUIRED / contract be597af3abbd71181355447cbaa8aab38e52ed5a9e8a4a55d0445814305a96d7 / snapshot e8fc2f0e69f3d1a708600912c654f50ebbdd64cb231724c887144f47878a7aa7 / material improvement on all four design gaps; external live-resource gap remains / rejections=1, no-progress=0; no approval. Verbatim: ../../work/loop-state/01-plan-003-review.md.
Budget limit / consumed / measurement: Not configured; no budget supplied
Blocker / resume status / resume action / recheck condition / deadline: none. LIVE_RESOURCE_UNAVAILABLE resolved by explicit provisioning authorization and successful local preflight. Earliest unmet gate is implementation proof and independent implementation review.
Control event: third consecutive goal-turn resource audit confirmed LIVE_RESOURCE_UNAVAILABLE; no new authorization or live endpoint. All workers terminal. Goal blocked; exact resource resolution and plan-review resume action unchanged.
Control event: 2026-09-07 user supplied local runtime/model provisioning authorization; previous authority blocker resolved. Resource provisioning in progress; actual availability still to verify. Homebrew install handle 20106. No review counters reset.
Control event: 01-resource-004 proposal completed with matching input identities; resource contract applied under explicit user authorization; fresh plan review required. Prior counters retained.
Review event: 01-plan-005 / APPROVE_PLAN / identities matched and route hash rechecked; previous resource gap materially resolved; rejection count1 and no-progress0 retained. Verbatim ../../work/loop-state/01-plan-005-review.md.
Control event: Builder reported macOS tsx IPC socket sun_path overflow in long canonical run-root/tmp. Coordinator authorized routine unique /tmp symlink alias into that same canonical directory for child TMPDIR; physical state remains in approved run root. Verify owned target; unlink alias only; retain all canonical cleanup checks. No criterion change or counter change. Builder continues.
Control event: 01-build-006 worker errored at usage limit; runtime inventory now confirms absent/terminal, no Harness test process remains. Account usage now available. Partial candidate captured in ../../work/loop-state/01-build-006-interrupted.json. Last live3 test failed ENAMETOOLONG while following dependency symlink cycle in audit walker; preserve tests/build and resume remaining work. No review rejection or counter reset.
Control event: recovery found 01-build-007 absent from runtime inventory and no live Harness test process. Saved live-final and lifecycle logs report passing cases; no final Builder result received. Resume documentation, cleanup proof and final handback, retaining existing evidence.
Review event: 01-review-009 / REJECT_IMPLEMENTATION / /root/reviewer_impl009 / contract 092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587 / candidate c70741cf07583987020db2dab369ed87a56ed26232674bb54eb388d5db812b44 / two gaps above; matching pre/post; rejections2 no-progress0. Verbatim ../../work/loop-state/01-review-009.md consumed once.
Review event: 01-review-011 / APPROVE_IMPLEMENTATION / contract 092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587 / candidate 5861282eef9a864d0bb9a3723bf6f4497c843759ecd468813cb3c63d9c008ce6 / material improvement: both previous blockers resolved; independent13 service/barrier+7 client/type,7 lifecycle+4 live and disk audit pass. Rejections2/no-progress0. Verbatim ../../work/loop-state/01-review-011.md.
Advance phase: archive pending
Next slice ID / draft: none

## Status
Shipped

## Next
Archive accepted01 receipt and select02 under LOOP. No code writes during advance.
