import { easyWaySections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Easy Way"
        subtitle="Choose exactly one path for your project: Generic for local TypeScript-module style, Bundle for portable archives without OTA publish, or OTA for Hot Updater/custom remote delivery."
      />
      <SectionList sections={easyWaySections} />
    </ShellSection>
  );
}
