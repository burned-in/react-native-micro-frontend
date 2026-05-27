import { easyWaySections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Easy Way"
        subtitle="Choose exactly one path for your project: Bundle for portable archives, Hot Updater/custom OTA for remote delivery, or Expo EAS Update."
      />
      <SectionList sections={easyWaySections} />
    </ShellSection>
  );
}
