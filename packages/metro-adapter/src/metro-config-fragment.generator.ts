/**
 * Generates a Metro config fragment for MFE bundle aliases.
 *
 * @returns JavaScript text that can be imported from a host Metro config.
 */
export function generateMetroConfigFragment(): string {
  return `// Generated helper for @bunin/react-native-micro-frontend.\n// Keep your existing Metro config and merge this fragment explicitly.\nmodule.exports = {\n  resolver: {\n    unstable_enablePackageExports: true,\n  },\n};\n`;
}
