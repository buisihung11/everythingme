module.exports = {
  plugins: [
    require('tailwindcss')({ config: require('path').join(__dirname, 'tailwind.config.js') }),
    require('autoprefixer'),
  ],
};
