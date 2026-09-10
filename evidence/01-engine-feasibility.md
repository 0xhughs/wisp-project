# Slice 01 — proposed implementation proof

Builder repair dispatch `01-repair-010`; implementation awaits independent review. Contract `092e1334bb94560d9119b34983a639752cc7f9e8d6809a165cda24bb1a6d5587`. No Shipped/approval claim is made by this document.

The pinned SDK/base engine completed a live reasoning turn through Wisp-owned anonymous stdio without a Harness UI. Actual Harness dispatch reached the Wisp approval answerer before the fixed harmless effect. The normal/deny/cancel/allow cases recorded respectively **0 / 0 / 0 / 1 effects**; each had one owned process, no observed TCP listener/browser, exit 0 and no orphan. Normal, deny and allow had correlated completed turns and nonempty final text. Cancel had the expected correlated aborted turn. Durable turn records and exact asked/decided approval audit pairs survived root disposal. See `01-sanitized-results.json` for allowlisted results and source hashes.

## Provenance and setup

Upstream: `https://github.com/deepseek-ai/deepseek-harness.git`, pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`. The pristine external clone's HEAD, empty Git status and unchanged lockfile against the prepared clone were rechecked during finalization. Actual tools: Node **v24.12.0**, pnpm **11.7.0**, Git **2.50.1 (Apple Git-155)**. These satisfy upstream Node `^22.19.0 || >=24.0.0`, pnpm 11.7.0 and Git >=2.26. Setup used a detached independent no-hardlinks clone, frozen lockfile install and complete upstream build. Dependencies and generated artifacts are outside candidate coverage.

From the candidate root, the reproducible entrypoints are:

```sh
python3 ../../work/loop-state/identity.py .
git -C ../../work/deepseek-harness rev-parse HEAD
git -C ../../work/deepseek-harness status --porcelain --untracked-files=all
node spike/prepare.mjs --run-id builder-01 --source ../../work/deepseek-harness --root ../../work/wisp-01/builder-01
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case dump-config
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case unit
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case live --route-file ../../work/wisp-01-authorized-route.json
node spike/run.mjs --root ../../work/wisp-01/builder-01 --case lifecycle --route-file ../../work/wisp-01-authorized-route.json
node --test spike/tests/cleanup.test.mjs
python3 ../../work/loop-state/identity.py .
```

`prepare` requires a fresh root; reuse the existing prepared root by skipping prepare. For a new isolated run use a fresh run-id/root pair. The local tooling pnpm executable is `../../work/tooling/node_modules/pnpm/bin/pnpm.mjs`; prepare resolves it and asserts its version. The underlying sequential setup is:

```text
git clone --no-hardlinks --no-checkout <absolute-pristine-source> <run-root>/upstream
git -C <run-root>/upstream checkout --detach d347e703908d0406b7a7ef80e3a0e594d86b2215
<resolved-pnpm> --version
<resolved-pnpm> install --frozen-lockfile --store-dir <run-root>/cache/pnpm-store
<resolved-pnpm> run build
```

Install/build cwd is the independent upstream clone and environment is constructed by `environment()` in `prepare.mjs`. Actual Node is `/usr/local/bin/node`. The launch argv (all path placeholders expand from the recorded `.wisp-spike.json`) is:

```text
/usr/local/bin/node --import <upstream>/node_modules/.pnpm/tsx@4.22.4/node_modules/tsx/dist/esm/index.mjs <upstream>/apps/cli/src/bin.ts --profile sdk --patch <upstream>/wisp-spike/profile/wisp.patch.yml
```

The working directory is a fresh empty per-case workspace, with explicit case DSH_HOME and TSX_TSCONFIG_PATH=`<upstream>/tsconfig.json`. No personal environment is inherited. `--dump-config` is appended for the profile inspection case; it is not runtime/tool-inventory proof. Vitest resolves upstream TypeScript source aliases through the covered config, Node runs the fabricated-frame tests, and upstream TypeScript checks only engine host files. Full upstream build generated Web artifacts but did not serve them.

## Authorized live resource

The external approved metadata file is `../../work/wisp-01-authorized-route.json`, SHA-256 `5afb9e4971433c059e1ec76ea772da8527981ad9ccdcccf951dc2543a1571f5d`. The runner requires that exact digest; the tracked example is intentionally invalid and contains no usable secret. Local endpoint `http://127.0.0.1:11434/v1`, Ollama 0.33.3, `qwen3:8b`, model digest `500a1f067a9f782620b40bee6f7b0c89e17ae61f686b92c24933e4ca4b2b8b41`, configured context 8192, max_tokens 1024, reasoning off mapped to wire `none`. The public placeholder `ollama` is scoped to this exact loopback route.

Preflight independently passed streamed nonempty text, one native function call and nonempty tool-result follow-up, all with terminal streams, and checked actual runtime/model/context observations. This supports readiness only; the subsequent Harness cases provide the engine proof. The coordinator's original resource record is `../../work/loop-state/local-model-probe.json`. Provisioned runtime/model and coordinator-owned Ollama PID 58180 are external to per-case cleanup. The runner does not download/start/install them.

## Checks and artifacts

All paths below are relative to the candidate root. The repair evidence directory is `../../work/wisp-01-repair/01-repair-010/`. Independent review `01-review-009` rejected two gaps: pending EOF/SIGTERM lost durable closure, and the client accepted stale idle. Earlier lifecycle runner passes did not audit those durable cases and are superseded by the strengthened checks below; they are retained as history, not sufficient acceptance proof.

| Check | Result | Local artifact |
| --- | --- | --- |
| Frozen install / full upstream build | Earlier successful unchanged dependencies reused; no redundant rebuild | `../../work/loop-state/01-build-006-prepare.log`, `01-build-006-build2.log` |
| Stale-idle regression before repair | Expected failure: complete events plus old idle incorrectly returned success | `client-red.log` in repair directory |
| Pending EOF durable regression before repair | Expected failure after exit0/zero effects: asked1, decided0; raw record has no turn/end | `lifecycle-red.log`, `red-proof/eof-pending-durable-raw.json` |
| Real registry / ApprovalService and lifecycle barrier | 13 passed: original11 approval cases plus coalesced ordered root cleanup and rejected/timed-out quiescence | `unit-final.log` |
| Fabricated protocol / durable reader / resource | 7 passed, including pre-turn and pre-end idle rejection, wrong-session idle rejection, and buffered post-end idle success | `unit-final.log` |
| Host TypeScript | Passed in the same unit entrypoint | `unit-final.log` |
| Profile dump / cleanup | Prior unchanged overlay and cleanup checks retained; three cleanup cases include a real detached child | `../../work/loop-state/01-build-006-dump.log`, `01-build-008-cleanup.log` |
| Live normal / deny / cancel / allow | Fresh repaired adapter/client: four passed, effects0/0/0/1, exact durable turn/approval pairs, clean RPC shutdown | `live-green.log` |
| Lifecycle/config | Seven passed; both pending EOF/SIGTERM now require durable cancelled pair, aborted turn/end, subsequent idle, effects0, exit0/no orphan | `lifecycle-green.log` |
| Source-copy integrity | All13 match before the repair live run and after all checks; only overlay absolute path expansion differs | `source-copy-before-live.json`, `source-copy-after.json` |

Both rejected failure classes were reproduced before implementation. The independent review's separate SIGTERM failure remains at `../../work/wisp-01-review/01-review-009/audit-independent.json`; the repair's failing runner stops at EOF, so it does not claim a second before-fix SIGTERM run. After the fix the strengthened runner executes and audits both signals. The lifecycle barrier uses the pinned root own-function seam described in `../docs/engine-boundary.md`; concurrent callers share one task, quiescence failure exits nonzero before upstream's timeout, and no upstream source was modified. Other revisions are conditional.

Previous Builder proof is preserved in `prior-builder-proof/`; failing current proof in `red-proof/`; final current raw evidence is retained under the runtime's `proof/` and copied to repair `final-proof/`. Only allowlisted results appear in tracked JSON. The source-copy capture was after unit and after lifecycle started, before live; it is not represented as a pre-lifecycle capture. Final candidate identity is in `../../work/loop-state/01-repair-010-final.json`, outside its own coverage. Detailed ownership handback and before/after comparison are in `../../work/loop-state/01-repair-010-result.md`.

## Cleanup, retention and limits

The coordinator authorized retaining `../../work/wisp-01/builder-01` so Reviewer can reuse its expensive dependencies and private proof. No active Harness case process remains. Cleanup acceptance was exercised on a separately marked disposable fixture with a real child; final removal of the retained root, after review/evidence preservation, is:

```sh
node spike/cleanup.mjs --root ../../work/wisp-01/builder-01
```

This does not remove the pristine source, external model weights or coordinator-owned model server. Private stderr/frames/session logs are not copied into tracked evidence; sanitized JSON includes only pin, versions, model metadata, hashes and success assertions. No credentials, raw prompts/trajectories or model text are tracked as proof.

`../docs/engine-boundary.md` specifies lifecycle/events/approvals/errors, deadlines and future voice/state attachment. `../docs/engine-capabilities.md` maps all ten required capability categories, actual APIs, permission/UI implications and verified/conditional/unavailable status. It records MIT and third-party notice findings and explicitly leaves packaging readiness unresolved. This spike does not implement UI, speech, durable product memory, real computer control, plugin/MCP/skill/delegation workflows, or global permission enforcement. Independent Reviewer remains the acceptance authority.
