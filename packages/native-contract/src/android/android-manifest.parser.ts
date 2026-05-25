/**
 * Extracts Android permissions from AndroidManifest.xml text.
 *
 * @param text Android manifest XML.
 * @returns Unique permission names sorted alphabetically.
 */
export function parseAndroidManifestPermissions(text: string): readonly string[] {
  const permissions = new Set<string>();
  const regex = /<uses-permission[^>]+android:name=["']([^"']+)["'][^>]*>/g;
  for (const match of text.matchAll(regex)) {
    const permission = match[1];
    if (permission) permissions.add(permission);
  }
  return [...permissions].sort();
}
