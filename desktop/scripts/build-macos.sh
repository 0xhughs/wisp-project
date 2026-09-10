#!/bin/sh
set -eu
[ "$#" = 2 ] && [ "$1" = --scratch ] || { echo 'usage: build-macos.sh --scratch /absolute/external/path' >&2; exit 2; }
case "$2" in /*) scratch="$2";; *) exit 2;; esac
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
case "$scratch/" in "$root/"*) echo 'scratch must be outside source' >&2; exit 2;; esac
mkdir -p "$scratch"
swift build --package-path "$root/desktop/macos" --scratch-path "$scratch/swift" >&2
bin=$(swift build --package-path "$root/desktop/macos" --scratch-path "$scratch/swift" --show-bin-path)
mkdir -p "$scratch/Wisp.app/Contents/MacOS"
cp "$bin/WispBody" "$scratch/Wisp.app/Contents/MacOS/WispBody"
cp "$root/desktop/macos/Info.plist" "$scratch/Wisp.app/Contents/Info.plist"
mkdir -p "$scratch/Wisp.app/Contents/Resources/desktop"
cp -R "$root/desktop/engine" "$scratch/Wisp.app/Contents/Resources/desktop/"
cp -R "$root/spike" "$scratch/Wisp.app/Contents/Resources/"
# SwiftPM signs only the executable. Bind the completed bundle's usage strings
# and resources to Wisp's own development identity; no credential or network.
/usr/bin/codesign --force --sign - "$scratch/Wisp.app"
/usr/bin/codesign --verify --strict "$scratch/Wisp.app"
printf '%s\n' "$scratch/Wisp.app"
