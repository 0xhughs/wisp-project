#!/bin/sh
set -eu
# Explicit local dependencies; no model provisioning or background listener.
[ "$#" = 3 ] || { echo 'usage: run-macos.sh /path/Wisp.app /prepared/runtime /private/scratch' >&2; exit 2; }
app="$1"; runtime="$2"; scratch="$3"
case "$scratch" in /*) ;; *) exit 2;; esac
[ -f "$scratch/.wisp-owned" ] || { echo 'create a private scratch with .wisp-owned first' >&2; exit 2; }
"$(command -v node)" "$app/Contents/Resources/desktop/engine/prepare-product.mjs" "$runtime"
# LaunchServices gives privacy requests Wisp's own application attribution.
exec /usr/bin/open -n -W -a "$app" --args --runtime-root "$runtime" --scratch "$scratch" --node "$(command -v node)"
