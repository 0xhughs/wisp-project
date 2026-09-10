# Slice 13 — interchangeable mascot bodies (implementation evidence)

Builder candidate proof for dispatch **13-build-080**. This is not independent review, not slice 13 acceptance, and not a 07–11 Shipped claim. Native Swift is **uncompiled/unverified on this Linux host**. Builder cannot approve.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215`, porcelain clean. No DeepSeek call, model download, key inspection, merge, publish or spend.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

Result: **136/136 pass**, identity self-test ok. Contract identity remained `10a33ba06c391c205ddbf579b33f2a6ccd1e3226a88b46f9fbdaa5be5d0c6d91`. Tests include closed enum `wisp-orb` / `wisp-fox` / `wisp-robot`; default orb; unknown version/extra keys/oversize/empty id/`wisp-bird`/`official-skins`/`tool-bash` rejected; catalog rows three selectable + unsupported skins (`canManage` false); distinct raster unique-opaque and per-id gap samples; writing `pets/config.json` does not modify sibling memory, reasoning, voice, plugins, or connections bytes; `pet-config.mjs` is not in `prepare-product.mjs` `productFiles`.

Isolated pin-runtime initialize was **not** run (overlay / `classifyInsert` / `wisp.inventory` / admission untouched). **No new 13 initialize obligation.** Existing 09/10/11 missing-external-resource initialize backlog stays recorded.

## Native (uncompiled here)

Sources: `PetStore.swift`, `PetsView.swift`, `MascotView.swift` catalog drawings, CompanionController `applyPets` / `prepareModels` restore / `replaceBody` current id / developer `raster`+`recreate`, Settings Pets wiring, ManagementState Pets copy, `PetStoreTests` in NativeChecks. `desktop/scripts/test-native.sh` lists `PetStore.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

## 07 retest recorded (not claimed here)

13 edits CompanionController `replaceBody` / `applyPets` / `prepareModels` / facts+raster, and `MascotView`. VoiceLifecycle, EngineBridge, and permission allowlists were not edited. Record Mac 07 retest: shortcut/Wake, no auto-listen after pet Apply, mute preserved, new body tracks listening/speaking, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend DeepSeek 0/1. Do not treat 07 as accepted.

10 overlay / 11 MCP were not retested as a 13 obligation; those sources did not change.

## Suggested verification backlog (not claimed here)

1. Declared-Mac Settings → Pets and menu Change Pet…; keyboard traversal; confirm vs cancel (cancel: zero snapshot write, zero silhouette change); Apply fox then robot then orb.
2. Each body: distinct idle/listening/speaking; Reduce Motion; developer `raster` per id (corner 0, gap 0, unique opaque > 0); click-through corners and interior gap; drag visible pixels; non-key/non-main always-on-top.
3. Restart restores saved catalog id with the same companion UUID, home, memory revision, Models route, Voice mute/locale, plugin snapshot, connection snapshot. If an engine is attached, `runtimePID` / `sessionId` unchanged across pet Apply.
4. NativeChecks compile including PetStore assertions.

No secrets or raw engine stderr are in this file.
