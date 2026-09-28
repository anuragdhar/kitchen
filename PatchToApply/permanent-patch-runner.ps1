# Apply trusted room ZIPs through an isolated local worktree, then publish to main.
[CmdletBinding()]
param(
    [string]$ZipPath,
    [string]$SourceRepo,
    [string]$Workspace,
    [string]$NodePath,
    [string]$PythonPath,
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $SourceRepo) { $SourceRepo = $root }
if (-not $Workspace) { $Workspace = Join-Path $HOME 'A501RenderWorker\patches' }
if (-not $PythonPath) {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCommand) { throw 'Python 3.11+ is required to apply patches.' }
    $PythonPath = $pythonCommand.Source
}
if (-not $NodePath) {
    $command = Get-Command node -ErrorAction SilentlyContinue
    if ($command) { $NodePath = $command.Source }
    else {
        $localNode = Join-Path $root 'tmp\node22\node-v22.23.3-win-x64\node.exe'
        if (Test-Path -LiteralPath $localNode) { $NodePath = $localNode }
        else { throw 'Node 22 is required to apply patches.' }
    }
}
$zips = if ($ZipPath) { @(Get-Item -LiteralPath $ZipPath) }
        else { @(Get-ChildItem -LiteralPath $PSScriptRoot -File -Filter '*.zip' | Sort-Object Name) }
if (-not $zips) { Write-Host 'No patch ZIPs found.'; exit 0 }
$failed = 0
foreach ($zip in $zips) {
    $arguments = @(
        (Join-Path $root 'scripts\patch_pipeline.py'),
        '--zip', $zip.FullName,
        '--source-repo', $SourceRepo,
        '--workspace', $Workspace,
        '--node', $NodePath
    )
    if ($CheckOnly) { $arguments += '--check-only' }
    & $PythonPath @arguments
    if ($LASTEXITCODE -ne 0) { $failed++ }
}
if ($failed) { exit 1 }
exit 0
