# Slice 09 — initial safe computer actions (implementation evidence)

Builder candidate proof for dispatch **09-build-072**. This is not independent review, not slice 09 acceptance, and not APPROVE_IMPLEMENTATION. Slices 07, 08, 09 and 10 are **not Shipped**. Native Swift is **uncompiled/unverified on this Linux host**.

Harness pin clone at `$HOME/wisp-work/deepseek-harness`: `d347e703908d0406b7a7ef80e3a0e594d86b2215` (re-verified porcelain clean). No DeepSeek call, model download, key inspection, merge, publish or spend.

HEAD at dispatch: `3cfd1e8580a0ba9e4d29e6669f17f028b16d63d6`. Contract identity must remain `6eb355143ee11ad341064e4bfbba3e12b6d1812aec254e6920a5f63781b35cc6`.

## Linux-supplemental (this host)

```
sh tools/linux-js-tests.sh
```

See the Builder handback for the exact pass count: **109/109** Node tests plus `identity.py --self-test` ok. Coverage includes:

- URL scheme rejects (`file:`, `javascript:`, `data:`, userinfo, custom schemes) and http/https accept
- File privileged/symlink/suffix/relative/extra-argv/executable/shebang rejects; viewable scratch suffix accept
- Time empty-args describe without reading the clock; injected clock is the only tool-effect clock
- Permission-protocol accept/reject for the three `wisp-safe-action` tuples without loosening fixture pairing
- Withhold/deny/cancel/allow-once 0/0/0/1 on a recording opener and injected clock; deny/cancel never notify native
- Native-open RPC timeout does not retry; one grant ⇒ at most one opener invocation
- Overlay still disables `tool-bash` / `tool-fs` / `tool-web` / `web-fetch-http`
- Opener/ack events cannot enter TTS (voice-seams analogue)
- Product sources do not spawn `xdg-open` / `/usr/bin/open`

`desktop/tests/plugin-overlay-runtime.mjs` remains the isolated initialize/inventory check. This host has no prepared `.wisp-spike.json` runtime. **Test 2 gap class: missing-external-resource.**

## 07 retest (Linux analogue; not voice acceptance)

Edits touched `CompanionController` receive, `EngineBridge` allowed events, `permission-protocol.mjs`, and admission. Linux analogue:

- Pending native approval still suppresses speech (`voice-seams.test.mjs`)
- `open-request` / `open-complete` are not treated as `voice-result` text
- Apply/Quit/home/engineStopped still cannot revive grants or replies
- Mute still does not auto-listen; shortcut-unavailable still allows Wake

Do not treat 07 Done when as satisfied. No audible TTS, shortcut hardware, or microphone proof on this host. Do not spend DeepSeek 0/1.

## 06 / 10 regressions (Linux analogue)

- Developer fixture and compatible-plugin protocol pairs unchanged
- Default overlay still omits `wisp-compatible-plugin`; enablement still does not admit tools
- `DISABLED_STOCK_IDS` still lists stock bash/fs/web
- Default inventory growth (three always-on 09 names) is recorded; isolated overlay-runtime initialize is missing-external-resource until a prepared pin runtime exists. When that runtime exists: default must include the three 09 names, still exclude `wisp_compatible_check` unless enabled, still fail initialize on a hostile extra tool

## Native (uncompiled here)

Sources: `SafeActionOpener.swift` (`NSWorkspace.shared.open` after re-validation of viewer-eligibility, not path-string equality only), `PermissionState.swift` / `PermissionWindow.swift` labels, `EngineBridge.swift` `open-request` + `completeOpen`, `CompanionController.swift` receive (not voice-result), `ManagementState.swift` Ask-each-time copy. `desktop/scripts/test-native.sh` lists `SafeActionOpener.swift`. **missing-platform** until macOS `test-native.sh` / `build-macos.sh` and live NSWorkspace.

## Suggested verification backlog (not claimed here)

1. Declared-Mac Allow Once / Deny / Cancel for URL, file, and time; exact destination visible; 0/0/0/1 per tool; `file:` and `/etc` never succeed.
2. 07 retest on the declared Mac after these bridge/permission edits: shortcut/Wake, no auto-listen, mute preserved, pending-approval speech suppression, no orphan. Do not spend DeepSeek 0/1.
3. NativeChecks compile including 09 PermissionRequest/opener-double assertions.
4. Slice 10 inventory overlay-runtime initialize with the three always-registered 09 tools.
5. Live local Ollama 0/0/0/1 for each 09 tool when a model is present.

No secrets, destinations from a user home, or raw engine stderr are in this file. Not 07/08/09/10 Shipped. No APPROVE_IMPLEMENTATION.
