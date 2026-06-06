/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0F172A',
        'dark-surface': '#111827',
        'dark-card': '#1E293B',
        'accent': '#6366F1',
        'accent-hover': '#4F46E5',
        'muted-text': '#94A3B8',
        'success-color': '#10B981',
        'warning-color': '#F59E0B',
        'danger-color': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
