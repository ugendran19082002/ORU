$base = "d:\thanniGo\ThanniGoApp"
$files = Get-ChildItem -Path "$base\app" -Recurse -Filter "*.tsx" | Sort-Object FullName
$fixed = 0

foreach ($f in $files) {
  $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $original = $content

  # ── Fix 1: makeStyles defined but missing 'const styles = makeStyles(colors)' ──
  # Inject it right after the useAppTheme() hook destructure
  if (($content -match 'const makeStyles') -and `
      -not ($content -match 'const styles = makeStyles') -and `
      ($content -match 'useAppTheme')) {
    $content = [regex]::Replace(
      $content,
      '(const \{[^}]*colors[^}]*\} = useAppTheme\(\);)',
      "`$1`r`n  const styles = makeStyles(colors);"
    )
  }

  # ── Fix 2: Deduplicate double useAppTheme calls ──────────────────────────────
  # The bulk script injected a short call on top of an existing longer one.
  # Pattern: short injection (colors, isDark) + styles line, then longer original call.
  # Keep only the longer one, and inject styles after it.
  $content = [regex]::Replace(
    $content,
    "const \{ colors, isDark \} = useAppTheme\(\);\r?\n  const styles = makeStyles\(colors\);\r?\n([ \t]*const \{ colors, isDark[^}\r\n]*\} = useAppTheme\(\);)",
    "`$1`r`n  const styles = makeStyles(colors);"
  )

  # ── Fix 3: Deduplicate: shorter call then longer call without styles line ────
  $content = [regex]::Replace(
    $content,
    "const \{ colors, isDark \} = useAppTheme\(\);\r?\n([ \t]*const \{ colors, isDark[^}\r\n]*setThemePreference[^}\r\n]*\} = useAppTheme\(\);)",
    "`$1"
  )

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  FIXED: $($f.FullName.Substring($base.Length + 1))" -ForegroundColor Green
    $fixed++
  }
}

Write-Host ""
Write-Host "Fixed $fixed files" -ForegroundColor Cyan
