$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repositoryRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker Desktop is required. Install and start Docker Desktop, then run this script again.'
}

& docker compose -f compose.local.yaml up --build --detach
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose could not start the application.' }

$url = 'http://localhost:4173'
Write-Host 'Starting Courts of Russia on' $url
for ($attempt = 0; $attempt -lt 120; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
      Start-Process $url
      Write-Host "Site is open: $url"
      exit 0
    }
  } catch {
    # First build and application startup are not instantaneous.
  }
  Start-Sleep -Seconds 2
}
throw "The containers started, but the site did not respond at $url. Check: docker compose -f compose.local.yaml logs --tail 100"
