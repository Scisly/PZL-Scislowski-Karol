param(
    [switch]$Compose,
    [switch]$E2E
)
$ErrorActionPreference = 'Stop'
$verifyArgs = @((Join-Path $PSScriptRoot 'verify.mjs'))
if ($Compose) { $verifyArgs += '--compose' }
if ($E2E) { $verifyArgs += '--e2e' }
& node @verifyArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
