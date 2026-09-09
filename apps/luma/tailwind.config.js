/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Luma dark aesthetic
        background: '#0A0A0B',
        surface: '#141415',
        'surface-elevated': '#1C1C1E',
        border: 'rgba(255,255,255,0.08)',
        accent: '#FF6B35',
        'accent-muted': 'rgba(255,107,53,0.12)',
        'text-primary': '#FFFFFF',
        'text-secondary': 'rgba(255,255,255,0.6)',
        'text-tertiary': 'rgba(255,255,255,0.35)',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
