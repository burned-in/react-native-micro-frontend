import type { NativePodDependency } from '@bunin/react-native-micro-frontend';

/**
 * Parses CocoaPods dependencies from Podfile.lock text.
 *
 * This parser is conservative and only extracts top-level PODS entries. It has
 * no filesystem side effects.
 *
 * @param text Podfile.lock contents.
 * @returns Pod dependencies sorted by name.
 */
export function parsePodfileLock(text: string): readonly NativePodDependency[] {
  const pods: NativePodDependency[] = [];
  let inPods = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === 'PODS:') {
      inPods = true;
      continue;
    }
    if (inPods && /^[A-Z][A-Z0-9 _-]+:/.test(line)) break;
    const match = /^ {2}- ([^\s(]+)(?: \(([^)]+)\))?:?$/.exec(line);
    if (inPods && match) {
      const name = match[1] ?? '';
      const version = match[2];
      pods.push(
        version ? { name, version, required: true } : { name, required: true },
      );
    }
  }
  return pods
    .filter((pod) => pod.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}
