/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e1a',
          elev: '#111827',
          card: '#151c2c',
        },
        border: {
          DEFAULT: '#1f2937',
          hover: '#374151',
        },
        primary: {
          DEFAULT: '#00d9a3',
          dim: '#00b386',
        },
        accent: {
          DEFAULT: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
