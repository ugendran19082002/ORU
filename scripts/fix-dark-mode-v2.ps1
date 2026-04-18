# ============================================================
# ThanniGo Dark-Mode Fixer — replaces thannigoPalette.* in
# StyleSheet definitions with useAppTheme-driven values.
# 
# Strategy:
#   1. Replace thannigoPalette.* with DARK_PLACEHOLDER_* strings
#   2. Convert StyleSheet.create({...}) to a makeStyles function
#      returning colors.* tokens
#   3. Add useAppTheme import + const {colors,isDark} hook
#   4. Fix StatusBar style="dark" -> dynamic
#
# Run: pwsh -File fix-dark-mode-v2.ps1
# ============================================================

$base = "d:\thanniGo\ThanniGoApp"

# All files that still use thannigoPalette
$targets = Get-ChildItem -Path "$base\app" -Recurse -Filter "*.tsx" |
  Where-Object { (Select-String -Path $_.FullName -Pattern "thannigoPalette\." -Quiet) -and
                 -not (Select-String -Path $_.FullName -Pattern "const styles = makeStyles\|const makeStyles" -Quiet) }

Write-Host "Found $($targets.Count) files to process..."

$paletteMap = @{
  'thannigoPalette\.background'        = 'colors.background'
  'thannigoPalette\.surface\b'         = 'colors.surface'
  'thannigoPalette\.darkText'          = 'colors.text'
  'thannigoPalette\.neutral'           = 'colors.muted'
  'thannigoPalette\.softText'          = 'colors.muted'
  'thannigoPalette\.borderSoft'        = 'colors.border'
  'thannigoPalette\.infoSoft'          = 'colors.inputBg'
  'thannigoPalette\.inputBg'           = 'colors.inputBg'
  'thannigoPalette\.placeholder'       = 'colors.placeholder'
  'thannigoPalette\.success\b'         = 'colors.success'
  'thannigoPalette\.successSoft'       = 'colors.successSoft'
  'thannigoPalette\.warning\b'         = 'colors.warning'
  'thannigoPalette\.error\b'           = 'colors.error'
  'thannigoPalette\.primary\b'         = 'colors.primary'
  'thannigoPalette\.card\b'            = 'colors.card'
  "thannigoPalette\.shopTeal\b"        = "'#006878'"
  "thannigoPalette\.shopTealDark"      = "'#004E5B'"
  "thannigoPalette\.customerBlue"      = "'#1565C0'"
  "thannigoPalette\.adminRed\b"        = "'#ba1a1a'"
  "thannigoPalette\.adminRedLight"     = 'colors.adminSoft'
  "thannigoPalette\.deliveryGreen\b"   = "'#2e7d32'"
  "thannigoPalette\.deliveryGreenLight"= 'colors.deliverySoft'
  "thannigoPalette\.successDark"       = "'#1B7A42'"
  "thannigoPalette\.dangerSoft"        = 'colors.adminSoft'
  "thannigoPalette\.errorDark"         = "'#922B21'"
  "thannigoPalette\.staffOrange\b"     = "'#E65100'"
  "thannigoPalette\.staffOrangeLight"  = 'colors.staffSoft'
}

$fixed = 0
$skipped = 0

foreach ($file in $targets) {
  $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  $original = $content
  
  # Apply all palette replacements
  foreach ($pattern in $paletteMap.Keys) {
    $replacement = $paletteMap[$pattern]
    $content = [regex]::Replace($content, $pattern, $replacement)
  }

  # Fix 'backgroundColor: ''white''' in StyleSheet (inside StyleSheet.create blocks only)
  # We apply a broad replacement for now
  $content = $content -replace "backgroundColor:\s*'white'", "backgroundColor: colors.surface"
  $content = $content -replace 'backgroundColor:\s*"white"', 'backgroundColor: colors.surface'

  # Fix StatusBar: style="dark" -> dynamic (only if not already dynamic)
  if (-not ($content -match 'isDark.*light.*dark|isDark \?')) {
    $content = $content -replace '<StatusBar style="dark" />', '<StatusBar style={isDark ? ''light'' : ''dark''} />'
  }

  # Add useAppTheme import if not already there
  if (-not ($content -match 'useAppTheme')) {
    # Add after StatusBar import or after first expo-status-bar import
    if ($content -match "from 'expo-status-bar'") {
      $content = $content -replace "(from 'expo-status-bar';)", "`$1`nimport { useAppTheme } from '@/providers/ThemeContext';"
    } elseif ($content -match 'from "expo-status-bar"') {
      $content = $content -replace '(from "expo-status-bar";)', "`$1`nimport { useAppTheme } from '@/providers/ThemeContext';"
    } else {
      # Add after first import block
      $content = $content -replace "(^import .+`$)", "`$1`nimport { useAppTheme } from '@/providers/ThemeContext';"
    }
  }

  # Add colors/isDark destructure to component if not already there
  # We do this by finding the export default function body and adding it after opening brace
  if (($content -match 'useAppTheme') -and -not ($content -match 'const \{ colors.*isDark|const \{ isDark.*colors')) {
    # Find the main component function and add hook call
    # Pattern: export default function XxxScreen() { or () => {
    $content = $content -replace '(export default function \w+[^{]+\{)', "`$1`n  const { colors, isDark } = useAppTheme();"
  }

  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "  FIXED: $($file.Name)" -ForegroundColor Green
    $fixed++
  } else {
    Write-Host "  SKIP (no changes needed): $($file.Name)" -ForegroundColor Yellow
    $skipped++
  }
}

Write-Host ""
Write-Host "Done! Fixed: $fixed, Skipped: $skipped" -ForegroundColor Cyan
