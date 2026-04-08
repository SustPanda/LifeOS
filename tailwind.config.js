/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#111111',
        'bg-light': '#f9f9f9',
        'card-dark': '#1c1c1c',
        'card-light': '#ffffff',
        accent: '#f59e0b',
        'accent-soft': '#fbbf24',
        'text-dark': '#f5f5f5',
        'text-light': '#111827',
      },
    },
  },
  plugins: [],
}
