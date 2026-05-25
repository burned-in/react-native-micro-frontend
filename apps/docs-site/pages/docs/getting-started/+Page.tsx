import { gettingStartedSections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Getting started"
        subtitle="Install the packages, declare host policy, register the first feature module, verify native safety, and load it through the runtime provider."
      />
      <SectionList sections={gettingStartedSections} />
    </ShellSection>
  );
}
