import { repackComparisonSections } from '../../../src/content.js';
import { PageHeader, SectionList, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="RNM vs Re.Pack"
        subtitle="A current Re.Pack 5.x comparison: Metro-first native-safety and Host-owned loaders versus Rspack/Webpack Module Federation runtime chunks."
      />
      <SectionList sections={repackComparisonSections} />
    </ShellSection>
  );
}
