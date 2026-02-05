import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ct: {
          primary: {
            DEFAULT: '#228B22',
            light: '#48BB78',
            dark: '#196919',
            50: '#F0FFF4',
            100: '#C6F6D5',
            200: '#9AE6B4',
            300: '#68D391',
            400: '#48BB78',
            500: '#228B22',
            600: '#1E7A1E',
            700: '#196919',
            800: '#145214',
            900: '#0F3B0F',
          },
          secondary: {
            DEFAULT: '#1A365D',
            light: '#667EEA',
            dark: '#102A43',
            50: '#EBF8FF',
            100: '#BEE3F8',
            200: '#90CDF4',
            300: '#63B3ED',
            400: '#4299E1',
            500: '#1A365D',
            600: '#153050',
            700: '#102A43',
            800: '#0B1F36',
            900: '#061429',
          },
          sky: '#4299E1',
          gold: '#D4AF37',
          success: '#48BB78',
          warning: '#ECC94B',
          error: '#F56565',
          info: '#4299E1',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-pretendard)',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
      fontSize: {
        'ct-xs': ['0.75rem', { lineHeight: '1.2' }],
        'ct-sm': ['0.875rem', { lineHeight: '1.35' }],
        'ct-md': ['1rem', { lineHeight: '1.5' }],
        'ct-lg': ['1.125rem', { lineHeight: '1.5' }],
        'ct-xl': ['1.25rem', { lineHeight: '1.35' }],
        'ct-2xl': ['1.5rem', { lineHeight: '1.2' }],
        'ct-3xl': ['1.75rem', { lineHeight: '1.2' }],
        'ct-4xl': ['2rem', { lineHeight: '1.2' }],
      },
      borderRadius: {
        'ct-sm': '0.25rem',
        'ct-md': '0.5rem',
        'ct-lg': '0.75rem',
        'ct-xl': '1rem',
        'ct-2xl': '1.5rem',
      },
      boxShadow: {
        'ct-1': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'ct-2': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'ct-3': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'ct-4': '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
        'ct-focus': '0 0 0 3px rgba(34, 139, 34, 0.4)',
        'ct-focus-error': '0 0 0 3px rgba(245, 101, 101, 0.4)',
      },
      zIndex: {
        'dropdown': '100',
        'sticky': '200',
        'fixed': '300',
        'backdrop': '400',
        'modal': '500',
        'popover': '600',
        'toast': '700',
        'tooltip': '800',
      },
      animation: {
        'fade-in': 'fadeIn 250ms ease-out',
        'slide-up': 'slideUp 250ms ease-out',
        'slide-down': 'slideDown 250ms ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
