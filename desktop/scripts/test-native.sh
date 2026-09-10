#!/bin/sh
set -eu
[ "$#" = 1 ] || exit 2
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
case "$1" in /*) scratch="$1";; *) exit 2;; esac
case "$scratch/" in "$root/"*) exit 2;; esac
mkdir -p "$scratch"
src="$root/desktop/macos/Sources/WispBody"
swiftc "$src/VoiceShortcut.swift" "$src/VoiceState.swift" "$src/VoiceStore.swift" "$src/VoiceController.swift" "$src/VoiceLifecycle.swift" "$src/SpeechProviders.swift" "$src/PermissionState.swift" "$src/SafeActionOpener.swift" "$src/ModelsFocus.swift" "$src/ReasoningStore.swift" "$src/ReasoningCredentials.swift" "$src/HomeStore.swift" "$src/MemoryStore.swift" "$src/PluginStore.swift" "$src/ConnectionStore.swift" "$src/ConnectionCredentials.swift" "$src/HardwareProbe.swift" "$src/OnboardingState.swift" "$src/ManagementState.swift" "$src/BodyState.swift" "$src/ScreenGeometry.swift" "$src/EngineBridge.swift" "$root"/desktop/macos/Tests/WispBodyTests/*.swift -o "$scratch/NativeChecks"
"$scratch/NativeChecks" "$scratch"
