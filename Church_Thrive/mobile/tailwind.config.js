/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
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
        sans: ['Pretendard', 'System'],
      },
    },
  },
  plugins: [],
};
