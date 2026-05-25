import { features, homeSections } from '../src/content.js';
import { FeatureGrid, Hero, SectionList, ShellSection } from '../src/ui.js';

export default function Page() {
  return (
    <ShellSection>
      <Hero
        eyebrow="React Native Micro Frontend"
        title="Native-safe feature modules with a polished OTA workflow."
        subtitle="Ship React Native feature modules independently, verify native binary compatibility, and publish through Hot Updater only when the host can safely load the update."
      />
      <FeatureGrid features={features} />
      <SectionList sections={homeSections} />
    </ShellSection>
  );
}
