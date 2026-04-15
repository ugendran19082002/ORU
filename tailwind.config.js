/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './providers/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Brand palette (mirrors constants/theme.ts thannigoPalette) ───────
        primary:      '#0077B6',
        secondary:    '#48CAE4',
        tertiary:     '#ADEBF4',
        accent:       '#0096C7',
        background:   '#F5F9FF',
        surface:      '#FFFFFF',
        'dark-text':  '#1A1A2E',
        neutral:      '#74777C',
        success:      '#27AE60',
        warning:      '#E67E22',
        error:        '#C0392B',
        border:       '#E0EAF5',
        'info-soft':  '#E8F4FD',
        'danger-soft':'#FFEBEE',
        'success-soft':'#E8F5E9',

        // ── Role-specific colours ─────────────────────────────────────────────
        customer: {
          DEFAULT: '#1565C0',
          start:   '#005D90',
          end:     '#0077B6',
        },
        shop: {
          DEFAULT: '#006878',
          dark:    '#004E5B',
          start:   '#006878',
          end:     '#008E9B',
        },
        admin: {
          DEFAULT: '#23616B',
          start:   '#23616B',
          end:     '#2D828F',
        },
        delivery: {
          DEFAULT: '#2e7d32',
          start:   '#2e7d32',
          end:     '#388E3C',
        },
        guest: {
          DEFAULT: '#707881',
          start:   '#707881',
          end:     '#94A3B8',
        },
      },

      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        pill: '24px',
      },

      spacing: {
        xxs: '4px',
        xs:  '8px',
        sm:  '12px',
        md:  '16px',
        lg:  '20px',
        xl:  '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
};
