#requires -Version 7.0
<#
Safely update localhost from the current Draft PR branch.
Creates an integrity-checked pg_dump and copies existing files BEFORE replacing
source. Never deletes Docker volumes. Does not change the remote public site.
Usage: pwsh -NoProfile -File .\scripts\safe-update-local.ps1
#>
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Join-Path $HOME 'sud-court-local'),
  [string]$BackupRoot = (Join-Path $HOME 'sud-court-backups'),
  [string]$Branch = 'feat/001-court-portal-foundation'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-Exit([string]$What) {
  if ($LASTEXITCODE -ne 0) { throw "$What failed with exit code $LASTEXITCODE" }
}
if ($Branch -ne 'feat/001-court-portal-foundation') { throw 'Unsupported branch' }
if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'compose.local.yaml'))) {
  throw "Project not found: $ProjectRoot"
}
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $BackupRoot $stamp
$oldSource = Join-Path $backupDir 'previous-project'
$downloadDir = Join-Path $backupDir 'incoming'
$downloadZip = Join-Path $backupDir 'source.zip'
$dump = Join-Path $backupDir 'courts-postgres.dump'
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

Push-Location $ProjectRoot
try {
  $pg = docker compose -f compose.local.yaml ps -q postgres
  Assert-Exit 'Locate PostgreSQL container'
  if ([string]::IsNullOrWhiteSpace($pg)) { throw 'PostgreSQL not running; start the existing project first' }
  docker compose -f compose.local.yaml exec -T postgres pg_dump -U courts -d courts -Fc -f /tmp/courts-preupgrade.dump
  Assert-Exit 'Create database backup'
  docker compose -f compose.local.yaml exec -T postgres pg_restore --list /tmp/courts-preupgrade.dump | Out-Null
  Assert-Exit 'Validate database backup'
  docker cp ($pg.Trim() + ':/tmp/courts-preupgrade.dump') $dump
  Assert-Exit 'Copy database backup'
  if ((Get-Item -LiteralPath $dump).Length -lt 1024) { throw 'Backup dump is unexpectedly small' }

  New-Item -Path $oldSource -ItemType Directory -Force | Out-Null
  # Preserve prior code and local .env files; large source dependencies and data
  # are not copied, because data/import remains untouched in the project root.
  Get-ChildItem -LiteralPath $ProjectRoot -Force |
    Where-Object { $_.Name -notin @('node_modules','.next','.git','data') } |
    ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $oldSource -Recurse -Force }
  @{
    timestamp = (Get-Date).ToString('o')
    projectRoot = $ProjectRoot
    postgresDump = $dump
    sha256 = (Get-FileHash -LiteralPath $dump -Algorithm SHA256).Hash
  } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backupDir 'manifest.json') -Encoding utf8

  $url = 'https://github.com/ymaslen77-tech/sud-court-importer/archive/refs/heads/' + $Branch + '.zip'
  Invoke-WebRequest -Uri $url -OutFile $downloadZip
  if ((Get-Item -LiteralPath $downloadZip).Length -lt 1024) { throw 'Archive download failed' }
  Expand-Archive -LiteralPath $downloadZip -DestinationPath $downloadDir -Force
  $incoming = Get-ChildItem -LiteralPath $downloadDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'compose.local.yaml') } |
    Select-Object -First 1
  if ($null -eq $incoming) { throw 'Archive does not contain project source' }

  docker compose -f compose.local.yaml down --remove-orphans
  Assert-Exit 'Stop previous services'
  # No --volumes, no deletion of project data or local secrets.
  Copy-Item -Path (Join-Path $incoming.FullName '*') -Destination $ProjectRoot -Recurse -Force
  docker compose -f compose.local.yaml up --build -d postgres --wait
  Assert-Exit 'Start existing database'
  & (Join-Path $ProjectRoot 'scripts/apply-import-migration.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Database migration failed' }
  docker compose -f compose.local.yaml up --build -d --wait
  Assert-Exit 'Start portal'
  $api=Invoke-WebRequest -Uri 'http://localhost:4174/api/v1/health' -TimeoutSec 20
  $web=Invoke-WebRequest -Uri 'http://localhost:4173/courts/types' -TimeoutSec 20
  if ($api.StatusCode -ne 200 -or $web.StatusCode -ne 200) {
    throw 'Post-update health checks failed'
  }
  Write-Host "SUCCESS: http://localhost:4173/courts" -ForegroundColor Green
  Write-Host "Backup: $backupDir"
} catch {
  Write-Warning "Upgrade halted: $($_.Exception.Message). Backup is at $backupDir. No automatic restore was attempted."
  throw
} finally {
  Pop-Location
}
