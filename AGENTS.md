# Wisp — shared rules

## Working rules
- Work only within the active BUILD contract and the authorized SLICES Loop target. This new pack is Prepared, not an instruction to begin building.
- Inspect source and tests before changing them. Resolve reversible implementation choices using evidence; do not substitute a different agent runtime without the user's decision.
- Coordinator alone writes protocol files and archives. Builder owns implementation and proposed proof. Reviewer independently verifies and never fixes what it reviews.
- Use independent Builder and Reviewer agents when executing. Never self-approve or simulate independent review by changing personas.
- Preserve dispatch ownership, snapshot identities, counters and immutable history across interruptions. Shipped means independently accepted, not deployed or published.
- Apply locally installed agent-skills workflows when they match the task. For code review use code-reviewer or code-review-and-quality; for security use security-auditor or security-and-hardening; for tests use test-engineer or test-driven-development. Readiness reviews cover correctness, readability, architecture, security, performance and meaningful test coverage. These optional workflow aids do not replace the self-contained LOOP protocol or require that another machine have these skills installed.

## Product invariants
- Wisp is one persistent desktop AI companion. The mascot is its interchangeable visual body, never an observer of a separate agent. Identity, memory, tools, models, connections and skills survive body changes.
- Voice is the primary interaction. No chatbot window, text composer, conversation-history interface, or embedded ChatGPT-like experience. Editable settings and memory are management surfaces, not chat.
- DeepSeek Harness is the intended invisible runtime. Keep its compatible and safe models/providers, plugins, MCP, skills, tools, sessions, storage, credentials, approvals and sub-agents. Wisp owns every user-facing surface; never expose, embed or fall back to the Harness web/chat UI.
- Verify the exact upstream repository and revision before relying on runtime behavior. An integration gap is evidence to resolve, not permission to invent supported APIs or quietly replace the engine.
- Speech recognition and text-to-speech are separate, replaceable systems from the reasoning model: microphone → speech recognition → agent/model → text-to-speech → spoken response.
- The desktop body is transparent, always on top, movable and animated. Idle transparent regions pass clicks to underlying applications; the companion must not obstruct normal computer use.
- A global shortcut wakes Wisp. Optional voice wake is later scope. Listening and speaking have visible reactions.
- Local-first: no required cloud account or unnecessary telemetry. User files and durable memory live in a user-chosen Wisp directory and remain understandable and editable. Credentials must be protected and omitted from diagnostics; do not store secrets in ordinary memory files.
- Durable memory captures preferences, projects, standing instructions and important facts. Internal sessions, raw trajectories and diagnostics may exist, but never become the main interface.
- Support local models when possible and optional cloud API keys. Hardware recommendations must leave capacity for speech; do not promise every model or device is supported.
- Wisp Settings manages General, Models, Voice, Pets, Plugins, Connections, Skills, Memory, Permissions, Proactivity and Diagnostics. Tray/menu-bar controls belong to Wisp.
- Ordinary users see services as Connections; advanced users may configure custom MCP servers. Wisp owns friendly permissions and credential handling; Harness supplies the capability system. Compatibility and safety govern availability.
- Skills are reusable behaviors learned or installed by the same Wisp, not separate assistants. Internal sub-agents do not introduce a second user-facing identity.
- Sending, deleting, purchasing and privileged operations require clear user confirmation before execution. Cancellation or denial must prevent execution, including actions delegated through plugins, MCP, skills or sub-agents. Scope confirmation to the actual action; material changes require confirmation again.
- Start computer control with safe actions such as opening a URL/file and telling time. Later prefer macOS Accessibility and Windows UI Automation, with visual clicking only when structured access is insufficient.
- macOS is the first serious target; Windows remains an intended follow-on platform. Changing the pet never changes the agent. Around twenty official skins is eventual scope, not an initial delivery quota.
- Future Telegram/WhatsApp-style remote access is only another doorway into the same Wisp, never the main product, a second identity or a reason to add a traditional chat interface.

## Session start
Read AGENTS.md, SLICES.md, BUILD.md, LOOP.md and the relevant role file. Inspect repository evidence; read HANDOFF.md only if active. Coordinator reconciles workers, pending results, counters, identities and advance phase before dispatch. Do not start a second writer while ownership is unresolved.

## Session end
Return worker results to coordinator. Persist the exact next action and evidence. Human required stops execution; Blocked permits only its recorded recheck. Complete permits no new work without an authorized target or repair.
