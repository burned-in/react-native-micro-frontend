import type {
  NativeGradleDependency,
  NativeGradleProject,
} from '@bunin/react-native-micro-frontend';

/**
 * Parses Gradle project includes from settings.gradle text.
 *
 * @param text settings.gradle or settings.gradle.kts contents.
 * @returns Gradle projects sorted by name.
 */
export function parseGradleProjects(
  text: string,
): readonly NativeGradleProject[] {
  const projects = new Map<string, NativeGradleProject>();
  const includeRegex = /include\s*(?:\(?\s*)["']:?([^"')]+)["']/g;
  for (const match of text.matchAll(includeRegex)) {
    const name = match[1];
    if (name) projects.set(name, { name, required: true });
  }
  return [...projects.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Parses Gradle dependency notations from build.gradle text.
 *
 * @param text build.gradle or build.gradle.kts contents.
 * @returns Native Gradle dependency notations sorted by configuration and notation.
 */
export function parseGradleDependencies(
  text: string,
): readonly NativeGradleDependency[] {
  const dependencies: NativeGradleDependency[] = [];
  const regex =
    /\b(implementation|api|compileOnly|runtimeOnly)\s*(?:\(?\s*)["']([^"']+)["']/g;
  for (const match of text.matchAll(regex)) {
    const configuration = match[1];
    const notation = match[2];
    if (configuration && notation)
      dependencies.push({ configuration, notation });
  }
  return dependencies.sort((a, b) =>
    `${a.configuration}:${a.notation}`.localeCompare(
      `${b.configuration}:${b.notation}`,
    ),
  );
}
