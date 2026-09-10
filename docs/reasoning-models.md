# Reasoning models

Models in Wisp Settings selects local Ollama or optional DeepSeek cloud. Change Model in the status menu opens the same view. Local use needs no cloud account. Ollama must already be running; this slice performs no downloads or hardware recommendations.

Choose the existing model and loopback address, then Save and Apply. Wisp saves the selection, stops its old reasoning process and attaches a new process. Saved and Active labels differ during transition or failure. Attachment validates configuration; Test Connection sends a small fixed greeting and shows success only after a correlated completed response. A cloud test may consume API credits. It does not accept a user-composed prompt or send a test automatically. Apply during a test interrupts that test. Failed connections never silently switch providers; correct the settings and apply again.

Tab and Shift-Tab traverse the visible enabled Models controls independently of the macOS keyboard-navigation preference. Space or Return activates action buttons; use the popup menu’s arrow keys and Space to select an option. The removal sheet supports Escape to cancel and Command-R to confirm.

The companion identity, selected home and saved memory survive model changes. A model apply also attaches the latest saved memory snapshot, without saving or discarding an unsaved memory draft. Speech remains separate and unavailable until its own slice. Existing permission restrictions are unchanged.

## Supported compatibility subset

- Local: `wisp-ollama`, pi-ai `openai-completions`, loopback HTTP `127.0.0.1`, `localhost` or `[::1]`, explicit port and `/v1`. The live-tested model is `qwen3:8b`. Its tested settings retain context8192, text input and off/high compatibility from the authorized local route. Additional identifiers are unverified until tested; Wisp's8192-context/1024-output text-only settings are conservative application limits, not hardware/capability promises.
- Cloud: pi-ai provider `deepseek`, fixed `https://api.deepseek.com`, installed pi-ai0.84.2 catalog IDs `deepseek-v4-flash` and `deepseek-v4-pro`. Catalog membership is not current service/account availability. Tests explicitly configure an output request cap of1024 and zero retries; real wire fixture verifies these values. No pricing is inferred from installed metadata.
- Other provider protocols, native account/OAuth flows, arbitrary URLs/headers and gateway integrations are unavailable in this build.

The hidden Harness remains pinned at d347e703908d0406b7a7ef80e3a0e594d86b2215. Product code uses `llm-pi-ai.providers` settings and accepted `initialize` provider/model fields. The accepted adapter initializes once, so replacement is explicit; there is no invented hot-switch SDK RPC. Accepted spike and archive files remain unchanged.

## Credentials and private state

An optional cloud key is entered in a secure native field. The stored value is never filled back into the field, exposed in its accessibility description or written to settings. An empty field preserves the stored key. Remove Key asks to delete that one local key, stops its active reasoning and leaves cloud unavailable until replaced. It does not revoke the provider account key remotely. Cancel changes nothing.

Generic-password Keychain items are scoped by the companion UUID and a new opaque key identifier per replacement. Private application-support `reasoning/config.json` contains only version, selected provider, model IDs, loopback endpoint and opaque key ID. A small private pending journal resolves interrupted config/Keychain commits. It can clean only exact IDs in this companion's service. Files use the same descriptor-relative, owner-only, no-follow, revision and directory-lock primitives as local memory. Unexpected corrupt/replaced state fails closed. No arbitrary existing Harness or `.env` configuration is imported.

Keychain operations run off the main thread. Lock metadata is checked before secret access because macOS legacy Keychain can block on locked reads despite UI-suppression flags. Unlock Keychain using macOS and retry if it is locked; no plaintext fallback exists. Per-item OS authorization may still be required. Test vaults use explicit isolated keychains without default search-list changes, user item enumeration or locking the login keychain. Legacy Security test-vault APIs emit SDK deprecation warnings; actual CRUD/lock/recovery behavior is tested on this host, not inferred from iOS protection flags.

Native code resolves the selected cloud key and sends one bounded anonymous-pipe bootstrap to its owned bridge. The bridge passes only the selected fixed credential reference into the owned Harness child's environment; local uses a nonsecret placeholder and never retrieves cloud key data. The child's trusted memory/environment contains the key during its run. No secret is put on argv or in generated settings/memory/diagnostics. Swift/JavaScript do not promise cryptographic memory zeroization or protection from a malicious same-user debugger/root. No tool capable of reading environment is enabled. Raw SDK error frames may contain a hostile provider echo in trusted process memory; product output uses fixed categories and never serializes those frames. Fixture tests scan generated artifacts for sentinel leaks.

## Development and verification

Build with `desktop/scripts/build-macos.sh --scratch /absolute/external/build`. Run with `desktop/scripts/run-macos.sh /absolute/external/build/Wisp.app /verified/runtime /absolute/private/marked-scratch`; model choice lives in Settings, without a route-file argument. Choose an owned home on initial launch. Runtime/node dependencies remain explicit development prerequisites; no installer/distribution claim is made.

From the repository root, use external scratch paths:

```
desktop/scripts/test-native.sh /absolute/external/native-tests
node --test desktop/tests/body-bridge.test.mjs desktop/tests/reasoning-config.test.mjs desktop/tests/memory-context.test.mjs spike/tests/client.test.mjs
node desktop/tests/models-security.mjs --runtime-root /verified/runtime --scratch /fresh/external/wire
node desktop/tests/models-bridge-security.mjs --runtime-root /verified/runtime --scratch /fresh/external/bridge
node desktop/tests/models-live.mjs --runtime-root /verified/runtime --scratch /external/owned-gui --app /external/build/Wisp.app/Contents/MacOS/WispBody
```

`models-source.mjs` additionally runs with prepared Node/tsx and the installed upstream path; it checks actual provider schemas/catalog and request caps without network requests. Wire fixtures replace endpoints only within test code and listen only on loopback. They are not proof of a live external service.

The interactive runner defaults to isolated support/home/scratch and test Keychain. `--credential-store production` explicitly omits the test-vault flag and uses the normal exact companion-scoped Keychain service. Use that mode only for an authorized live-cloud check: create a fresh generated support/home fixture, let the user type their real key directly into Wisp’s secure field, and never copy it into the runner, test vault, fixtures or logs. A production-mode launch does not itself authorize external requests. Start it with a live terminal and verify its PID before selecting its exact app path with CUA. Selecting a stopped app can launch it without isolation; after Quit, inspect runner/process results only. Actual pointer/keyboard actions must configure and apply models; the runner does not invoke UI selectors. It retains private nonsecret generated-memory observations and returns cleanup/turn summaries. Never use personal memory in cloud tests.

Live external DeepSeek use requires a supplied key, model access and explicit bounded call allowance. Builder verification completed three authorized real deepseek-v4-pro calls, including recall across app restart, then returned to local. Local and loopback fixture checks alone do not prove cloud success. See the current05 evidence and call ledger for completed checks, remaining independent review and allowance.
