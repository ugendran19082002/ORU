#!/usr/bin/env node
/**
 * Fix TypeScript errors across ThanniGo app files.
 *
 * Two patterns fixed:
 * 1. Duplicate `const { colors, isDark } = useAppTheme();` — keep only the first one.
 * 2. Duplicate `const { colors, isDark, ... } = useAppTheme();` broader form.
 *
 * These are the TS2451 (cannot redeclare block-scoped variable) errors.
 * Logic is NOT changed — only duplicate declarations are removed.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Files reported by tsc with TS2451 duplicate-declaration errors
const FILES_WITH_DUPLICATES = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/orders.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/search.tsx',
  'app/addresses.tsx',
  'app/admin/(tabs)/index.tsx',
  'app/admin/bank-requests.tsx',
  'app/admin/complaints.tsx',
  'app/admin/features.tsx',
  'app/admin/growth.tsx',
  'app/admin/payouts.tsx',
  'app/admin/refunds.tsx',
  'app/admin/users.tsx',
  'app/auth/index.tsx',
  'app/auth/login.tsx',
  'app/auth/otp.tsx',
  'app/customer-analytics.tsx',
  'app/customer-payment-history.tsx',
  'app/customer-payment-methods.tsx',
  'app/customer-reviews.tsx',
  'app/delivery/history.tsx',
  'app/delivery/index.tsx',
  'app/edit-profile.tsx',
  'app/emergency-help.tsx',
  'app/notifications.tsx',
  'app/onboarding.tsx',
  'app/onboarding/customer/index.tsx',
  'app/onboarding/shop/basic-details.tsx',
  'app/onboarding/shop/index.tsx',
  'app/order/[id].tsx',
  'app/order/checkout.tsx',
  'app/privacy-security.tsx',
  'app/rewards.tsx',
  'app/shop-alternatives.tsx',
  'app/shop-detail/[id].tsx',
  'app/shop/(tabs)/index.tsx',
  'app/shop/can-management.tsx',
  'app/shop/delivery.tsx',
  'app/shop/inventory-cans.tsx',
  'app/shop/profile.tsx',
  'app/shop/subscription-plans.tsx',
  'app/subscriptions.tsx',
];

let totalFixed = 0;

for (const rel of FILES_WITH_DUPLICATES) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP (not found): ${rel}`);
    continue;
  }

  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // Strategy: inside each component function, remove the SECOND occurrence of
  // `const { colors...isDark... } = useAppTheme();`
  // We do this by scanning line-by-line and removing duplicate useAppTheme() destructuring lines.

  const lines = src.split('\n');
  const seen = new Set();
  const result = [];

  // Track function depth to reset "seen" set when we exit a top-level component.
  // Simple heuristic: reset when we hit `export default function` or `export function` or
  // a top-level `const X = (` pattern (component definition).
  // Instead, we take a simpler approach: remove exact duplicate lines of useAppTheme calls
  // within the SAME declaration block (same indentation level).

  let useAppThemeLinesSeen = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect useAppTheme destructuring
    const isUseAppThemeLine = /const\s+\{[^}]*\}\s*=\s*useAppTheme\(\)/.test(trimmed);

    if (isUseAppThemeLine) {
      // Normalise the line to detect duplicates regardless of whitespace
      const normalised = line.replace(/\s+/g, ' ').trim();
      
      if (useAppThemeLinesSeen.includes(normalised)) {
        // This is a duplicate — skip it
        console.log(`  REMOVED duplicate at ${rel}:${i + 1}: ${trimmed}`);
        totalFixed++;
        continue; // Do not add this line to result
      } else {
        useAppThemeLinesSeen.push(normalised);
      }
    }

    // Reset the seen list when we enter a new top-level export/function
    // (so that two different components in the same file can each have their own useAppTheme call)
    if (
      /^export\s+(default\s+)?(function|const|class)/.test(trimmed) ||
      /^function\s+[A-Z]/.test(trimmed)
    ) {
      useAppThemeLinesSeen = [];
    }

    result.push(line);
  }

  const fixed = result.join('\n');

  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✅ Fixed duplicates in: ${rel}`);
  } else {
    console.log(`   No duplicate useAppTheme found in: ${rel}`);
  }
}

console.log(`\n✅ Done. Removed ${totalFixed} duplicate useAppTheme() declarations.`);
console.log('\nNote: "Cannot find name styles/colors" in sub-components are pre-existing');
console.log('errors from the makeStyles refactor. They need per-file fixes.');
