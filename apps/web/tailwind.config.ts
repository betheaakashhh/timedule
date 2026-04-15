import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEEDFE',
          100: '#CECBF6',
          200: '#AFA9EC',
          400: '#7F77DD',
          600: '#534AB7',
          800: '#3C3489',
          900: '#26215C',
        },
        teal: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041',
          900: '#04342C',
        },
        amber: {
          50:  '#FAEEDA',
          100: '#FAC775',
          200: '#EF9F27',
          400: '#BA7517',
          600: '#854F0B',
          800: '#633806',
          900: '#412402',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
        'safe-left':   'env(safe-area-inset-left)',
        'safe-right':  'env(safe-area-inset-right)',
      },
      height: {
        'screen-dynamic': '100dvh',   // Dynamic viewport height (iOS Safari)
      },
      minHeight: {
        'screen-dynamic': '100dvh',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-in-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'pulse-ring':  'pulseRing 1.5s ease-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'dot-pulse':   'dotPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)',   opacity: '1' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        dotPulse: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(0.85)' },
        },
      },
      screens: {
        'xs':   '375px',
        'sm':   '640px',
        'md':   '768px',
        'lg':   '1024px',
        'xl':   '1280px',
        '2xl':  '1536px',
        // Touch breakpoints
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'mouse': { 'raw': '(hover: hover) and (pointer: fine)' },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.03)',
        'modal':  '0 20px 60px -10px rgba(0,0,0,0.2), 0 4px 16px -4px rgba(0,0,0,0.1)',
        'bottom': '0 -1px 0 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
