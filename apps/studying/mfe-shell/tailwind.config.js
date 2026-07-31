const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../mfe-shared/tailwind.preset')],
  content: [
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,html}'),
    path.join(__dirname, '../mfe-shared/**/*.{js,ts,css}'),
  ],
  theme: { extend: {} },
  plugins: [],
};
