import type { IntegrationPlan } from "../integration-plan.generator.js";

/**
 * Generates a manual integration guide from an integration plan.
 *
 * @param plan Integration plan.
 * @returns Markdown guide suitable for docs/rnm-integration-guide.md.
 */
export function generateManualIntegrationGuide(plan: IntegrationPlan): string {
  return `# @bunin/react-native-micro-frontend Manual Integration Guide\n\n## Summary\n\n${plan.summary.map((line) => `- ${line}`).join("\n")}\n\n## Generated files\n\n${plan.changes.map((change) => `- \`${change.path}\`: ${change.reason}`).join("\n")}\n\n## Native include snippets\n\n### iOS Podfile\n\n\`\`\`rb\nrequire_relative './Podfile.rnm.generated'\n\`\`\`\n\n### Android settings.gradle\n\n\`\`\`gradle\napply from: file("rnm.settings.generated.gradle")\n\`\`\`\n\n### Android app/build.gradle\n\n\`\`\`gradle\napply from: file("rnm.generated.gradle")\n\`\`\`\n\n## Warnings\n\n${plan.warnings.length === 0 ? "- None" : plan.warnings.map((warning) => `- ${warning}`).join("\n")}\n`;
}
