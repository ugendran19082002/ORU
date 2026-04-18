param(
  [string]$File
)

$content = Get-Content $File -Raw -Encoding UTF8

# --- 1. Fix StatuBar style if it's hardcoded "dark" AND useAppTheme is not already imported ---
$hasAppTheme = $content -match 'useAppTheme'

# --- 2. Add useAppTheme import if missing ---
if (-not $hasAppTheme) {
  # Insert after first existing import from @/ or 'expo-' or 'react-native' etc.
  $content = $content -replace "(import \{ useAppTheme \} from '@/providers/ThemeContext';)", '$1'
  # Only add if truly not present
  if (-not ($content -match "useAppTheme")) {
    $content = $content -replace "(import \{[^}]+\} from 'expo-status-bar';)", "`$1`nimport { useAppTheme } from '@/providers/ThemeContext';"
    # Fallback: add after first import line
    if (-not ($content -match "useAppTheme")) {
      $content = $content -replace "(^import .*`$)", "`$1`nimport { useAppTheme } from '@/providers/ThemeContext';"
    }
  }
}

# --- 3. Fix StyleSheet palette references → runtime colors ---
# thannigoPalette.background -> colors.background
$content = $content -replace 'thannigoPalette\.background', 'colors.background'
$content = $content -replace 'thannigoPalette\.surface', 'colors.surface'
$content = $content -replace 'thannigoPalette\.darkText', 'colors.text'
$content = $content -replace 'thannigoPalette\.neutral', 'colors.muted'
$content = $content -replace 'thannigoPalette\.softText', 'colors.muted'
$content = $content -replace 'thannigoPalette\.borderSoft', 'colors.border'
$content = $content -replace 'thannigoPalette\.infoSoft', 'colors.inputBg'
$content = $content -replace 'thannigoPalette\.inputBg', 'colors.inputBg'
$content = $content -replace 'thannigoPalette\.placeholder', 'colors.placeholder'
$content = $content -replace 'thannigoPalette\.success\b', 'colors.success'
$content = $content -replace 'thannigoPalette\.successSoft', 'colors.successSoft'
$content = $content -replace 'thannigoPalette\.warning\b', 'colors.warning'
$content = $content -replace 'thannigoPalette\.error\b', 'colors.error'
$content = $content -replace 'thannigoPalette\.primary', 'colors.primary'
$content = $content -replace 'thannigoPalette\.card', 'colors.card'

# Role-specific mappings
$content = $content -replace 'thannigoPalette\.shopTeal\b', '#006878'
$content = $content -replace 'thannigoPalette\.customerBlue', '#1565C0'
$content = $content -replace 'thannigoPalette\.adminRed\b', '#ba1a1a'
$content = $content -replace 'thannigoPalette\.deliveryGreen\b', '#2e7d32'
$content = $content -replace 'thannigoPalette\.deliveryGreenLight', 'colors.deliverySoft'
$content = $content -replace 'thannigoPalette\.successDark', '#1B7A42'
$content = $content -replace 'thannigoPalette\.dangerSoft', 'colors.adminSoft'
$content = $content -replace 'thannigoPalette\.errorDark', '#922B21'
$content = $content -replace 'thannigoPalette\.staffOrange\b', '#E65100'
$content = $content -replace 'thannigoPalette\.staffOrangeLight', 'colors.staffSoft'
$content = $content -replace 'thannigoPalette\.adminRedLight', 'colors.adminSoft'

# --- 4. Fix backgroundColor: 'white' in StyleSheet (static styles) ---
$content = $content -replace "backgroundColor:\s*'white'", "backgroundColor: colors.surface"
$content = $content -replace 'backgroundColor:\s*"white"', 'backgroundColor: colors.surface'

# --- 5. Fix StatusBar: only if hardcoded "dark" without isDark conditional ---
if ($content -match 'isDark') {
  # already fixed, skip StatusBar replacement
} else {
  $content = $content -replace '<StatusBar style="dark" />', '<StatusBar style={isDark ? ''light'' : ''dark''} />'
  $content = $content -replace "<StatusBar style='dark' />", '<StatusBar style={isDark ? ''light'' : ''dark''} />'
}

Set-Content -Path $File -Value $content -Encoding UTF8
Write-Host "Fixed: $File"
