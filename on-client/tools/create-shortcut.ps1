# Create one user-owned Windows shortcut inside a freshly generated release folder.
# This script does not change firewall, UAC, policies, registry, or installed apps.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$AppRoot)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($AppRoot)
$launcher = Join-Path $root 'GIGACHAD-start.cmd'
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) { throw 'LAUNCHER_NOT_FOUND' }
$shortcutPath = Join-Path $root 'GIGACHAD-launch.lnk'
if (Test-Path -LiteralPath $shortcutPath) { throw 'SHORTCUT_ALREADY_EXISTS' }
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $root
$shortcut.Description = 'Start the local GIGACHAD dashboard'
$shortcut.Save()
if (-not (Test-Path -LiteralPath $shortcutPath -PathType Leaf)) { throw 'SHORTCUT_SAVE_FAILED' }
Write-Output 'SHORTCUT_CREATED'
