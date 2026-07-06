$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:REPO_URL) { $env:REPO_URL } else { "https://github.com/Materialist-x/-IoT.git" }
$TargetDir = if ($env:TARGET_DIR) { $env:TARGET_DIR } else { Join-Path $HOME "-IoT" }
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = $null
$ComposeDir = $null

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is required."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "docker is required."
}

$ComposeCommand = @("docker", "compose")
try {
  & docker compose version *> $null
} catch {
  throw "docker compose is required."
}

if (Test-Path (Join-Path $ScriptRoot "..\\.git")) {
  $RepoRoot = (Resolve-Path (Join-Path $ScriptRoot "..")).Path
}

if ((Test-Path (Join-Path $ScriptRoot "docker-compose.yml")) -and
    (Test-Path (Join-Path $ScriptRoot "v7-backend")) -and
    (Test-Path (Join-Path $ScriptRoot "v8-frontend"))) {
  $ComposeDir = (Resolve-Path $ScriptRoot).Path
}

if ($RepoRoot) {
  & git -C $RepoRoot pull --ff-only
  $ComposeDir = Join-Path $RepoRoot "scada-platform"
} elseif (-not $ComposeDir) {
  $RepoRoot = $TargetDir
  if (Test-Path (Join-Path $RepoRoot ".git")) {
    & git -C $RepoRoot pull --ff-only
  } elseif ((Test-Path $RepoRoot) -and (Get-ChildItem -Force $RepoRoot | Select-Object -First 1)) {
    throw "Target directory already exists and is not a git repository: $RepoRoot"
  } else {
    & git clone $RepoUrl $RepoRoot
  }
  $ComposeDir = Join-Path $RepoRoot "scada-platform"
} else {
  Write-Host "Using local scada-platform snapshot at $ComposeDir"
}

if (-not (Test-Path (Join-Path $ComposeDir "docker-compose.yml"))) {
  throw "docker-compose.yml was not found under: $ComposeDir"
}

Set-Location $ComposeDir
& $ComposeCommand[0] $ComposeCommand[1] up -d --build
& $ComposeCommand[0] $ComposeCommand[1] ps
