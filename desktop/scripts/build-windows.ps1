# Requires Windows + MSVC/CMake. On Linux this prints missing-platform and does not compile.
param(
  [Parameter(Mandatory = $false)]
  [string]$Scratch
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') {
  Write-Output 'missing-platform: Win32 MSVC/CMake build skipped on this host. This is not a Win32 compile and does not produce Wisp.exe.'
  exit 0
}
if (-not $Scratch) {
  Write-Output 'usage: build-windows.ps1 -Scratch <absolute-external-path>'
  exit 2
}
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $root) { $root = Get-Location }
New-Item -ItemType Directory -Force -Path $Scratch | Out-Null
cmake -S (Join-Path $root 'desktop/windows') -B (Join-Path $Scratch 'windows-build')
cmake --build (Join-Path $Scratch 'windows-build') --config Release
Write-Output (Join-Path $Scratch 'windows-build/Release/Wisp.exe')
