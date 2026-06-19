/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1A3C8B',
          'primary-hover': '#142E6E',
          secondary: '#0EA5A0',
          'secondary-hover': '#0B8C87',
          gold: '#C0973A',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F6F9FF',
          tertiary: '#EEF3FC',
          card: '#FFFFFF',
        },
        heading: '#0C1B33',
        body: '#374151',
        muted: '#6B7280',
        disabled: '#9CA3AF',
        border: {
          DEFAULT: '#E5EAF2',
          focus: '#1A3C8B',
          light: '#F1F5FD',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
          info: '#2563EB',
        },
        overlay: {
          dark: 'rgba(12, 27, 51, 0.5)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['72px', { lineHeight: '1.1', fontWeight: '700' }],
        'display-xl': ['56px', { lineHeight: '1.15', fontWeight: '600' }],
        'display-lg': ['44px', { lineHeight: '1.2', fontWeight: '600' }],
        h1: ['36px', { lineHeight: '1.25', fontWeight: '700' }],
        h2: ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '1.4', fontWeight: '600' }],
        h4: ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '1.7', fontWeight: '400' }],
        body: ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(26,60,139,0.06), 0 8px 24px rgba(26,60,139,0.08)',
        hover: '0 4px 6px rgba(26,60,139,0.05), 0 20px 40px rgba(26,60,139,0.12)',
        deep: '0 25px 50px rgba(26,60,139,0.15)',
      },
      animation: {
        'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
