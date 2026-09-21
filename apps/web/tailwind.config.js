/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-elevated': '#f1f5f9',
        'surface-highlight': '#e2e8f0',
        primary: {
          50: '#effdf5',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00b074', // JobEntry Primary Emerald
          600: '#009a65',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        brand: {
          dark: '#2b3940', // JobEntry Slate Dark
          navy: '#1e293b',
          light: '#effdf5',
          accent: '#2b9bff',
        },
        accent: {
          blue: '#2b9bff',
          purple: '#8b5cf6',
          emerald: '#00b074',
          amber: '#f59e0b',
          rose: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 0 45px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'job-item': '0 2px 15px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
