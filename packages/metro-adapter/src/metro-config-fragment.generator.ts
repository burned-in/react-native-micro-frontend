/**
 * Generates a Metro config fragment for MFE bundle aliases.
 *
 * @returns JavaScript text that can be imported from a host Metro config.
 */
export function generateMetroConfigFragment(): string {
  return `// Generated helper for @bunin/react-native-micro-frontend.\n// Keep your existing Metro config and merge this fragment explicitly.\nmodule.exports = {\n  resolver: {\n    unstable_enablePackageExports: true,\n  },\n};\n`;
}

/**
 * Generates an inspectable Metro config snippet that enables automatic MFE
 * watchFolders and host singleton extraNodeModules.
 *
 * @returns JavaScript text that can be adapted into metro.config.js.
 */
export function generateAutoMetroConfigSnippet(): string {
  return `const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");\n\nmodule.exports = (async () => {\n  const { withMfe } = await import(\n    "@bunin/react-native-micro-frontend/metro"\n  );\n\n  const defaultConfig = getDefaultConfig(__dirname);\n  const config = mergeConfig(defaultConfig, {\n    // Keep your existing Metro options here.\n  });\n\n  return withMfe(__dirname, config);\n})();\n`;
}
