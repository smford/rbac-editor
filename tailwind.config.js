/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"GDS Transport"', 'Arial', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        govuk: {
          blue: '#1d70b8',
          'blue-dark': '#003078',
          'blue-tint': '#bbd4ea',
          black: '#0b0c0c',
          white: '#ffffff',
          grey: '#f3f2f1',
          'grey-dark': '#b1b4b6',
          'grey-border': '#b1b4b6',
          'text-secondary': '#505a5f',
          green: '#00703c',
          'green-dark': '#002d18',
          'green-hover': '#005a30',
          'green-tint': '#cce2d8',
          red: '#d4351c',
          'red-dark': '#55150b',
          'red-hover': '#aa2a16',
          'red-tint': '#f4c0b8',
          yellow: '#ffdd00',
          'yellow-tint': '#fff7bf',
          purple: '#4c2c92',
          'purple-tint': '#dbd5e9',
          turquoise: '#28a197',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      }
    },
  },
  plugins: [],
}
