$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$path = '.\db\migrations\002_court_import_staging.sql'
if (-not (Test-Path $path)) { throw "Missing migration file: $path" }
Get-Content $path -Raw | docker compose -f compose.local.yaml exec -T postgres psql -v ON_ERROR_STOP=1 -U courts -d courts
if ($LASTEXITCODE -ne 0) { throw 'Import staging migration failed. Database was not fully upgraded.' }
Write-Host 'Import staging migration applied successfully.'
