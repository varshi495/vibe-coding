/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chat: {
          bgDark: '#0b141a',
          cardDark: '#111b21',
          surfaceDark: '#202c33',
          borderDark: '#2a3942',
          bgLight: '#f0f2f5',
          cardLight: '#ffffff',
          surfaceLight: '#f0f2f5',
          borderLight: '#e9edef',
          emerald: '#00a884',
          emeraldHover: '#008f6f',
          teal: '#008069',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
