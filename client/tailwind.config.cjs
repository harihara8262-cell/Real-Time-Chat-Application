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
        'dark-bg': ({ opacityValue }) => opacityValue ? `rgba(var(--bg-primary-rgb), ${opacityValue})` : `rgb(var(--bg-primary-rgb))`,
        'dark-surface': ({ opacityValue }) => opacityValue ? `rgba(var(--bg-secondary-rgb), ${opacityValue})` : `rgba(var(--bg-secondary-rgb), 0.7)`,
        'dark-card': ({ opacityValue }) => opacityValue ? `rgba(var(--bg-surface-rgb), ${opacityValue})` : `rgba(var(--bg-surface-rgb), 0.5)`,
        'accent': ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgb(var(--accent-indigo-rgb))`,
        'accent-hover': ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgb(var(--accent-indigo-rgb))`,
        'muted-text': ({ opacityValue }) => opacityValue ? `rgba(var(--text-secondary-rgb), ${opacityValue})` : `rgb(var(--text-secondary-rgb))`,
        'text-primary': 'var(--text-primary)',
        'success-color': '#10B981',
        'warning-color': '#F59E0B',
        'danger-color': '#EF4444',
        'white': ({ opacityValue }) => opacityValue ? `rgba(var(--text-primary-rgb), ${opacityValue})` : `rgb(var(--text-primary-rgb))`,
        'pure-white': '#FFFFFF',
        'indigo': {
          50: ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgba(var(--accent-indigo-rgb), 0.05)`,
          100: ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgba(var(--accent-indigo-rgb), 0.1)`,
          400: ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgba(var(--accent-indigo-rgb), 0.8)`,
          500: ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgb(var(--accent-indigo-rgb))`,
          600: ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgba(var(--accent-indigo-rgb), 0.9)`,
          700: ({ opacityValue }) => opacityValue ? `rgba(var(--accent-indigo-rgb), ${opacityValue})` : `rgba(var(--accent-indigo-rgb), 0.8)`,
        }
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
