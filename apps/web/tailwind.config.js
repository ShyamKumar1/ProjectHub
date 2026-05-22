const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/*.{ts,tsx}'),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Landa Design System Tokens ──────────────────────
      colors: {
        // Primary accent (teal)
        accent: {
          50: '#e6faf4',
          100: '#b3f0db',
          200: '#80e6c2',
          300: '#4ddba9',
          400: '#26d194',
          500: '#09bc8a',
          600: '#089e73',
          700: '#06805c',
          800: '#056245',
          900: '#03442e',
          DEFAULT: '#09bc8a',
        },
        // Secondary accent (light teal)
        'accent-light': {
          DEFAULT: '#69ecbf',
          50: '#e8fcf3',
          100: '#c2f5e0',
          200: '#69ecbf',
          300: '#3ce5ad',
          400: '#1cdd9c',
          500: '#14c48a',
        },
        // Dark theme backgrounds
        dark: {
          50: '#f4f7f5',
          100: '#d5ddd9',
          200: '#b3c0b8',
          300: '#8da39a',
          400: '#6a867a',
          500: '#4d6a5d',
          600: '#354e43',
          700: '#1f332b',
          800: '#010907',
          900: '#000403',
          DEFAULT: '#010907',
        },
        // Neutral light
        neutral: {
          50: '#ffffff',
          100: '#f4f7f5',
          200: '#e8ede9',
          300: '#d5ddd9',
          400: '#b3c0b8',
          DEFAULT: '#f4f7f5',
        },
        // Semantic
        success: '#eac66a',
        warning: '#eb7644',
        info: '#4592ed',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
        display: ['Clash Display', 'Inter Display', 'serif'],
      },
      fontSize: {
        // Landa type scale
        'h1': ['72px', { lineHeight: '80px', letterSpacing: '-1.44px', fontWeight: '400' }],
        'h2': ['56px', { lineHeight: '64px', letterSpacing: '-1.12px', fontWeight: '400' }],
        'h3': ['32px', { lineHeight: '40px', letterSpacing: '-0.64px', fontWeight: '400' }],
        'h4': ['24px', { lineHeight: '28px', letterSpacing: '-0.24px', fontWeight: '400' }],
        'h5': ['20px', { lineHeight: '28px', letterSpacing: '-0.2px', fontWeight: '400' }],
        'h6': ['18px', { lineHeight: '28px', letterSpacing: '-0.18px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', letterSpacing: '-0.16px', fontWeight: '400' }],
        'sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.14px', fontWeight: '400' }],
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '-0.12px', fontWeight: '400' }],
      },
      spacing: {
        '4xs': '1px',
        '3xs': '4px',
        '2xs': '5px',
        'xs': '6px',
        'sm': '7px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '14px',
        '3xl': '15px',
        '4xl': '16px',
        '5xl': '18px',
      },
      borderRadius: {
        'sm': '5px',
        'md': '8px',
        'lg': '15px',
        'xl': '24px',
        '2xl': '40px',
        'pill': '999px',
      },
      boxShadow: {
        'xs': 'rgba(0, 0, 0, 0.05) 0px 10px 20px',
        'sm': 'rgba(0, 0, 0, 0.1) 0px 2px 4px 0px, rgba(0, 0, 0, 0.05) 0px 1px 0px 0px, rgba(255, 255, 255, 0.15) 0px 0px 0px 1px',
        'md': 'rgba(105, 236, 191, 0.04) 0px 12px 32px 0px inset, rgba(105, 236, 191, 0.08) 0px 0px 12px 0px inset, rgba(105, 236, 191, 0.04) 0px 0px 8px 0px inset, rgba(105, 236, 191, 0.16) 0px 1px 1px 0px inset',
        'glow': '0 0 20px rgba(9, 188, 138, 0.15)',
        'glow-lg': '0 0 40px rgba(9, 188, 138, 0.1)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.44, 0, 0.56, 1)',
      },
      transitionDuration: {
        '450': '450ms',
      },
      screens: {
        'md': '810px',
        'lg': '1199px',
        'xl': '1440px',
      },
      keyframes: {
        'streak-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'streak-pulse': 'streak-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
