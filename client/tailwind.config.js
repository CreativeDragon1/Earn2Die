/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mc: {
          dark: '#1a1a2e',
          darker: '#16162a',
          card: '#1e1e3a',
          border: '#2d2d5e',
          green: '#55ff55',
          gold: '#ffaa00',
          red: '#ff5555',
          aqua: '#55ffff',
          purple: '#aa00ff',
          blue: '#5555ff',
          yellow: '#ffff55',
          gray: '#aaaaaa',
          white: '#ffffff',
        },
      },
      fontFamily: {
        minecraft: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(85, 255, 85, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(85, 255, 85, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
