/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coffee theme colors
        coffee: {
          dark: '#2c1e1a',
          medium: '#4a2c2a',
          light: '#6b4423',
          cream: '#d4a574',
          milk: '#f5e6d3',
        },
        // Custom accent colors
        primary: {
          50: '#fef7f0',
          100: '#fdf2e8',
          200: '#f9e4d0',
          300: '#f3d1b0',
          400: '#e8b888',
          500: '#d69c60',
          600: '#be8040',
          700: '#9f6530',
          800: '#7f5028',
          900: '#654321',
          950: '#2c1e1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'pulse-strong': 'pulseStrong 1.5s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        'confetti-fall': 'confettiFall 2s ease-out infinite',
        'coffee-steam': 'coffeeSteam 2s ease-out infinite',
        'glitter': 'glitter 2s ease-in-out infinite',
        'number-roll': 'numberRoll 0.5s ease-out',
        'skeleton-loading': 'skeletonLoading 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseStrong: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100px) rotate(360deg)', opacity: '0' },
        },
        coffeeSteam: {
          '0%': { opacity: '0.3', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.6', transform: 'translateY(-10px) scale(1.2)' },
          '100%': { opacity: '0', transform: 'translateY(-20px) scale(1.5)' },
        },
        glitter: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
        },
        numberRoll: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        skeletonLoading: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      boxShadow: {
        'coffee': '0 4px 6px -1px rgba(44, 30, 26, 0.1), 0 2px 4px -1px rgba(44, 30, 26, 0.06)',
        'coffee-lg': '0 10px 15px -3px rgba(44, 30, 26, 0.1), 0 4px 6px -2px rgba(44, 30, 26, 0.05)',
        'coffee-xl': '0 20px 25px -5px rgba(44, 30, 26, 0.1), 0 10px 10px -5px rgba(44, 30, 26, 0.04)',
      },
      backgroundImage: {
        'coffee-bean': "radial-gradient(circle at 25% 25%, #6b4423 2px, transparent 2px), radial-gradient(circle at 75% 75%, #6b4423 2px, transparent 2px)",
        'gradient-coffee': 'linear-gradient(135deg, #2c1e1a 0%, #4a2c2a 50%, #6b4423 100%)',
      },
      backgroundSize: {
        'coffee-pattern': '40px 40px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
