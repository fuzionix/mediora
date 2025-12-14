/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
      },
      colors: {
        accent: {
          50: '#ffefc3',
          100: '#ffe6a5',
          200: '#ffde87',
          300: '#ffd767',
          400: '#ffcf43',
          500: '#fdc700',
          600: '#d5a810',
          700: '#ae8a16',
          800: '#896d17',
          900: '#665116',
          950: '#443713',
        },
      },
      backgroundColor: {
        primary: '#ffffff',
        secondary: '#f8f8f8',
        dark: '#000000',
      },
      textColor: {
        primary: '#000000',
        secondary: '#484848',
        light: '#ffffff',
      },
    },
  },
  plugins: [],
}