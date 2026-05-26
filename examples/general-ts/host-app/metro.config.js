const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const { withMfe } = await import('@bunin/react-native-micro-frontend/metro');
  const defaultConfig = getDefaultConfig(__dirname);

  return withMfe(
    __dirname,
    mergeConfig(defaultConfig, {
      // General TS mode: withMfe reads rnm.registry.json, watches the local MFE
      // root, and keeps shared dependencies resolved from the Host app.
    }),
  );
})();
