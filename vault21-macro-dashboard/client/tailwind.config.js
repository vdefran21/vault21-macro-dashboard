/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0a0e17',
          card: '#111827',
          'card-border': '#1e293b',
          red: '#ef4444',
          'red-dim': '#991b1b',
          amber: '#f59e0b',
          'amber-dim': '#92400e',
          green: '#10b981',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          white: '#f1f5f9',
          gray: '#64748b',
          'gray-dark': '#334155',
          gold: '#fbbf24',
        },
      },
      fontFamily: {
        mono: ["'Courier New'", 'monospace'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
