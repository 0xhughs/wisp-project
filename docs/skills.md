# Reusable skills for the same Wisp

Wisp Settings → Skills manages a **closed, Wisp-authored catalog** on the existing companion identity. It does not query a marketplace, `dsh` skill install, npm/git skill packs, project `.dsh/skills`, `~/.dsh/skills`, `~/.agents/skills`, or arbitrary folders. The only selectable skill in this slice is the locally authored demonstration **Local time briefing** (`wisp-local-time-briefing`).

A skill is instructions for the same Wisp, not a second assistant, not a second companion UUID, and not a pet-specific agent. There is no composer, transcript, Harness web/chat UI, `/skill` picker, or `dsh` CLI as the Skills surface.

## What is supported

- **Local time briefing** (`wisp-local-time-briefing`): optional. Default is **not installed** (`enabled: false`). The in-repo `SKILL.md` tells the same Wisp to call the already-admitted Direct tool `wisp_tell_time` exactly once and to wait for Wisp confirmation. Harmless clock read only. Enable confirmation states that this is the same Wisp, that a skill is instructions not a second assistant, and that Enable is not Allow Once. Cancel, Escape, or Revert Draft leaves the saved snapshot and overlay unchanged. Apply persists a versioned snapshot under application-support `skills/` and restarts the hidden engine (`stopReasoning` then `startAttachment`, same generation ownership as Plugins/Connections Apply). Applying the already-saved enabled or disabled state is a no-op. Without a chosen Wisp folder, Apply explains that a folder is required to save skill enablement and does not invent a second identity.
- **Overlay when enabled (pin-supported, two operations only):**
  - **Id-patch (not a new insert):** set stock row `tool-skill` (`@deepseek-ai/dsh-tool-skill`) to `disabled: false`. This is not `classifyInsert` of a second `tool-skill`. `extraInserts` stays empty.
  - **Covered insert:** `wisp-skill-register` with `inject: ['skills']` reads the covered SKILL.md and calls `ctx.skills.register({ name:'wisp-local-time-briefing', ..., invocation:{ modelInvocable:true, userInvocable:false }, source:'bundled' })`.
- **Status** is one of: not installed, saved, applying, active, incompatible, unavailable. Native status follows the last saved snapshot plus the initialize inventory (`wisp.inventory.skills`: catalog id, skill name, revision, contributed tool name `skill`, nonsecret config digest). When disabled, `skills: []` and tool name `skill` is absent.
- **Failed start** leaves the engine unavailable and **keeps** the saved snapshot.
- **Permissions:** Skill Enable is not a grant. Loading skill markdown is not a grant for `wisp_tell_time`. The stock `skill` tool is wrapped on the **actual registered** object after `loader.await()`; `consume()` runs immediately before pin execute returns instruction markdown. Source `wisp-skill`. Operation `load-skill-instructions`. Arguments exactly `{name:'wisp-local-time-briefing'}`. Native confirmation shows a trusted “Wisp skill” label and that loading instructions does not run other tools. Controls remain Allow Once, Deny, and Cancel Request. A later `wisp_tell_time` is a new Direct call (source `wisp-safe-action`, operation `read-local-clock`) and still asks. Zero clock reads until that separate Direct Allow Once.

## What stays unavailable

The catalog lists, and cannot enable:

- `meeting-prep-bundle` — Meeting preparation (calendar, attendees, documents, summarize) remains an illustrative example, not a shipping service bundle.
- `skill-marketplace` — Named marketplaces, `dsh` skill install, npm/git skill packs, and `dsh-skill-badge`. No empty-list implication that a marketplace was queried.
- `ambient-skill-folders` — Project `.dsh/skills`, user `~/.dsh/skills`, `~/.agents/skills`, and arbitrary folders. Stock `skill-filesystem` stays disabled.
- `learned-user-authored` — Learning or authoring a new skill from conversation, a skill editor, or a slash-command composer.
- `skill-plugin` — Cordis skill plugins remain unavailable in Settings → Plugins; skill management is this Skills page.
- `general-subagents` — Stock `tool-subagent`, `tool-subagent-fork`, `tool-subagent-control`, and `tool-subagent-list-agents` stay disabled. Internal delegated consequential child asks remain denied under the 06 `never` policy.

Stock `tool-bash` / `tool-fs` / `tool-web` stay disabled. Slice 09 URL/file/time remain Direct (`wisp-safe-action`). Settings → Plugins `skill-plugin` row stays not enableable.

## Same Wisp

After confirmed skill Enable/Disable, and after ordinary Quit and relaunch:

- Exactly one companion UUID and the same chosen Wisp home
- Durable memory bytes/revision unchanged by the skill snapshot write (sibling store, not a memory entry)
- Models route, Voice settings, plugin snapshot, connection snapshot, and pet catalog id unchanged
- Skills belong to that same Wisp. Changing the pet remains a visual body swap and must not become a skill identity or a reason to restart the engine. Pet Apply still must **not** call `stopReasoning` / `startAttachment`.

Internal sub-agents, if present in developer fixtures, remain the same Wisp identity with inherited permission constraints. They are not a second user-facing identity.

## Overlay seam

SDK `patchReload: startup` and the disabled `hmr` row are respected: there is no live `loader.create` mount on a stdio session. Identity, selected home, durable memory, Models route, Voice settings, plugin snapshot, connection snapshot and pet catalog id survive Skills Apply because Apply reuses the existing stop/restart generation path (unlike pet Apply).

Saved state is a sibling application-support snapshot `skills/config.json`:

```json
{"version":1,"catalogId":"wisp-local-time-briefing","enabled":false}
```

`catalogId` must be exactly `wisp-local-time-briefing`. Unknown version, unknown keys, oversize (>4096), empty id, `meeting-prep-bundle`, marketplace ids, `tool-bash`, and empty catalogId fail closed. Launch may pass `WISP_SKILL_SNAPSHOT` (nonsecret JSON). Diagnostics may show the nonsecret catalog id, title, and enabled/active status. Overlay YAML, `memory.json`, plugin notes, connection env, argv, and Keychain contents are not valid places for a second identity key.

## Linux vs Mac

Linux-supplemental JS tests cover closed catalog, snapshot schema, overlay composition (id-patch plus one register insert), permission-protocol, same-object wrap, sibling isolation, and inventory honesty. Isolated product-adapter initialize tests require a prepared pin runtime (`desktop/tests/skill-overlay-runtime.mjs`). Native Swift `SkillStore` / `SkillsView` / NativeChecks are **uncompiled/unverified on Linux**. macOS Settings pointer/keyboard, live Ollama skill-then-time 0/0/0/1, audible confirmation, and 07 shortcut/mic/TTS retest are verification-backlog items.

No Harness web UI, prompt composer, `dsh` CLI, reserved DeepSeek call, model download or key inspection is part of this surface.
