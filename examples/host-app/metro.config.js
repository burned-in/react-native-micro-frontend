const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const { withMfe } = await import('@bunin/react-native-micro-frontend/metro');
  const defaultConfig = getDefaultConfig(__dirname);

  return withMfe(
    __dirname,
    mergeConfig(defaultConfig, {
      // Host-specific Metro options stay here. withMfe reads rnm.registry.json,
      // adds MFE watchFolders, and maps shared packages to host node_modules.
    }),
  );
})();
