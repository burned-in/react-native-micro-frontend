import React from "react";
import { css } from "../../styled-system/css";
import { grid, stack } from "../../styled-system/patterns";
import { PageHeader, SectionList, ShellSection } from "../../src/ui.js";
import { docsSections } from "../../src/content.js";
import { withSiteBase } from "../../src/site-base.js";

const guideCards = [
  { title: "Hot Updater setup", href: "/docs/hot-updater", body: "Configure the adapter, verify OTA eligibility, then deploy safely." },
  { title: "Package managers", href: "/docs/package-managers", body: "Run the same workflow with Bun, npm, pnpm, Yarn, or Deno." },
  { title: "Native contract", href: "/docs/native-contract", body: "Understand what changes require a store release." },
];

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Start here: from install to a verified first module."
        subtitle="Use this guide when you are integrating the library for the first time. It explains the minimum host setup, module registration, runtime loading, and host-provided shared state."
      />
      <section className={grid({ columns: { base: 1, md: 3 }, gap: "5" })}>
        {guideCards.map((card) => (
          <a
            key={card.href}
            href={withSiteBase(card.href)}
            className={css({
              display: "block",
              rounded: "3xl",
              borderWidth: "1px",
              borderColor: "line",
              bg: "surface",
              shadow: "card",
              p: "6",
              transition: "all 160ms ease",
              _hover: { transform: "translateY(-3px)", borderColor: "accent" },
            })}
          >
            <div className={stack({ gap: "3" })}>
              <h2 className={css({ m: "0", fontSize: "xl", letterSpacing: "-0.02em" })}>{card.title}</h2>
              <p className={css({ m: "0", color: "page.muted", lineHeight: "1.7" })}>{card.body}</p>
            </div>
          </a>
        ))}
      </section>
      <SectionList sections={docsSections} />
    </ShellSection>
  );
}
