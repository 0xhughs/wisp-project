# Slice 12 — reusable skills for the same Wisp (implementation evidence)

Builder candidate proof for dispatch **12-build-084**. This is not independent review, not slice 12 acceptance, and not a 07–11 or 13 Shipped claim. Native Swift is **uncompiled/unverified on this Linux host**. Builder cannot approve.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215`, porcelain clean. No DeepSeek call, model download, key inspection, merge, publish or spend.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

Result: **151/151 pass**, identity self-test ok. Contract identity remained `8d7b28860c42fe1be5917851ba5a8e1ed213b1bbd0399552936086b647c12d3b`. Tests include closed enum `wisp-local-time-briefing`; default `enabled: false`; unknown version/extra keys/oversize/empty id/`meeting-prep-bundle`/marketplace/`tool-bash` rejected; catalog rows one selectable plus unsupported meeting-prep, marketplace, ambient folders, learned/user-authored, skill-plugin, general-subagents (`canManage` false); SKILL.md kebab-case name and `userInvocable: false`; writing `skills/config.json` does not modify sibling memory, reasoning, voice, plugins, connections, or pets bytes; default `composeOverlay` keeps `tool-skill` disabled and does not insert `wisp-skill-register` and does not mention `wisp-local-time-briefing` as an enabled insert; enabled composition contains an id-patch `tool-skill` `disabled: false` and one register insert (not `classifyInsert` of a second `tool-skill`); `classifyInsert` still throws for `tool-skill` / `skill-filesystem` / `tool-subagent` inserts and nonempty `extraInserts`; permission-protocol accepts `skill` / `wisp-skill` / `load-skill-instructions` / `{name:'wisp-local-time-briefing'}` and rejects other names and extra keys; inventory helper: disabled ⇒ no `skill` tool and empty skills array; enabled requires `skill` present; same-object wrap `consume()` before pin execute (deny is zero clock); 10 `skill-plugin` row detail is Settings → Skills (not “until slice 12”); skill catalog text cannot enter TTS as assistant replies; pet write does not modify a sibling skills snapshot; 09 Direct `wisp_tell_time` still validates.

`desktop/tests/skill-overlay-runtime.mjs` is landed for isolated initialize/seal against a prepared pin runtime. This host has no prepared `.wisp-spike.json` (find under `$HOME` returned none). **Test 2 gap class: missing-external-resource.** Isolated pin-runtime initialize was **not** run.

## Native (uncompiled here)

Sources: `SkillStore.swift`, `SkillsView.swift`, CompanionController `applySkills` / `startAttachment` `--skill-file` staging, Settings Skills wiring, ManagementState Skills copy, PermissionState `skill` / `wisp-skill`, PermissionWindow “Wisp skill”, PluginStore `skill-plugin` detail, Pets copy (skills persist / same Wisp), `SkillStoreTests` in NativeChecks. `desktop/scripts/test-native.sh` lists `SkillStore.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

`applySkills` uses `stopReasoning` then `startAttachment`. Pet `applyPets` still does not.

## Overlay / wrap facts (static)

- Default snapshot `enabled: false`; default composed overlay leaves stock `tool-skill` `disabled: true` and omits `wisp-skill-register`.
- Enable emits `\n- id: tool-skill\n  disabled: false\n` onto the existing base row plus one JSON-data insert of covered `skill-register.ts` with `inject: ['skills']`.
- `DISABLED_STOCK_IDS` still includes `tool-skill`, `skill-filesystem`, `tool-subagent*`, `tool-bash`, `tool-fs`, `tool-web`.
- `prepare-product.mjs` `productFiles` includes `skill-config.mjs`, `skill-wrap.mjs`, `skill-register.ts`, `skills/wisp-local-time-briefing/SKILL.md`.
- Admission source `wisp-skill` wraps `execute` on the **same** registered ToolDefinition object after `loader.await()`, then `admit`, then `seal()`. `consume()` runs immediately before pin `skill` execute. Arguments `{name:'wisp-local-time-briefing'}`. That grant is not permission to call `wisp_tell_time`.
- Register invocation is `{ modelInvocable: true, userInvocable: false }`, source `'bundled'`.

## 07 / 09 / 10 / 11 retest obligations (not claimed here)

12 edits CompanionController Apply/lifecycle (`applySkills`, `startAttachment` skill staging, ready/unavailable skill flags), EngineBridge argv (`--skill-file`), permission-protocol / PermissionState allowlists, overlay composer (`composeOverlay` `skill=`, `classifyInsert` COVERED/INJECT), `wisp.inventory` skills, VoiceLifecycle-adjacent pending-approval speech suppression (skill catalog text must not TTS). Record:

1. **07 retest:** shortcut/Wake, no auto-listen after skill Apply, mute preserved, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend DeepSeek 0/1. Linux analogue: voice-seams pending-approval and skill-catalog-not-TTS tests passed; not audible proof.
2. **09 retest:** permission-protocol and PermissionState accept `skill` / `wisp-skill` and still accept `wisp_tell_time` / URL / file Direct pairs. Default skill-disabled inventory helper still excludes `skill`. Recording-opener 0/0/0/1 tests still pass. Do not treat NSWorkspace or live Ollama as passed.
3. **10 overlay/inventory retest:** default composition still omits the demonstration plugin unless enabled; `skill-plugin` stays not enableable with detail “Skills are managed in Settings → Skills; Cordis skill plugins stay unavailable.”; hostile extra inserts still fail `classifyInsert`; `extraInserts` nonempty still throws.
4. **11 MCP retest:** default composition still omits `wisp-mcp-connection` unless enabled; `mcp__` names still absent unless connection enabled; MCP wrap/permission-protocol pairs still pass; extra unadmitted MCP tool still fails seal.

Do not treat 07, 08, 09, 10, 11, or 13 Done when as satisfied.

## Suggested verification backlog (not claimed here)

1. Declared-Mac Settings → Skills: catalog labels, Enable confirm vs cancel (cancel: zero snapshot write, zero overlay enable of `tool-skill`), Apply, Disable, relaunch, unsupported rows not enableable.
2. Native Allow Once / Deny / Cancel for `skill` then for `wisp_tell_time`; exact skill name visible; deny/cancel zero clock effect; Allow Once on `skill` does not read the clock; Allow Once on `wisp_tell_time` is one clock read.
3. Restart restores enabled/disabled with the same companion UUID, home path, memory revision, Models route, Voice mute/locale, plugin snapshot, connection snapshot, and pet catalog id. Skills Apply restarts the engine (new `runtimePID` / `sessionId` expected, unlike pet Apply).
4. NativeChecks compile including SkillStore assertions.
5. Isolated pin-runtime `skill-overlay-runtime.mjs` when a prepared `.wisp-spike.json` exists.
6. Then **07 retest** on Mac: shortcut/Wake, no auto-listen after skill Apply, mute preserved, pending-approval speech suppression, no orphan.

No secrets or raw engine stderr are in this file.
