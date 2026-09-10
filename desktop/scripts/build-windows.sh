#!/bin/sh
# Linux host: do not compile windows.h sources and do not claim a Win32 binary.
set -eu
echo "missing-platform: this Linux host cannot compile Win32 sources (MSVC / windows.h). Skip. No Wisp.exe is produced; this is not a Win32 compile."
uname -s 2>/dev/null || true
exit 0
