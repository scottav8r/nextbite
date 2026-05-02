import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#faf8f4',
          100: '#f4ede0',
          200: '#e8d9c0',
          300: '#d9c09a',
        },
        charcoal: {
          700: '#3a3530',
          800: '#2a2520',
          900: '#1a1510',
          950: '#0d0b08',
        },
        burgundy: {
          400: '#c0526a',
          600: '#8b2635',
          800: '#5c1a24',
        },
        gold: {
          200: '#f0dfa0',
          300: '#e8c97a',
          400: '#c9a96e',
          500: '#a8893e',
          600: '#7a6228',
        },
        navy: {
          800: '#0f1623',
          900: '#080e18',
          950: '#040810',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'luxury':    '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'luxury-lg': '0 12px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
        'gold':      '0 4px 20px rgba(201,169,110,0.25)',
        'card':      '0 2px 16px rgba(26,21,16,0.06)',
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #1a1510 0%, #2a2520 100%)',
        'gradient-gold':   'linear-gradient(135deg, #c9a96e 0%, #a8893e 100%)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite',
        'float':   'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
