/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'flash-green': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(16, 186, 104, 0.3)' },
        },
        'flash-red': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(255, 90, 90, 0.3)' },
        },
        'pulse-green': {
          '0%, 100%': { transform: 'scale(1)', backgroundColor: 'transparent' },
          '50%': { transform: 'scale(1.05)', backgroundColor: 'rgba(16, 186, 104, 0.2)' },
        },
        'pulse-red': {
          '0%, 100%': { transform: 'scale(1)', backgroundColor: 'transparent' },
          '50%': { transform: 'scale(1.05)', backgroundColor: 'rgba(255, 90, 90, 0.2)' },
        },
      },
      animation: {
        'flash-green': 'flash-green 0.6s ease-in-out',
        'flash-red': 'flash-red 0.6s ease-in-out',
        'pulse-green': 'pulse-green 0.4s ease-in-out',
        'pulse-red': 'pulse-red 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
