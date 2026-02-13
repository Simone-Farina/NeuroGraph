import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neural: {
          dark: '#0a0a0a',
          light: '#f5f5f5',
          cyan: '#06b6d4',
          purple: '#a855f7',
          gray: {
            950: '#0f0f0f', // Slightly lighter than pure black
            900: '#111111',
            800: '#1a1a1a',
            700: '#2d2d2d',
            600: '#404040',
            500: '#525252',
            400: '#737373',
            300: '#a3a3a3',
            200: '#d4d4d4',
            100: '#e5e5e5',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neural-gradient': 'linear-gradient(to right, #06b6d4, #a855f7)',
        'neural-glow': 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, rgba(10, 10, 10, 0) 70%)',
      },
      backgroundColor: {
        'neural-dark': '#0a0a0a',
        'neural-gray-900': '#111111',
        'neural-gray-800': '#1a1a1a',
        'neural-gray-700': '#2d2d2d',
      },
      textColor: {
        'neural-light': '#f5f5f5',
        'neural-cyan': '#06b6d4',
        'neural-purple': '#a855f7',
      },
      borderColor: {
        'neural-gray-700': '#2d2d2d',
        'neural-cyan': '#06b6d4',
        'neural-purple': '#a855f7',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-cyan': 'pulseCyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseCyan: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [],
};

export default config;
