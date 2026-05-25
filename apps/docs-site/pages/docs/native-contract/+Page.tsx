import { nativeContractSections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Native contract"
        subtitle="A practical explanation of what the native hash means and why unsafe JavaScript updates must be blocked."
      />
      <SectionList sections={nativeContractSections} />
    </ShellSection>
  );
}
