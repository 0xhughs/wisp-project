# Pets — interchangeable mascot bodies

Wisp Settings → Pets and the menu-bar **Change Pet…** action select a **closed, Wisp-authored official catalog (wave 1)**. Changing the pet never changes the companion. There is no marketplace, no `dsh` skin install, no PNG/JPEG/Live2D/Spine pack, no download, and no spend.

## Rights

All eight selectable bodies are original Wisp-authored programmatic vector artwork drawn in-repo with AppKit `NSBezierPath` / even-odd fills. They are not third-party files, not recorded commercial licenses, and not imported rasters.

## Closed catalog

| Catalog id | Title | Default |
|---|---|---|
| `wisp-orb` | Wisp orb | Yes. This **is** the accepted-02 even-odd oval (teal idle, amber listening, cyan speaking, interior gap). |
| `wisp-fox` | Fox | Original fox silhouette with an interior gap and fox-specific listening/speaking reactions. |
| `wisp-robot` | Robot | Original robot silhouette with an interior gap and robot-specific listening/speaking reactions. |
| `wisp-bird` | Bird | Original winged silhouette with a pointed beak/tail, even-odd eye gap, and bird-specific listening/speaking reactions. |
| `wisp-cat` | Cat | Original sitting-cat silhouette with two pointed ears, even-odd belly gap, and cat-specific listening/speaking reactions. |
| `wisp-owl` | Owl | Original round owl with ear tufts, even-odd eye-ring gap, and owl-specific listening/speaking reactions. |
| `wisp-sprout` | Sprout | Original two-leaf plant companion with an even-odd between-leaf/stem-window gap and sprout-specific listening/speaking reactions. |
| `wisp-capsule` | Capsule | Original vertical rounded capsule with an even-odd porthole gap and capsule-specific listening/speaking reactions. |

One explicit unsupported row, not enableable: `official-skins` — Additional official skins. Further official skins toward the eventual collection remain later. The catalog does not imply that a marketplace, third-party pack, or extra skins were queried.

## Persistence

Saved state is a sibling application-support snapshot `pets/config.json`:

```json
{"version":1,"catalogId":"wisp-orb"}
```

`catalogId` must be exactly `wisp-orb`, `wisp-fox`, `wisp-robot`, `wisp-bird`, `wisp-cat`, `wisp-owl`, `wisp-sprout`, or `wisp-capsule`. Unknown version, unknown keys, oversize (>4096), empty id, `wisp-dragon`, `official-skins`, marketplace ids, and `tool-bash` fail closed. A missing file defaults to `wisp-orb` (create-on-load, same pattern as Voice). An invalid file is not migrated to a wave-1 id and does not create a new companion UUID; Wisp reports restore-the-file, keeps the in-memory last-good or orb drawing, and does not write `memory.json`. Unknown ids may be normalized to `wisp-orb` for drawing only; they are never persisted.

Restart restores the last saved catalog id. In-flight drafts are process memory only.

## Same Wisp

After a confirmed body change, and after Quit/relaunch that restores the saved id:

- One companion UUID and the same chosen Wisp home
- `memory.json` bytes and revision unchanged
- Models route and protected key refs unchanged
- Voice settings (locale, voice id, rate, mute) unchanged
- Plugin snapshot and connection snapshot unchanged
- Skills persist on that same Wisp (closed catalog; see `skills.md`); pet Apply does not restart the engine or change the skill snapshot
- Admitted tools, overlay YAML, and persona unchanged

Pet Apply follows Voice settings (`homeQueue` persist, then swap the drawing view). It **must not** call `stopReasoning` / `startAttachment`, must not replace Harness, and must not change `sessionId` / `runtimePID` when an engine is already attached. Pet id is not a second `companionId`, is not written into overlay YAML, argv, `product.patch.yml` persona, or memory instructions, and is not a permission grant.

Apply Body confirmation states that this is the same Wisp and that identity, memory, models, voice, plugins, connections, and skills persist. Cancel, Escape, or Revert Draft: zero file write, zero view replacement. Applying the already-saved id is a no-op. Without a chosen Wisp folder, Apply explains that a folder is required to save a body and does not invent a second identity.

Body change recreates `MascotView` inside the **existing** controller-owned `MascotPanel` (`replaceBody`: one panel, generation bump, no second window). Developer `recreate` recreates the **current** pet. Developer `raster` reports `catalogId`, corner alpha, interior-gap alpha, and one body-unique opaque sample.

## Presentation (02 class)

Panel size remains 160×160. Each body has clear window corners and an interior transparent gap. Visible silhouette pixels accept native drag. Idle transparent regions pass clicks by native alpha hit-testing. Always-on-top, nonactivating, non-key/non-main `MascotPanel` rules stay. Processing, approval, muted, unavailable, starting, and stopped keep the existing 07 color mapping on whatever body is current.

## What this surface is not

No composer, transcript, Harness web/chat UI, `dsh` CLI, user-imported skins, or pet-specific chat. No pet-specific memory, models, plugins, connections, or skills.

## Linux vs Mac

Linux-supplemental JS tests cover the closed enum, fail-closed snapshot schema, catalog rows, raster sample table, and sibling-file isolation. Native Swift `PetStore` / `PetsView` / `MascotView` catalog drawings / NativeChecks are **uncompiled/unverified on Linux**. macOS Settings pointer/keyboard, per-body raster/click-through, restart persistence, live companion UUID / home / engine PID proof, 13 retest, and 07 shortcut/mic/TTS retest are verification-backlog items.

No reserved DeepSeek call, model download, or key inspection is part of this surface.
