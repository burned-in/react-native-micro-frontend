import { cliCommandSections, installMatrix } from '../../../src/content.js';
import {
  MatrixTable,
  PageHeader,
  SectionList,
  ShellSection,
} from '../../../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Package managers and CLI commands"
        subtitle="The repository is Bun-first, while consumer projects can install, initialize, integrate, verify, bundle, and publish with Bun, npm, pnpm, Yarn, or Deno."
      />
      <MatrixTable rows={installMatrix} />
      <SectionList sections={cliCommandSections} />
    </ShellSection>
  );
}
