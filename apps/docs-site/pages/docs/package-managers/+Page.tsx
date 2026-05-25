import { installMatrix } from '../../../src/content.js';
import { MatrixTable, PageHeader, ShellSection } from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Package manager matrix"
        subtitle="The repository is Bun-first, while consumer projects can install, initialize, and publish with Bun, npm, pnpm, Yarn, or Deno."
      />
      <MatrixTable rows={installMatrix} />
    </ShellSection>
  );
}
