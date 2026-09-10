# Slice 19 — official skin collection wave 1 (implementation evidence)

Builder candidate proof for dispatch **19-build-100**. This is not independent review, not slice 19 acceptance, and not APPROVE_IMPLEMENTATION. Slices 07, 08, 09, 10, 11, 12, 13, 15, 16, 17, and 19 are **not Shipped**. Native Swift / AppKit raster / Pets GUI are **uncompiled/unverified on this Linux host**. Builder cannot approve.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215` (re-verified porcelain clean). No DeepSeek call, model download, key inspection, merge, publish or spend. No secrets or raw engine stderr.

HEAD at dispatch: `06f0079419db7d50879e931499f69171baf2c14b`. Contract identity must remain `a26250063c5be1242d3789990fef1b32ce5d841734df018b872048bc40bb4f2d`.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

**241/241 pass, fail 0** (Linux-supplemental Node unit checks plus `identity.py --self-test`). Coverage includes:

- Closed enum exactly `wisp-orb`, `wisp-fox`, `wisp-robot`, `wisp-bird`, `wisp-cat`, `wisp-owl`, `wisp-sprout`, `wisp-capsule` in that order; default `wisp-orb`
- Unknown version, extra keys, oversize, empty id, `official-skins`, `wisp-dragon`, `marketplace-fox`, `tool-bash` rejected; `wisp-bird` accepted
- Catalog rows: eight selectable + one unsupported `official-skins` row; `canManage` false for unsupported
- Remainder copy does not claim skins remain slice 19 as if none shipped; no marketplace query implication
- Raster sample table: distinct gap and unique-opaque points per selectable id; existing orb/fox/robot samples unchanged (`wisp-orb` `[0,0]` / `[80,98]` / `[40,80]`)
- Writing `pets/config.json` with a wave-1 id does not modify sibling memory, reasoning, voice, plugins, connections, or skills bytes
- `pet-config.mjs` is not in `prepare-product.mjs` `productFiles`
- Parked-17 `windows-body-state` orb sample assertions remain applicable without `desktop/windows/**` edits

Isolated pin-runtime initialize was **not** run (overlay / `classifyInsert` / `wisp.inventory` / admission untouched). **No new 19 initialize obligation.** Existing missing-external-resource initialize backlog stays recorded.

## Native (uncompiled here)

Sources: `PetStore.swift` (eight-id selectable enum, titles, catalog-driven rows, `PetRaster`), `PetsView.swift` (radios generated from `PetCatalog.selectable`; heading Official bodies; unsupported row text-only), `MascotView.swift` (keep orb/fox/robot; five new even-odd `draw*` methods), CompanionController `petDescription` remainder copy only (`applyPets` / `replaceBody` / `prepareModels` restore unchanged; no `stopReasoning` / `startAttachment` on pet Apply), ManagementState Pets copy names all eight titles. `PetStoreTests` persist/reload wave-1 id and orb; `wisp-dragon` / `official-skins` rejected; `wisp-bird` accepted; raster uniqueness including new ids. `desktop/scripts/test-native.sh` already lists `PetStore.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh`.

## 13 / 07 retest recorded (not claimed here)

19 edits PetStore, PetsView, MascotView, CompanionController `petDescription`, and ManagementState Pets copy. `applyPets` / `replaceBody` / `prepareModels` / `render` / EngineBridge / VoiceLifecycle / permission allowlists were not used as an engine-restart path. Record:

- **13 retest:** Settings → Pets still selects orb, fox, and robot; Cancel still zero snapshot / zero silhouette change; developer `raster` for those three ids still reports corner alpha 0, existing gap samples alpha 0, and unique opaque > 0; click-through corners and interior gap still hold on those three; pet Apply still must not restart the engine.
- **07 retest:** shortcut/Wake, no auto-listen after pet Apply (including a wave-1 Apply), mute preserved, new body tracks listening/speaking, pending-approval speech suppression, no grant/reply revival, no orphan. Do not spend DeepSeek 0/1. Do not treat 07 as accepted.

Do not treat parked-13 Mac raster/Pets GUI as passed. 10 overlay / 11 MCP / 15 AX / 16 visual were not retested as a 19 obligation; those sources did not change.

## Honest gaps (LOOP class)

| Item | Gap class |
| --- | --- |
| NativeChecks compile; eight-body AppKit raster alpha; click-through | missing-platform |
| Declared-Mac Settings → Pets eight radios; keyboard traversal; confirm vs cancel; Apply each wave-1 id | human-test + missing-platform |
| Restart persistence of a wave-1 catalog id with same companion UUID / home / engine PID | human-test + missing-platform |
| 13 retest on orb/fox/robot; 07 shortcut/mic/TTS retest | human-test + missing-platform |
| Isolated pin-runtime initialize | missing-external-resource |

Further official bodies remain **19.x-catalog**. Windows drawings of non-orb ids remain **17.x-skins**. `desktop/windows/**` byte-unchanged.

No reserved DeepSeek call, model download, or key inspection is part of this evidence.
