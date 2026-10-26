/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0B0D11',
          900: '#12151C',
          850: '#161A23',
          800: '#1E2330',
          700: '#2A3142',
          600: '#3D465E',
          500: '#5A6685',
          400: '#8E9BB5',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
        brand: {
          amber: '#F59E0B',
          amberHover: '#D97706',
          cyan: '#E4D9C4',
          emerald: '#10B981',
          rose: '#F43F5E',
          blue: '#8D877C',
        },
        hud: {
          green: '#22C55E',
          yellow: '#EAB308',
          cyan: '#38BDF8',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(210, 200, 180, 0.08)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'level-flash': 'levelFlash 0.5s ease-in-out',
      },
      keyframes: {
        levelFlash: {
          '0%, 100%': { borderColor: '#10B981' },
          '50%': { borderColor: '#34D399', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
