param(
    [switch]$WhatIf
)

$pathsToRemove = @(
  'backend-build.log',
  'backend.log',
  'backend_output.log',
  'build-backend.log',
  'build-final.log',
  'frontend-build.log',
  'BACKEND_AUTH_DEBUG_SESSION.md',
  'PARALLEL_DEVELOPMENT_SESSION.md',
  'SYSTEM_TESTING_REPORT_2025-11-24.md',
  'COMPREHENSIVE_TESTING_REPORT_2025-11-25.md',
  'TESTING_SESSION_COMPLETE.md',
  'FINAL_DARK_THEME_HOMEPAGE.png',
  'FINAL_VERIFICATION_DARK_THEME.png',
  'home-page-fixed-progress.png',
  'home-page-fixed.png',
  'login_test.png',
  'home-page-full.png',
  'home-viewport.png',
  'test-01-admin-dashboard.png',
  'screenshots',
  'migration-backup-20251112_220028',
  'migration-backup-20251112_220152',
  'quick_test.py',
  'test_fetch.html',
  'test_login.html'
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
while (-not (Test-Path (Join-Path $root 'README.md')) -and $root -ne [IO.Path]::GetPathRoot($root)) {
    $root = Split-Path -Parent $root
}

Write-Host "Workspace root:" $root

foreach ($relPath in $pathsToRemove) {
    $fullPath = Join-Path $root $relPath
    if (Test-Path $fullPath) {
        if ($WhatIf) {
            Write-Host "[WhatIf] Would remove $fullPath"
        } else {
            Write-Host "Removing $fullPath"
            Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
