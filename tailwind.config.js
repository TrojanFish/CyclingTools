/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        '8.5': '2.125rem',
        '9.5': '2.375rem',
      },
      colors: {
        ios: {
          blue: '#007AFF',
          'blue-dark': '#0A84FF',
          green: '#34C759',
          'green-dark': '#30D158',
          indigo: '#5856D6',
          'indigo-dark': '#5E5CE6',
          orange: '#FF9500',
          'orange-dark': '#FF9F0A',
          pink: '#FF2D55',
          'pink-dark': '#FF375F',
          purple: '#AF52DE',
          'purple-dark': '#BF5AF2',
          red: '#FF3B30',
          'red-dark': '#FF453A',
          teal: '#30B0C7',
          'teal-dark': '#40C8E0',
          yellow: '#FFCC00',
          'yellow-dark': '#FFD60A',
          mint: '#00C7BE',
          'mint-dark': '#63E6E2',
          gray: '#8E8E93',
          'gray2': '#AEAEB2',
          'gray3': '#C7C7CC',
          'gray4': '#D1D1D6',
          'gray5': '#E5E5EA',
          'gray6': '#F2F2F7',
          // Surfaces
          'bg-grouped-light': '#F2F2F7',
          'bg-grouped-dark': '#000000',
          'card-light': '#FFFFFF',
          'card-dark': '#1C1C1E',
          'card-dark-elevated': '#2C2C2E',
          'card-dark-tertiary': '#3A3A3C',
          'separator-light': 'rgba(60, 60, 67, 0.12)',
          'separator-dark': 'rgba(255, 255, 255, 0.10)',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#007AFF',
          600: '#0062cc',
          700: '#004fa3',
          800: '#003e80',
          900: '#002f61',
          accent: '#007AFF'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"SF Pro"',
          'system-ui',
          'Inter',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          'monospace'
        ]
      },
      boxShadow: {
        'ios-sm': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02)',
        'ios-md': '0 4px 16px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'ios-lg': '0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'ios-card': '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(0, 0, 0, 0.06)',
        'ios-popover': '0 20px 48px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
