import { metroBundleSections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Metro / Bundle archive"
        subtitle="Merge Metro with withMfe, then load portable rnm bundle archives through the Host-owned loadBundleArchive boundary."
      />
      <SectionList sections={metroBundleSections} />
    </ShellSection>
  );
}
