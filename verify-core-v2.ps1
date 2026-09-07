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
    throw "$Title basarisiz oldu. Exit code: $LASTEXITCODE"
  }

  Write-Host "OK: $Title" -ForegroundColor Green
}

function Run-Api-Smoke-Test {
  Write-Host ""
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host "API - Production health/database smoke test" -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor Cyan

  $listener = [System.Net.Sockets.TcpListener]::new(
    [System.Net.IPAddress]::Loopback,
    0
  )
  $listener.Start()
  $port = $listener.LocalEndpoint.Port
  $listener.Stop()

  $oldPort = $env:PORT
  $oldNodeEnv = $env:NODE_ENV
  $env:PORT = "$port"
  $env:NODE_ENV = "test"

  $process = $null

  try {
    $process = Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory $api -PassThru -NoNewWindow

    $health = $null

    for ($i = 0; $i -lt 30; $i++) {
      Start-Sleep -Milliseconds 500

      if ($process.HasExited) {
        throw "API process exited before health check. Exit code: $($process.ExitCode)"
      }

      try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -Method Get -TimeoutSec 2

        if (
          $health.status -eq "ok" -and
          $health.database -eq "ok"
        ) {
          break
        }
      }
      catch {
        $health = $null
      }
    }

    if (
      -not $health -or
      $health.status -ne "ok" -or
      $health.database -ne "ok"
    ) {
      throw "Production API health/database smoke test failed."
    }

    Write-Host "Health status: $($health.status)" -ForegroundColor Green
    Write-Host "Database status: $($health.database)" -ForegroundColor Green
    Write-Host "OK: API - Production health/database smoke test" -ForegroundColor Green
  }
  finally {
    if (
      $process -and
      -not $process.HasExited
    ) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }

    if ($null -eq $oldPort) {
      Remove-Item Env:PORT -ErrorAction SilentlyContinue
    }
    else {
      $env:PORT = $oldPort
    }

    if ($null -eq $oldNodeEnv) {
      Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    }
    else {
      $env:NODE_ENV = $oldNodeEnv
    }
  }
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

Run-Api-Smoke-Test

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
Write-Host "Core V2 migration/build/lint/API-health/web-build: OK" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
