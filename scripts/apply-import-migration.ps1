$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$files = @(
  '.\db\migrations\002_court_import_staging.sql',
  '.\db\migrations\003_court_discovery.sql',
  '.\db\migrations\004_court_categories.sql',
  '.\db\migrations\005_court_profiles_monitoring.sql',
  '.\db\migrations\006_judge_appointment_review.sql',
  '.\db\migrations\007_court_registry_diffs.sql',
  '.\db\migrations\008_court_staff_rosters.sql',
  '.\db\migrations\008_official_case_references.sql',
  '.\db\migrations\009_court_intake_runs.sql'
)
foreach ($file in $files) {
  if (-not (Test-Path $file)) { throw "Missing migration file: $file" }
  Write-Host "Applying $file"
  Get-Content $file -Raw | docker compose -f compose.local.yaml exec -T postgres psql -v ON_ERROR_STOP=1 -U courts -d courts
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $file" }
}
Write-Host 'All import and discovery staging migrations applied successfully.'
