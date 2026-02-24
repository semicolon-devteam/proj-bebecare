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
        // Brand Colors
        'dusty-rose': {
          50: '#FFF0F3',
          100: '#FFE0E8',
          200: '#FFC0D1',
          300: '#FFA0BA',
          400: '#E189A3',
          500: '#C2728A', // Primary
          600: '#A85C73',
          700: '#8D465C',
          800: '#6B3A4A',
          900: '#4A2833',
        },
        'sage': {
          50: '#F0F7F1',
          100: '#D9EBE0',
          200: '#B3D7C1',
          300: '#8DC3A2',
          400: '#7C9A82', // Secondary
          500: '#6B8672',
          600: '#5A7262',
          700: '#495E52',
          800: '#384A42',
          900: '#273632',
        },
        // Surface Colors
        'surface-warm': '#FFF9F5',
        'surface': '#FEF7F2',
        'border': '#F0E6E0',
        // Semantic Colors (keep existing)
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      spacing: {
        // 4px grid system (default Tailwind already has this, just documenting)
      },
      borderRadius: {
        'button': '0.75rem',
        'input': '0.75rem',
        'card': '1.25rem',
        'modal': '1.5rem',
      },
      boxShadow: {
        // Warm shadows (brand color tint)
        'warm-sm': '0 1px 4px rgba(194, 114, 138, 0.04)',
        'warm': '0 2px 8px rgba(194, 114, 138, 0.06)',
        'warm-md': '0 4px 16px rgba(194, 114, 138, 0.08)',
        'warm-lg': '0 8px 24px rgba(194, 114, 138, 0.10)',
        'warm-xl': '0 12px 32px rgba(194, 114, 138, 0.12)',
      },
      transitionDuration: {
        'fast': '150ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 200ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 300ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
      },
    },
  },
  plugins: [
    // Custom plugin for common patterns
    function ({ addComponents, theme }: any) {
      addComponents({
        // Base card style
        '.card': {
          backgroundColor: '#FFFFFF',
          border: `1px solid ${theme('colors.border')}`,
          borderRadius: theme('borderRadius.card'),
          boxShadow: theme('boxShadow.warm'),
          transition: 'box-shadow 200ms ease, transform 200ms ease',
        },
        '.card:hover': {
          boxShadow: theme('boxShadow.warm-md'),
          transform: 'scale(1.005)',
        },
        // Scrollbar hide
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
        // Focus visible (accessibility)
        '*:focus-visible': {
          outline: `2px solid ${theme('colors.dusty-rose.500')}`,
          outlineOffset: '2px',
        },
        '*:focus:not(:focus-visible)': {
          outline: 'none',
        },
        // Gradients (common patterns)
        '.bg-gradient-landing': {
          background: 'linear-gradient(180deg, #FFF9F5 0%, #FEF0E8 100%)',
        },
        '.bg-gradient-card': {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F0 100%)',
        },
        '.bg-gradient-cta': {
          background: 'linear-gradient(135deg, #C2728A 0%, #D4A0B0 100%)',
        },
        '.bg-gradient-profile': {
          background: 'linear-gradient(135deg, #FFF0F3 0%, #F0F7F1 100%)',
        },
        '.nav-blur': {
          backgroundColor: 'rgba(255, 249, 245, 0.95)',
          backdropFilter: 'blur(8px)',
        },
      });
    },
  ],
};

export default config;
