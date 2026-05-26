import { docsSections } from '../../src/content.js';
import { withSiteBase } from '../../src/site-base.js';
import { PageHeader, SectionList, ShellSection } from '../../src/ui.js';
import { css } from '../../styled-system/css';
import { grid, stack } from '../../styled-system/patterns';

const guideCards = [
  {
    title: 'Getting started',
    href: '/docs/getting-started',
    body: 'Install, configure, register, verify, and load your first MFE.',
  },
  {
    title: 'Easy Way',
    href: '/docs/easy-way',
    body: 'Choose Generic, Bundle, or OTA before wiring your Host and MFE.',
  },
  {
    title: 'Options reference',
    href: '/docs/options',
    body: 'See every Host config, MFE config, registry, and runtime option.',
  },
  {
    title: 'Hot Updater setup',
    href: '/docs/hot-updater',
    body: 'Configure the adapter, verify OTA eligibility, then deploy safely.',
  },
  {
    title: 'Metro / Bundle archive',
    href: '/docs/metro-bundle-archive',
    body: 'Merge Metro with withMfe and load rnm bundle archives through a Host loader.',
  },
  {
    title: 'Package managers & CLI',
    href: '/docs/package-managers',
    body: 'Run install, integration, verify, bundle, and publish commands with any supported package manager.',
  },
  {
    title: 'Native contract',
    href: '/docs/native-contract',
    body: 'Understand what changes require a store release.',
  },
  {
    title: 'Global state',
    href: '/docs/global-state',
    body: 'Provide host sharedState and read it safely inside an MFE.',
  },
];

export default function Page() {
  return (
    <ShellSection>
      <PageHeader
        title="Start here: from install to a verified first module."
        subtitle="Use this guide when you are integrating the library for the first time. It explains the minimum host setup, module registration, runtime loading, and host-provided shared state."
      />
      <section
        className={grid({ columns: { base: 1, md: 2, xl: 3 }, gap: '5' })}
      >
        {guideCards.map((card) => (
          <a
            key={card.href}
            href={withSiteBase(card.href)}
            className={css({
              display: 'block',
              rounded: '3xl',
              borderWidth: '1px',
              borderColor: 'line',
              bg: 'surface',
              shadow: 'card',
              p: { base: '5', md: '6' },
              transition: 'all 160ms ease',
              _hover: { transform: 'translateY(-3px)', borderColor: 'accent' },
            })}
          >
            <div className={stack({ gap: '3' })}>
              <h2
                className={css({
                  m: '0',
                  fontSize: 'xl',
                  lineHeight: '1.35',
                  letterSpacing: '-0.02em',
                })}
              >
                {card.title}
              </h2>
              <p
                className={css({
                  m: '0',
                  color: 'page.muted',
                  lineHeight: '1.75',
                })}
              >
                {card.body}
              </p>
            </div>
          </a>
        ))}
      </section>
      <SectionList sections={docsSections} />
    </ShellSection>
  );
}
