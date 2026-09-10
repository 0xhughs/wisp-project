# Slice 08 — hardware-aware local-model onboarding (implementation evidence)

Builder candidate proof for dispatch **08-build-068**. This is not independent review, not slice 08 acceptance, and not a 07 or 10 Shipped claim. Native Swift is **uncompiled/unverified on this Linux host**. No `APPROVE_IMPLEMENTATION`.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215`, porcelain clean. No DeepSeek call, model download, key inspection, merge, publish or spend. Cloud 05 allowance 6/6 remains exhausted. Reserved DeepSeek greeting 0/1 unspent.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

Result: **68/68 pass**, identity self-test ok. Contract identity remained `b08394f1933e5dc1595a1ddff15a49b7a21e462b310b0fc9023782e6fac305d6`. Tests cover closed hardware schema/unknown-version/oversize, live `/proc` shape without baking this VM’s kB as a product threshold, drm-less GPU/unified unavailable reasons (not `0`), refuse summing unified+VRAM, `speechHeadroom.numericReservationBytes: null` and disk on every recommendation, Recommended bound to `qwen3:8b`, Faster/Stronger unique by Ollama-reported `size`, empty/unreachable Ollama, RESOURCE_PLAN_REQUIRED, GET-only inspect, loopback enforcement, and a loopback HTTP fixture for `/api/version` and `/api/tags`. Inspect/recommend/refresh never POST `/api/pull`. A consented plan may POST `/api/pull` only to that fixture, never a public registry.

No HTTP to port 11434 unless a test fixture was listening on an ephemeral loopback port (fixtures used `listen(0)`). This host had nothing listening on 11434.

## Native (uncompiled here)

Sources: `HardwareProbe.swift` (IOKit/Metal/ProcessInfo/disk wrapped so JSON fixtures decode without a live Metal device), `OnboardingState.swift` (resource-plan file owner-only/descriptor-relative/no-follow, ranking, GET-only inspect, Install gate, confirm-cancel, no-op Apply), `ModelsView` onboarding panel, `ModelsFocus` tab order, `ManagementState` Models/Diagnostics copy, `CompanionController.refreshOnboarding` off the main thread, Diagnostics nonsecret snapshot, `applyModels` equal-config no-op. NativeChecks lists the new sources. **missing-platform** until macOS `desktop/scripts/test-native.sh` / `desktop/scripts/build-macos.sh`.

## Apply / 07 / 10

Onboarding Use Recommended/Faster/Stronger/Cloud confirms when the saved route would change, then reuses `CompanionController.applyModels` → `stopReasoning` / `startAttachment`. Plugin snapshot is still staged by existing `startAttachment`. Slice 07 is not assumed working; **retest 07 after Apply** (shortcut/Wake, no auto-listen, mute preserved, no grant revival, no orphan). Parked 10 is not a dependency; no plugin work was implemented.

## Suggested verification backlog (not claimed here)

1. Declared-Mac Settings → Models onboarding, keyboard traversal, Refresh, unavailable-field copy, Faster/Recommended/Stronger/Cloud labels, confirm vs cancel Apply, restart persistence, Diagnostics snapshot.
2. Live local Ollama GET `/api/tags` includes existing `qwen3:8b` when that resource exists; Use Recommended applies that identifier without pull; speech headroom copy visible.
3. NativeChecks compile including HardwareProbe/OnboardingState assertions (`test-native.sh`, `build-macos.sh`).
4. Slice 07 retest after 08 Apply. Do not treat 07 as accepted. Do not spend the reserved greeting.
5. Live pull only after a coordinator-recorded consented resource plan; not authorized on this Linux host.

No secrets, keys, bootstrap frames, recognized text, answer text, raw engine stderr or home path dumps are in this file.
