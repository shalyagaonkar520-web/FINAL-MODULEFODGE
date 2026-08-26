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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gold: {
          50: '#fffdf5',
          100: '#fef9e7',
          200: '#fdf0c5',
          300: '#fbe29a',
          400: '#f7ce65',
          500: '#f59e0b', // Imperial Gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        primary: {
          DEFAULT: "#eab308", // Radiant Gold
          foreground: "#000000",
          50: '#fffdf0',
          100: '#fefbe0',
          200: '#fcf4b8',
          300: '#fae985',
          400: '#f6d84f',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        dark: {
          bg: "#040404",
          surface: "#0a0a0a",
          card: "#0f0f0f",
          border: "#262217",
          hover: "#181611",
          sidebar: "#080808"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gold-glow': 'goldGlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        goldGlow: {
          '0%': { boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.45)' },
        }
      }
    },
  },
  plugins: [],
}
