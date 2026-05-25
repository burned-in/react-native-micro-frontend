import { optionsSections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Options reference"
        subtitle="Every Host config, MFE config, registry manifest, and runtime option in one place, with the owner file and allowed values explained."
      />
      <SectionList sections={optionsSections} />
    </ShellSection>
  );
}
