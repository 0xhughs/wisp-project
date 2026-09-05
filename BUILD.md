# BUILD — active contract

Slice: 01 Hidden engine feasibility proof
Archive: slices/01-hidden-engine-feasibility.md

## Goal
Prove that the exact intended DeepSeek Harness can serve as Wisp's invisible agent runtime, with a Wisp-owned client boundary and approval flow. This is a proposed engineering spike, not a claim about upstream support and not permission to begin implementation.

## Done when
1. Source identity is established: upstream URL, pinned revision, license/distribution constraints, supported execution environment and reproducible setup instructions are documented from inspected primary source. User intent is confirmed if more than one project could match the name.
2. A minimal repeatable client starts/connects to and stops the engine in the background, sends one harmless agent request, receives a result and reports failures through a Wisp-owned interface contract. No upstream web/chat interface is opened, embedded or required for setup, operation or errors. A local transport is acceptable only if its access boundary is documented and justified.
3. A capability map covers models/providers, plugins, MCP, skills, tools, sessions, storage, credentials, approvals and sub-agents. Each entry names the upstream source/API inspected, Wisp integration path, UI/permission implications, evidence and one of verified / conditional / unavailable. Do not mark an entire capability verified from the single request demo.
4. A controlled approval round trip reaches the Wisp-owned client before a simulated consequential effect. Denial and cancellation cause zero effects; approval permits only the described request. This spike uses a harmless test effect, not real messages, purchases, deletion or privileged actions. Identify what remains to enforce across every delegated route in slice 06.
5. The boundary contract keeps reasoning requests/events, tool/approval events, runtime sessions/state and lifecycle separate from replaceable speech recognition, synthesis and mascot presentation. Identify where one Wisp identity and future user-chosen local state will attach; do not build those subsystems yet.
6. Proof includes normal request completion, denied/cancelled/approved simulated action, startup/configuration failure and clean shutdown. No secret values appear in tracked files or diagnostic evidence. Any required capability without a supported headless path has a source-grounded in-engine adapter/change plan; if viability remains unresolved, report a blocker rather than claiming the milestone passed.

## Out
- Production mascot, tray/menu-bar or Settings UI; speech capture/playback; local-model onboarding/downloads; durable product memory; real computer control; remote access; Windows delivery; full skin catalog.
- Reimplementing the complete Harness capability system, substituting another runtime or exposing the Harness UI to bypass a gap.
- Claiming all upstream integrations compatible or the full product ready from this spike.

## Constraints
- Use the user-confirmed https://github.com/deepseek-ai/deepseek-harness at proposed pin `d347e703908d0406b7a7ef80e3a0e594d86b2215`. The user selected the full macOS first release target; build execution has not started or been requested. Selected upstream files were read during pack authoring; no engine was installed or run and no application implementation exists.
- Inspect source before choosing stack/process integration. Start by assessing the documented SDK stdio profile over the full base, rather than treating sdk-minimal as capability parity. Inspect profile patches for Wisp persona, tool access and telemetry settings. No invented APIs or numeric performance requirements.
- The inspected SDK dispatch exposes initialize, session/prompt and shutdown; approval routing is not demonstrated. Investigate a Wisp-owned Cordis answerer/transport extension tied to the actual tool call. Record prompt cancellation and completion-correlation limitations for later voice work rather than assuming the stock SDK covers them.
- Use a harmless provider/model configuration available under user authority. If live reasoning is unavailable, report that integration check as blocked; mocks alone cannot prove engine request completion.
- Keep the spike isolated from personal data and production credentials. Wisp owns approval presentation; a disposable test client is permitted as technical proof, not a user-facing chatbot product.

## Data / state impact
During eventual execution, use a disposable test data directory and documented cleanup. Identify engine persistence and credential boundaries without migrating user data. Pack preparation itself creates documentation only. No runtime is installed, no account connected and no model downloaded.

## Tests
- Record source revision and exact setup/run commands in evidence/01-engine-feasibility.md in the eventual implementation repository; cite inspected upstream files and supporting primary documentation.
- Run the actual engine/client smoke flow and record sanitized lifecycle/result evidence, process/transport observations and confirmation that no upstream UI is required or launched.
- Exercise the simulated-effect counter for deny, cancel and approve; record expected/actual effects. Verify failure and shutdown behavior.
- Provide capability mapping and the client contract alongside that evidence. Distinguish direct demonstrations from source inspection and untested conditions.
- Reviewer independently repeats relevant checks in an isolated exact candidate copy and evaluates every numbered criterion, including limitations. Check commands and artifact locations become concrete during the authorized source investigation; source-grounded gaps that prevent a concrete executable plan must be resolved before plan approval.

## Proof
Not completed yet. This build pack and the source findings in SLICES.md are prepared. The upstream HEAD was resolved and selected pinned documentation/source files inspected; no application, engine or approval-flow checks have run. This is authoring evidence only, not Builder proof or independent approval.

## Review
Pending plan review.
Plan approval: none
Implementation approval: none
Each result records dispatch ID, reviewer identity, verdict, contract identity, snapshot identity, evidence and criterion-specific blockers.

## Loop state
Execution mode / tool adapter: Not configured
Coordinator: none
Worker / role / phase: none
Dispatch ID / launch state / input identity: none
Pending result / last consumed dispatch: none
Snapshot capture and recheck commands / coverage / exclusions: Not configured; before first dispatch define exact commands under LOOP identity rules for the actual implementation repository. Include required untracked spike files and inspected engine revision; exclude only named generated/dependency paths and protected secret values, with their configuration effects documented safely.
Baseline snapshot: none
Contract identity: none
Candidate snapshot: none
Rejection count: 0
Consecutive no-progress repairs: 0
Open acceptance gaps / prior failing evidence: none; no review performed
Repair awaiting review: false
Review events: none
Budget limit / consumed / measurement: Not configured; no budget supplied
Blocker / resume status / resume action / recheck condition / deadline: none; pre-execution inputs are listed in Next, not an active runtime blocker
Advance phase: none
Next slice ID / draft: none

## Status
Proposed

## Next
Coordinator: begin execution only when requested, within the selected full macOS first release boundary (01–14). Use the confirmed upstream source and resolve remaining integration evidence needed for a concrete plan, refine the active contract within that target as needed, configure independent execution and reproducible snapshot/contract identities, then dispatch plan review. Keep SLICES Prepared until the first authorized dispatch. Do not start app development from this pack alone.
