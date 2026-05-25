import React from "react";
import { css, cx } from "../styled-system/css";
import { grid, hstack, stack, wrap } from "../styled-system/patterns";
import type { DocSection, Feature } from "./content.js";
import { ModuleNetworkScene } from "./ModuleNetworkScene.js";
import { withSiteBase } from "./site-base.js";

export function Badge({ children }: { readonly children: React.ReactNode }) {
  return (
    <span
      className={css({
        display: "inline-flex",
        alignItems: "center",
        gap: "2",
        rounded: "full",
        borderWidth: "1px",
        borderColor: "line",
        bg: "accent.soft",
        color: "accent",
        px: "3",
        py: "1.5",
        fontSize: "sm",
        lineHeight: "1",
        fontWeight: "700",
        whiteSpace: "nowrap",
        maxW: "full",
        w: "fit-content",
        alignSelf: "flex-start",
      })}
    >
      {children}
    </span>
  );
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta = { label: "Read the docs", href: "/docs" },
  secondaryCta = { label: "Package manager matrix", href: "/docs/package-managers" },
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly primaryCta?: { readonly label: string; readonly href: string };
  readonly secondaryCta?: { readonly label: string; readonly href: string };
}) {
  return (
    <section
      className={css({
        position: "relative",
        overflow: "hidden",
        rounded: "3xl",
        borderWidth: "1px",
        borderColor: "line",
        bg: "surface",
        shadow: "card",
        isolation: "isolate",
        minH: { base: "620px", md: "auto" },
        px: { base: "5", sm: "6", md: "12" },
        pt: { base: "10", md: "20" },
        pb: { base: "24", md: "20" },
      })}
    >
      <ModuleNetworkScene />
      <div
        className={css({
          position: "absolute",
          zIndex: "0",
          inset: "-40% auto auto 40%",
          w: "560px",
          h: "560px",
          rounded: "full",
          bg: "radial-gradient(circle, rgba(103,232,249,0.34), rgba(139,92,246,0.12), transparent 68%)",
          filter: "blur(8px)",
          pointerEvents: "none",
        })}
      />
      <div className={stack({ gap: "8", position: "relative", zIndex: "2", maxW: { base: "4xl", lg: "700px" } })}>
        <Badge>{eyebrow}</Badge>
        <div className={stack({ gap: "5" })}>
          <h1
            className={css({
              m: "0",
              maxW: "920px",
              fontSize: { base: "4xl", sm: "5xl", md: "6xl" },
              lineHeight: { base: "1", md: "0.95" },
              letterSpacing: "-0.06em",
            })}
          >
            {title}
          </h1>
          <p
            className={css({
              m: "0",
              maxW: "760px",
              color: "page.muted",
              fontSize: { base: "lg", md: "xl" },
              lineHeight: "1.8",
            })}
          >
            {subtitle}
          </p>
        </div>
        <div className={wrap({ gap: "3" })}>
          <a className={button({ tone: "primary" })} href={withSiteBase(primaryCta.href)}>
            {primaryCta.label}
          </a>
          <a className={button({ tone: "ghost" })} href={withSiteBase(secondaryCta.href)}>
            {secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid({ features }: { readonly features: readonly Feature[] }) {
  return (
    <section className={grid({ columns: { base: 1, md: 2, xl: 3 }, gap: "5" })}>
      {features.map((feature) => (
        <article key={feature.title} className={card()}>
          <h3 className={heading3()}>{feature.title}</h3>
          <p className={bodyText()}>{feature.body}</p>
        </article>
      ))}
    </section>
  );
}

export function SectionList({ sections }: { readonly sections: readonly DocSection[] }) {
  return (
    <div className={stack({ gap: "6" })}>
      {sections.map((section) => (
        <DocBlock key={section.title} section={section} />
      ))}
    </div>
  );
}

export function DocBlock({ section }: { readonly section: DocSection }) {
  return (
    <section className={cx(card(), css({ p: { base: "6", md: "8" } }))}>
      <div className={grid({ columns: { base: 1, lg: section.code ? 2 : 1 }, gap: "8", alignItems: "start" })}>
        <div className={stack({ gap: "4" })}>
          {section.eyebrow ? <Badge>{section.eyebrow}</Badge> : null}
          <h2 className={heading2()}>{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className={bodyText()}>
              {paragraph}
            </p>
          ))}
        </div>
        {section.code ? <CodeBlock code={section.code} /> : null}
      </div>
    </section>
  );
}

export function CodeBlock({ code }: { readonly code: string }) {
  return (
    <pre
      className={css({
        m: "0",
        overflowX: "auto",
        rounded: "2xl",
        borderWidth: "1px",
        borderColor: "line",
        bg: { base: "ink.950", _dark: "rgba(2,6,23,0.92)" },
        color: "ink.50",
        maxW: "100%",
        p: { base: "4", md: "5" },
        fontFamily: "mono",
        fontSize: { base: "xs", md: "sm" },
        lineHeight: "1.8",
      })}
    >
      <code>{code}</code>
    </pre>
  );
}

export function MatrixTable({
  rows,
  headers = ["Tool", "Runtime install", "CLI install", "Run once", "Publish"],
}: {
  readonly rows: readonly {
    readonly tool: string;
    readonly runtime: string;
    readonly cli: string;
    readonly run: string;
    readonly release: string;
  }[];
  readonly headers?: readonly [string, string, string, string, string];
}) {
  return (
    <div className={css({ overflowX: "auto", rounded: "2xl", borderWidth: "1px", borderColor: "line" })}>
      <table className={css({ w: "full", borderCollapse: "collapse", minW: "960px", bg: "surface" })}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className={tableHead()}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.tool}>
              <td className={tableCell({ strong: true })}>{row.tool}</td>
              <td className={tableCell()}><code>{row.runtime}</code></td>
              <td className={tableCell()}><code>{row.cli}</code></td>
              <td className={tableCell()}><code>{row.run}</code></td>
              <td className={tableCell()}><code>{row.release}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LanguageCard({ title, subtitle, bullets }: { readonly title: string; readonly subtitle: string; readonly bullets: readonly string[] }) {
  return (
    <section className={card()}>
      <div className={stack({ gap: "5" })}>
        <Badge>Localized guide</Badge>
        <h1 className={heading2()}>{title}</h1>
        <p className={bodyText()}>{subtitle}</p>
        <ul className={stack({ gap: "3", pl: "5", color: "page.muted", lineHeight: "1.8" })}>
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow = "Documentation",
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly eyebrow?: string;
}) {
  return (
    <header className={stack({ gap: "4", maxW: "4xl" })}>
      <Badge>{eyebrow}</Badge>
      <h1 className={heading1()}>{title}</h1>
      <p className={bodyLead()}>{subtitle}</p>
    </header>
  );
}

export function ShellSection({ children }: { readonly children: React.ReactNode }) {
  return <main className={stack({ gap: "10" })}>{children}</main>;
}

const button = (props: { readonly tone: "primary" | "ghost" }) => css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  rounded: "full",
  w: { base: "full", sm: "auto" },
  px: "5",
  py: "3",
  fontWeight: "800",
  borderWidth: "1px",
  borderColor: props.tone === "primary" ? "transparent" : "line",
  bg: props.tone === "primary" ? "page.fg" : "surface.subtle",
  color: props.tone === "primary" ? "page.bg" : "page.fg",
  transition: "all 160ms ease",
  _hover: {
    transform: "translateY(-2px)",
    shadow: "card",
  },
});

const card = () => css({
  minW: "0",
  rounded: "3xl",
  borderWidth: "1px",
  borderColor: "line",
  bg: "surface",
  shadow: "card",
  p: "6",
});

const heading1 = () => css({
  m: "0",
  fontSize: { base: "3xl", sm: "4xl", md: "5xl" },
  lineHeight: "1",
  letterSpacing: "-0.05em",
});

const heading2 = () => css({
  m: "0",
  fontSize: { base: "2xl", sm: "3xl", md: "4xl" },
  lineHeight: "1.05",
  letterSpacing: "-0.04em",
});

const heading3 = () => css({
  m: "0",
  fontSize: "xl",
  lineHeight: "1.2",
  letterSpacing: "-0.02em",
});

const bodyLead = () => css({
  m: "0",
  maxW: "760px",
  color: "page.muted",
  fontSize: { base: "lg", md: "xl" },
  lineHeight: "1.8",
});

const bodyText = () => css({
  m: "0",
  color: "page.muted",
  fontSize: "md",
  lineHeight: "1.8",
});

const tableHead = () => css({
  textAlign: "left",
  p: "4",
  bg: "surface.subtle",
  color: "page.fg",
  borderBottomWidth: "1px",
  borderColor: "line",
  fontSize: "sm",
});

const tableCell = (props?: { readonly strong?: boolean }) => css({
  p: "4",
  borderBottomWidth: "1px",
  borderColor: "line",
  color: props?.strong ? "page.fg" : "page.muted",
  fontWeight: props?.strong ? "800" : "500",
  fontSize: "sm",
  verticalAlign: "top",
  '& code': {
    fontFamily: "mono",
    color: "page.fg",
    bg: "surface.subtle",
    rounded: "md",
    px: "2",
    py: "1",
  },
});

export const inlineList = hstack;
