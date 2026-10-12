$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
& docker compose -f compose.local.yaml down
if ($LASTEXITCODE -ne 0) { throw 'Could not stop the local containers.' }
Write-Host 'Local services stopped. PostgreSQL data was preserved.'
