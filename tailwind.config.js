/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
        cute: ['"Kiwi Maru"', 'serif'],
      },
      colors: {
        sakura: {
          50: '#fff5f7',
          100: '#ffe3e8',
          200: '#ffc9d2',
          300: '#ff94a5',
          400: '#ff5c77',
          500: '#ff2e51',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
        }
      }
    },
  },
  plugins: [],
}