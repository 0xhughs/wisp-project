# Speech-project reuse evaluation — 2026-09-10

Compared reusable components versus a whole-project fork. Primary sources: GitHub repository pages and project READMEs/docs on 2026-09-10. No code was copied. No architecture replacement is proposed.

## AIRI — https://github.com/moeru-ai/airi

MIT, actively maintained, Web/macOS/Windows (Tauri). Realtime voice, Live2D/VRM, Discord/Telegram, game hooks. Speech: Silero VAD, client STT, multi-provider TTS including ElevenLabs/Azure/OpenAI and local Kokoro / Hugging Face Candle. `unspeech` is a separate ASR/TTS proxy.

A whole-product adoption would replace DeepSeek Harness, introduce chat/remote/game surfaces, and bypass Wisp native approvals. Compatible reuse later: study Kokoro/Candle as a *replaceable synthesis backend* only after a contract that still keeps Wisp identity, Harness, and scoped approvals. That is not slice 07 (installed `AVSpeechSynthesizer`) and would need user decision plus plan review.

## Open-LLM-VTuber — https://github.com/Open-LLM-VTuber/Open-LLM-VTuber

Cross-platform Live2D companion, web and desktop pet, chat-log persistence, visual perception, proactive speech. ASR/TTS catalogs include sherpa-onnx, Faster-Whisper, FunASR, Edge TTS, Azure, and others. v2 is a planned rewrite. FunASR language knobs observed as zh/en/auto; Arabic would depend on a Whisper-class model or a TTS vendor, not on-device Apple Speech. Forking would replace Harness and make transcripts a product surface. Optional later: inspect sherpa-onnx/Edge-TTS quality behind Wisp's existing speech interfaces — not 07.

## Iris — https://github.com/ASHR12/iris

MIT Electron companion. Gemini Live is the voice; Hermes Agent does tools. Natural interruption and cloud STT/TTS. Replacing Wisp's independent recognition/reasoning/synthesis split and Harness with Gemini Live is a product-direction change requiring user decision. Not compatible reuse for 07.

## AgentPet — https://github.com/ntd4996/agentpet

MIT Swift desktop pet that *observes* Claude Code/Codex/Cursor/Gemini. Menu-bar monitor, XP/leaderboard, optional chat bubble. This contradicts Wisp's rule that the mascot is the companion's body, never an observer of a separate agent. No voice loop, no Harness, no Wisp approvals. Do not fork.

## Decision

Keep Wisp. Do not adopt another repository as the product. Slice 07 stays on-device `SFSpeechRecognizer` with `requiresOnDeviceRecognition` and installed system voices. Naturalness of Samantha remains an unresolved quality complaint, not a license to swap engines in this slice. Arabic on-device input remains a machine/asset fact, not something another project's demo proves on the test Mac.
