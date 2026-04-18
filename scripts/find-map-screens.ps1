$base = "d:\thanniGo\ThanniGoApp"
$dirs = @("$base\app", "$base\components")
$results = @()
foreach ($dir in $dirs) {
  Get-ChildItem -Path $dir -Recurse -Filter '*.tsx' | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $rel = $_.FullName.Substring($base.Length + 1)
    if ($content -match 'ExpoMap|MapView|expo-location|latitude|longitude|search-map|map-preview') {
      $issues = @()
      if (-not ($content -match 'useAppTheme')) { $issues += "no-theme" }
      if ($content -match "backgroundColor:\s*'white'|backgroundColor:\s*'#fff") { $issues += "hardcoded-bg" }
      if ($content -match "'#64748b'|'#1e293b'|'#94a3b8'") { $issues += "hardcoded-colors" }
      if ($content -match "<StatusBar style=`"dark`"") { $issues += "static-bar" }
      if ($content -match "position: 'absolute'.*bottom:\s*\d{3,}") { $issues += "hardcoded-offset" }
      $status = if ($issues.Count -eq 0) { "PASS" } else { "FAIL [$($issues -join ', ')]" }
      $results += [PSCustomObject]@{ File = $rel; Status = $status }
    }
  }
}
Write-Host "=== MAP/LOCATION SCREEN AUDIT ===" -ForegroundColor Cyan
$results | ForEach-Object {
  $color = if ($_.Status -like 'PASS') { 'Green' } else { 'Red' }
  Write-Host "  $($_.Status)  $($_.File)" -ForegroundColor $color
}
Write-Host ""
Write-Host "Total: $($results.Count)  Failing: $(($results | Where-Object { $_.Status -like 'FAIL*' }).Count)" -ForegroundColor Yellow
