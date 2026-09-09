module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // reanimated MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
