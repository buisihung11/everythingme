/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          muted: '#94a3b8',
          accent: '#38bdf8',
          success: '#34d399',
          warning: '#fbbf24',
          danger: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(({ addBase, addComponents }) => {
      addBase({
        body: {
          backgroundColor: '#0f172a',
          color: '#f1f5f9',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      });
      addComponents({
        '.mfe-card': {
          borderRadius: '0.75rem',
          borderWidth: '1px',
          borderColor: '#334155',
          backgroundColor: '#1e293b',
          padding: '1.25rem',
          boxShadow:
            '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
        '.mfe-badge': {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.mfe-btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          transitionProperty: 'color, background-color, border-color',
          transitionDuration: '150ms',
        },
        '.mfe-btn-primary': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          backgroundColor: '#0ea5e9',
          color: '#ffffff',
        },
        '.mfe-btn-primary:hover': {
          backgroundColor: '#38bdf8',
        },
        '.mfe-concept-tag': {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: 'rgb(14 165 233 / 0.2)',
          color: '#7dd3fc',
          boxShadow: 'inset 0 0 0 1px rgb(14 165 233 / 0.3)',
        },
      });
    }),
  ],
};
