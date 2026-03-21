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
          dark: '#121212', // Graphite/Charcoal background
          light: '#f5f5f5',
          border: 'rgba(255, 255, 255, 0.1)',
          // Retaining gray scale for monochrome UI baseline
          gray: {
            950: '#0f0f0f',
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
        semantic: {
          sage: '#059669', // emerald-600
          ghost: '#a1a1aa', // zinc-400
          terracotta: '#ea580c', // orange-600
          bio: '#ffffff', // Bioluminescent white
        }
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundColor: {
        'neural-dark': '#121212',
        'neural-gray-900': '#111111',
        'neural-gray-800': '#1a1a1a',
        'neural-gray-700': '#2d2d2d',
      },
      textColor: {
        'neural-light': '#f5f5f5',
      },
      borderColor: {
        'neural-gray-700': '#2d2d2d',
        'neural-border': 'rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-bio': 'pulseBio 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        pulseBio: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' },
        },
        float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
