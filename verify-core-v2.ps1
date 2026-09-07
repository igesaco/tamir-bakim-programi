$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [string]$Title,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor Cyan

  & $Command

  if ($LASTEXITCODE -ne 0) {
    throw "$Title başarısız oldu. Exit code: $LASTEXITCODE"
  }

  Write-Host "OK: $Title" -ForegroundColor Green
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$api = Join-Path $root "apps\api"
$web = Join-Path $root "apps\web"

Write-Host ""
Write-Host "TAMIR BAKIM - CORE V2 SON DOGRULAMA" -ForegroundColor Yellow
Write-Host "Root: $root"

Set-Location $api

Run-Step "API - npm ci" {
  npm ci --include=dev
}

Run-Step "API - Prisma generate" {
  npx prisma generate
}

Run-Step "API - Prisma migrate deploy" {
  npx prisma migrate deploy
}

Run-Step "API - Production build" {
  npm run build
}

Run-Step "API - Lint" {
  npm run lint
}

Run-Step "API - E2E health/database test" {
  npm run test:e2e -- --runInBand
}

Set-Location $web

Run-Step "WEB - npm ci" {
  npm ci
}

Run-Step "WEB - Lint" {
  npm run lint
}

Run-Step "WEB - Production build" {
  npm run build
}

Set-Location $root

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "TUM OTOMATIK TESTLER BASARIYLA TAMAMLANDI" -ForegroundColor Green
Write-Host "Core V2 build/migration/lint/e2e: OK" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
