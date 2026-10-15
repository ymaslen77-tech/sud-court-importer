#Requires -Version 7.0
<#
  Safe localhost refresh for Windows/Docker Desktop.
  - No Git installation required
  - Binary pg_dump backup BEFORE replacing code or applying migrations
  - Docker volumes preserved (never uses "down -v")
  - Optional intake/watch profiles remain disabled
#>
param(
    [string]$ProjectRoot = (Join-Path $HOME "sud-court-local"),
    [string]$BackupRoot = (Join-Path $HOME "sud-court-backups")
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-Docker([string]$Action) {
    if ($LASTEXITCODE -ne 0) { throw "Docker failure: $Action (exit $LASTEXITCODE)" }
}

$compose = Join-Path $ProjectRoot "compose.local.yaml"
if (-not (Test-Path -LiteralPath $compose)) {
    throw "Project not found at $ProjectRoot. No changes made."
}
docker info --format '{{.ServerVersion}}' | Out-Null
Assert-Docker "Docker Desktop is not running"

$temporary = Join-Path $env:TEMP ("sud-court-release-" + [guid]::NewGuid().ToString("N"))
$archive = Join-Path $temporary "source.zip"
$extract = Join-Path $temporary "extracted"
New-Item -ItemType Directory -Path $extract -Force | Out-Null

try {
    Write-Host "Downloading latest development branch..."
    Invoke-WebRequest -Uri "https://github.com/ymaslen77-tech/sud-court-importer/archive/refs/heads/feat/001-court-portal-foundation.zip" -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $extract
    $source = Get-ChildItem -LiteralPath $extract -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "compose.local.yaml") } | Select-Object -First 1
    if (-not $source) { throw "Downloaded archive has no Compose project. No changes made." }
    if (-not (Test-Path -LiteralPath (Join-Path $source.FullName "scripts/apply-import-migration.ps1"))) {
        throw "Missing migrations in archive. No changes made."
    }
    Set-Location $ProjectRoot
    Write-Host "Starting PostgreSQL without deleting its volume..."
    docker compose -f compose.local.yaml up -d postgres --wait
    Assert-Docker "starting PostgreSQL"

    $container = (docker compose -f compose.local.yaml ps -q postgres | Select-Object -First 1).Trim()
    Assert-Docker "finding PostgreSQL container"
    if (-not $container) { throw "Cannot locate PostgreSQL container. No changes made." }

    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupName = "courts-$timestamp.dump"
    $backupFile = Join-Path $BackupRoot $backupName
    $containerDump = "/tmp/$backupName"

    Write-Host "Backing up database to $backupFile ..."
    docker compose -f compose.local.yaml exec -T postgres pg_dump -U courts -d courts -Fc -f $containerDump
    Assert-Docker "pg_dump"
    docker cp "$($container):$containerDump" $backupFile
    Assert-Docker "copying database backup to Windows"
    if (-not (Test-Path -LiteralPath $backupFile) -or (Get-Item -LiteralPath $backupFile).Length -lt 1024) {
        throw "Database backup is missing or too small. Source files remain unchanged."
    }
    docker compose -f compose.local.yaml exec -T postgres rm -f $containerDump
    Assert-Docker "removing temporary dump"
    Write-Host "Verified database backup: $backupFile"

    Write-Host "Copying source files. Existing data/import and Docker volumes are preserved."
    Copy-Item -Path (Join-Path $source.FullName "*") -Destination $ProjectRoot -Recurse -Force

    docker compose -f compose.local.yaml config --quiet
    Assert-Docker "Compose configuration"
    & (Join-Path $ProjectRoot "scripts/apply-import-migration.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Database migration failed. Backup: $backupFile" }

    docker compose -f compose.local.yaml up --build -d --wait
    Assert-Docker "application restart"
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:4174/api/v1/health" -TimeoutSec 30
    if ($health.StatusCode -ne 200) { throw "API health check did not return HTTP 200" }
    $web = Invoke-WebRequest -Uri "http://127.0.0.1:4173/courts" -TimeoutSec 30
    if ($web.StatusCode -ne 200) { throw "Court directory did not return HTTP 200" }

    Write-Host "Local update successful. Backup: $backupFile"
    Start-Process "http://localhost:4173/courts"
}
finally {
    if (Test-Path -LiteralPath $temporary) {
        Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
    }
}
