import { docsSections, guideCards } from '../../src/content.js';
import { withSiteBase } from '../../src/site-base.js';
import { PageHeader, SectionList, ShellSection } from '../../src/ui.js';
import { css } from '../../styled-system/css';
import { grid, stack } from '../../styled-system/patterns';

const guideCardHrefs = [
  '/docs/getting-started',
  '/docs/easy-way',
  '/docs/hot-updater',
  '/docs/metro-bundle-archive',
  '/docs/package-managers',
  '/docs/options',
  '/docs/native-contract',
  '/docs/repack-comparison',
  '/docs/global-state',
] as const;

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
        {guideCards.map((card, index) => (
          <a
            key={card.title}
            href={withSiteBase(guideCardHrefs[index] ?? '/docs')}
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
