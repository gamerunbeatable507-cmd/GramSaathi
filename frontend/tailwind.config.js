/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        triage: {
          red: '#dc2626',
          'red-light': '#fef2f2',
          'red-dark': '#991b1b',
          yellow: '#d97706',
          'yellow-light': '#fffbeb',
          'yellow-dark': '#92400e',
          green: '#16a34a',
          'green-light': '#f0fdf4',
          'green-dark': '#166534',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          900: '#134e4a'
        }
      }
    },
  },
  plugins: [],
}
