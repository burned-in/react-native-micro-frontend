import React from "react";
import { PageHeader, SectionList, ShellSection } from "../../../src/ui.js";
import { globalStateSections } from "../../../src/content.js";

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Global state"
        subtitle="Provide a typed host-owned sharedState snapshot and read it safely from every React Native micro frontend."
      />
      <SectionList sections={globalStateSections} />
    </ShellSection>
  );
}
