import React from "react";
import { PageHeader, SectionList, ShellSection } from "../../../src/ui.js";
import { hotUpdaterSections } from "../../../src/content.js";

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Hot Updater setup"
        subtitle="A routed guide for adding native-safety checks in front of Hot Updater without replacing the OTA engine your team already uses."
      />
      <SectionList sections={hotUpdaterSections} />
    </ShellSection>
  );
}
