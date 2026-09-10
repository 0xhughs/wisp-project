# 07 Linux recovery inventory — 2026-09-10

Host: Linux Ubuntu 24.04.4 x86_64, 4 CPUs, 15 GiB RAM, Node v22.14.0, Python 3.12.3. No Swift, Xcode, AVAudioEngine, SFSpeechRecognizer, Carbon hotkeys, Keychain, or macOS windowing. Cloud agent `bc-81f7c99b-f70d-4a0a-83e5-180597760926`. Working branch created from `feat/macos-release-loop` at `4635a949238baa78b4f6fb2b628e64403a236f82`.

## Present in this checkout

- Protocol files, slices 01–06 archives, slice 07 WIP contract/evidence, desktop native/JS sources and tests, spike adapters.
- Compact checkpoint JSON in `evidence/07-checkpoint-results.json`. Portable voice notes in `docs/voice.md` and `evidence/07-voice.md`.
- HANDOFF unused. BUILD status was Human required with counters 0/0 and approved plan `07-plan-051`.

## Missing (original Mac paths; not invented)

| Recorded path | Status |
|---|---|
| `../../work/loop-state/identity.py` and identity-v1.py | Absent. Replacement is `tools/identity.py`. Historical hashes cannot be recomputed here. |
| `../../work/loop-state/baseline-07/` | Absent. Fresh baseline after plan approval. |
| `../../work/loop-state/07-plan-046.md`, `07-plan-051.md`, `07-audit-055.md`, `07-audit-057.md` | Absent. BUILD Review names them; verbatim bodies are not in git. |
| `../../work/loop-state/07-deepseek-check-authorization.json` | Absent. BUILD records 0/1 agent cloud allowance; do not spend it here. |
| `../../work/deepseek-harness` pin `d347e703908d0406b7a7ef80e3a0e594d86b2215` | Absent. Clone only after plan approval; no model download. |
| `../../work/wisp-07/07-build-047` … `07-verify-054`, native/JS logs, GUI recordings, build10 binary SHA `9c15fe1696558846694855359d48a218228c8b7a9d31941ee9d4f50c6fe156c4` | Absent. Compact JSON remains; do not claim those binaries or raw logs were reproduced. |
| Saved DeepSeek Keychain item / participant Mac TCC state | Absent and must not be sought. Latest attach failure stays Keychain access, not an invalid key. |

## Honest capability

Linux can run Node protocol/bridge/static tests, identity self-checks, and (after a pin clone) isolated JS that needs no Ollama, microphone, or paid API. Linux cannot pass 07 Mac gates. Native Swift tests import Carbon/AppKit/Speech and are not executable here.

Image Node is v22.14.0, which cannot import `zstdDecompressSync`. A user-local Node v22.20.0 was installed at `$HOME/.local/node-v22.20.0-linux-x64` to match `spike/prepare.mjs` (>=22.19). `tools/linux-js-tests.sh` uses that runtime when present. On 2026-09-10 it reported 32/32 Node unit tests passed. That is Linux-supplemental, not 07 acceptance.
