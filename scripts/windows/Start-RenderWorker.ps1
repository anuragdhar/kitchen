# Run from a normal PowerShell terminal. No elevation, policy change or service installation.
[CmdletBinding()]
param(
    [string]$Workspace = (Join-Path $HOME 'A501RenderWorker'),
    [string]$BlenderExe,
    [string]$InputFolder,
    [ValidateRange(60,3600)][int]$PollSeconds = 60,
    [ValidateRange(1,1440)][int]$StageTimeoutMinutes = 240,
    [switch]$TrustMain,
    [switch]$Publish,
    [switch]$AutoMergeEvidence,
    [switch]$Once
)
$ErrorActionPreference = 'Stop'
if (-not $TrustMain) { throw 'Read docs/RENDER_WORKER.md and add -TrustMain to allow approved main code to run locally.' }
if ($AutoMergeEvidence -and -not $Publish) { throw '-AutoMergeEvidence requires -Publish.' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$script = Join-Path $root 'scripts/render_worker.py'
$arguments = @($script, '--workspace', $Workspace, '--interval', "$PollSeconds", '--timeout', "$StageTimeoutMinutes", '--trust-main')
if ($BlenderExe) { $arguments += @('--blender', $BlenderExe) }
if ($InputFolder) { $arguments += @('--inputs', $InputFolder) }
if ($Publish) { $arguments += '--publish'; Write-Warning 'Selected renders and sanitized logs will be published to the public anuragdhar/kitchen repository.' }
if ($AutoMergeEvidence) { $arguments += '--auto-merge-evidence' }
if ($Once) { $arguments += '--once' }
Write-Host 'A501 render worker. Ctrl+C stops it. Your development checkout is not pulled or reset.'
if (Get-Command py -ErrorAction SilentlyContinue) { & py -3 @arguments }
elseif (Get-Command python -ErrorAction SilentlyContinue) { & python @arguments }
else { throw 'Python 3.11+ is required; install it and reopen this terminal.' }
exit $LASTEXITCODE
