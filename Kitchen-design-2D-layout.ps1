# Kitchen design workspace helper - Windows Desktop
param($RepoPath = ".")

Set-Location $RepoPath
Write-Host "=== Kitchen Layout Current Status ===" -ForegroundColor Cyan
Write-Host "Repo: $(Get-Location)"

@(
  "react-configurator\src\config",
  "react-configurator\src",
  "freecad",
  "docs",
  "sweethome3d"
) | ForEach-Object {
  New-Item -ItemType Directory -Force -Path $_ | Out-Null
}

$requiredFiles = @(
  "react-configurator\src\App.jsx",
  "react-configurator\src\config\kitchenConfig.js",
  "react-configurator\src\main.jsx",
  "react-configurator\package.json",
  "react-configurator\index.html",
  "README.md"
)

$missing = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing.Count -gt 0) {
  Write-Host "Missing required files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Copy-Item -Path "Galley_2324x4746_Rule9_Current.json" -Destination "freecad\kitchenConfig.json" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "Galley_2324x4746_Rule9_Current.json" -Destination "sweethome3d\Galley_2324x4746_Rule9_Current.json" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Current React app is ready." -ForegroundColor Green
Write-Host "East Wall View: NORTH (N) on the left, SOUTH (S) on the right." -ForegroundColor White
Write-Host "West Wall View: y0-y1220 is a full-height door clear zone." -ForegroundColor White
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host " Double-click Run-Kitchen-React-App.bat to start the React app."
