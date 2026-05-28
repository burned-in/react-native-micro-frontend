import React, { useEffect, useState } from 'react';
import { Head } from 'vike-react/Head';
import { usePageContext } from 'vike-react/usePageContext';
import {
  alternateOgLocales,
  getAlternateLinks,
  getCanonicalUrl,
  getJsonLd,
  getOpenGraphImageUrl,
  getSeoInfo,
} from '../src/seo.js';
import { stripSiteBase, withSiteBase } from '../src/site-base.js';
import { css } from '../styled-system/css';
import { hstack, stack } from '../styled-system/patterns';
import '../styled-system/styles.css';

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", stored ? stored === "dark" : prefersDark);
  } catch (_) {}
})();`;

const githubRepositoryUrl =
  'https://github.com/burned-in/react-native-micro-frontend';
const githubRepositoryApiUrl =
  'https://api.github.com/repos/burned-in/react-native-micro-frontend';
const githubFallbackStarCount = 1;

type LocalePrefix = '' | '/ko' | '/zh-cn' | '/jp';

type NavLabelKey =
  | 'overview'
  | 'docs'
  | 'gettingStarted'
  | 'easyWay'
  | 'options'
  | 'hotUpdater'
  | 'metroBundle'
  | 'packageManagers'
  | 'nativeContract'
  | 'repackComparison'
  | 'globalState';

type NavGroupLabelKey = 'start' | 'delivery' | 'reference';

type LocalizedNavItem = {
  readonly label: string;
  readonly path:
    | ''
    | '/docs'
    | '/docs/getting-started'
    | '/docs/easy-way'
    | '/docs/options'
    | '/docs/hot-updater'
    | '/docs/metro-bundle-archive'
    | '/docs/package-managers'
    | '/docs/native-contract'
    | '/docs/repack-comparison'
    | '/docs/global-state';
};

type LocalizedNavGroup = {
  readonly label: string;
  readonly items: readonly LocalizedNavItem[];
};

const localePrefixes = ['', '/ko', '/zh-cn', '/jp'] as const;

const localizedNavLabels = {
  '': {
    overview: 'Overview',
    docs: 'Docs',
    gettingStarted: 'Getting started',
    easyWay: 'Easy Way',
    options: 'Options',
    hotUpdater: 'Hot Updater',
    metroBundle: 'Metro / Bundle',
    packageManagers: 'Package managers',
    nativeContract: 'Native contract',
    repackComparison: 'Re.Pack comparison',
    globalState: 'Global state',
  },
  '/ko': {
    overview: '개요',
    docs: '문서',
    gettingStarted: '시작하기',
    easyWay: '쉬운 사용법',
    options: '옵션',
    hotUpdater: 'Hot Updater',
    metroBundle: 'Metro / Bundle',
    packageManagers: '패키지 매니저',
    nativeContract: 'Native contract',
    repackComparison: 'Re.Pack 비교',
    globalState: '전역 상태',
  },
  '/zh-cn': {
    overview: '概览',
    docs: '文档',
    gettingStarted: '入门指南',
    easyWay: '简单用法',
    options: '选项',
    hotUpdater: 'Hot Updater',
    metroBundle: 'Metro / Bundle',
    packageManagers: '包管理器',
    nativeContract: 'Native contract',
    repackComparison: 'Re.Pack 对比',
    globalState: '全局状态',
  },
  '/jp': {
    overview: '概要',
    docs: 'ドキュメント',
    gettingStarted: 'はじめに',
    easyWay: '簡単な使い方',
    options: 'オプション',
    hotUpdater: 'Hot Updater',
    metroBundle: 'Metro / Bundle',
    packageManagers: 'パッケージマネージャー',
    nativeContract: 'Native contract',
    repackComparison: 'Re.Pack 比較',
    globalState: 'グローバル状態',
  },
} satisfies Record<LocalePrefix, Record<NavLabelKey, string>>;

const localizedNavGroupLabels = {
  '': {
    start: 'Start',
    delivery: 'Delivery',
    reference: 'Reference',
  },
  '/ko': {
    start: '시작',
    delivery: '배포',
    reference: '레퍼런스',
  },
  '/zh-cn': {
    start: '开始',
    delivery: '交付',
    reference: '参考',
  },
  '/jp': {
    start: '開始',
    delivery: '配信',
    reference: 'リファレンス',
  },
} satisfies Record<LocalePrefix, Record<NavGroupLabelKey, string>>;

const languageLinks = [
  { label: 'English', prefix: '' },
  { label: '한국어', prefix: '/ko' },
  { label: '中文', prefix: '/zh-cn' },
  { label: '日本語', prefix: '/jp' },
] as const satisfies readonly {
  readonly label: string;
  readonly prefix: LocalePrefix;
}[];

const getPathname = (urlOriginal: string) => {
  if (urlOriginal.startsWith('http://') || urlOriginal.startsWith('https://')) {
    return new URL(urlOriginal).pathname;
  }

  return urlOriginal.split('?')[0]?.split('#')[0] || '/';
};

const detectLocalePrefix = (urlOriginal: string): LocalePrefix => {
  const pathname = stripSiteBase(getPathname(urlOriginal));

  if (pathname === '/ko' || pathname.startsWith('/ko/')) {
    return '/ko';
  }

  if (pathname === '/zh-cn' || pathname.startsWith('/zh-cn/')) {
    return '/zh-cn';
  }

  if (pathname === '/jp' || pathname.startsWith('/jp/')) {
    return '/jp';
  }

  return '';
};

const stripLocalePrefix = (pathname: string) => {
  for (const prefix of localePrefixes) {
    if (!prefix) {
      continue;
    }

    if (pathname === prefix) {
      return '/';
    }

    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || '/';
    }
  }

  return pathname || '/';
};

const createLocaleHref = (prefix: LocalePrefix, currentPathname: string) => {
  const route = stripLocalePrefix(stripSiteBase(currentPathname));
  const normalizedRoute = route === '/' ? '' : route;

  return withSiteBase(`${prefix}${normalizedRoute}` || '/');
};

const createNavGroups = (prefix: LocalePrefix): readonly LocalizedNavGroup[] => {
  const labels = localizedNavLabels[prefix];
  const groupLabels = localizedNavGroupLabels[prefix];

  return [
    {
      label: groupLabels.start,
      items: [
        { label: labels.docs, path: '/docs' },
        { label: labels.gettingStarted, path: '/docs/getting-started' },
        { label: labels.easyWay, path: '/docs/easy-way' },
      ],
    },
    {
      label: groupLabels.delivery,
      items: [
        { label: labels.hotUpdater, path: '/docs/hot-updater' },
        { label: labels.metroBundle, path: '/docs/metro-bundle-archive' },
        { label: labels.packageManagers, path: '/docs/package-managers' },
      ],
    },
    {
      label: groupLabels.reference,
      items: [
        { label: labels.options, path: '/docs/options' },
        { label: labels.nativeContract, path: '/docs/native-contract' },
        { label: labels.repackComparison, path: '/docs/repack-comparison' },
        { label: labels.globalState, path: '/docs/global-state' },
      ],
    },
  ];
};

const createTopNavItems = (prefix: LocalePrefix): readonly LocalizedNavItem[] => {
  const labels = localizedNavLabels[prefix];

  return [
    { label: labels.overview, path: '' },
    { label: labels.docs, path: '/docs' },
  ];
};

const createLocalizedHref = (
  prefix: LocalePrefix,
  path: LocalizedNavItem['path'],
) => {
  if (!prefix) {
    return withSiteBase(path || '/');
  }

  return withSiteBase(`${prefix}${path}`);
};

const isActiveNavItem = (
  routeWithoutLocale: string,
  path: LocalizedNavItem['path'],
) => {
  const normalizedRoute = routeWithoutLocale === '/' ? '' : routeWithoutLocale;

  if (path === '') {
    return normalizedRoute === '';
  }

  return normalizedRoute === path;
};

const isDocsRoute = (routeWithoutLocale: string) =>
  routeWithoutLocale === '/docs' || routeWithoutLocale.startsWith('/docs/');

export default function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const pageContext = usePageContext();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [starCount, setStarCount] = useState(githubFallbackStarCount);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const updateStarCount = async () => {
      try {
        const response = await fetch(githubRepositoryApiUrl, {
          headers: { Accept: 'application/vnd.github+json' },
        });

        if (!response.ok) {
          return;
        }

        const repository = (await response.json()) as {
          readonly stargazers_count?: unknown;
        };
        const nextStarCount = repository.stargazers_count;

        if (
          !cancelled &&
          typeof nextStarCount === 'number' &&
          Number.isFinite(nextStarCount)
        ) {
          setStarCount(nextStarCount);
        }
      } catch {
        // Keep the static fallback when GitHub's public API is unavailable.
      }
    };

    void updateStarCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const localePrefix = detectLocalePrefix(pageContext.urlOriginal);
  const currentPathname = getPathname(pageContext.urlOriginal);
  const routeWithoutLocale = stripLocalePrefix(stripSiteBase(currentPathname));
  const topNavItems = createTopNavItems(localePrefix);
  const navGroups = createNavGroups(localePrefix);
  const homeHref = createLocalizedHref(localePrefix, '');
  const gettingStartedHref = createLocalizedHref(
    localePrefix,
    '/docs/getting-started',
  );
  const seo = getSeoInfo(pageContext.urlOriginal);
  const canonicalUrl = getCanonicalUrl(pageContext.urlOriginal);
  const ogImageUrl = getOpenGraphImageUrl();
  const alternateLinks = getAlternateLinks(pageContext.urlOriginal);
  const docsRoute = isDocsRoute(routeWithoutLocale);
  const showGettingStartedCta = !isActiveNavItem(
    routeWithoutLocale,
    '/docs/getting-started',
  );

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          content={theme === 'dark' ? '#050816' : '#f8fbff'}
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <meta name="author" content="bunin" />
        <meta name="application-name" content="bunin RN MFE" />
        <meta name="apple-mobile-web-app-title" content="bunin RN MFE" />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <link rel="canonical" href={canonicalUrl} />
        {alternateLinks.map((link) => (
          <link
            key={link.lang}
            rel="alternate"
            hrefLang={link.lang}
            href={link.href}
          />
        ))}
        <link
          rel="icon"
          type="image/svg+xml"
          href={withSiteBase('/favicon.svg')}
        />
        <link rel="apple-touch-icon" href={withSiteBase('/favicon.svg')} />
        <link rel="manifest" href={withSiteBase('/site.webmanifest')} />
        <meta property="og:type" content="website" />
        <meta
          property="og:site_name"
          content="bunin React Native Micro Frontend"
        />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content={seo.ogLocale} />
        {alternateOgLocales
          .filter((locale) => locale !== seo.ogLocale)
          .map((locale) => (
            <meta
              key={locale}
              property="og:locale:alternate"
              content={locale}
            />
          ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: getJsonLd(pageContext.urlOriginal),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Sans+SC:wght@400;500;700;900&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </Head>
      <div
        className={css({
          minH: '100vh',
          bg: 'page.bg',
          color: 'page.fg',
          backgroundImage: {
            base: 'radial-gradient(circle at top left, rgba(139,92,246,0.16), transparent 34%), radial-gradient(circle at bottom right, rgba(34,211,238,0.13), transparent 36%)',
            _dark:
              'radial-gradient(circle at top left, rgba(34,211,238,0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(139,92,246,0.16), transparent 36%)',
          },
        })}
      >
        <div
          className={stack({
            gap: { base: '6', md: '8' },
            maxW: '7xl',
            mx: 'auto',
            px: { base: '4', sm: '5', md: '8' },
            py: { base: '4', md: '6' },
          })}
        >
          <header className={siteHeader()}>
            <div className={headerRow()}>
              <a href={homeHref} className={brandLink()}>
                <span className={brandMark()}>B</span>
                <span className={brandCopy()}>
                  <span className={brandText()}>bunin / RN MFE</span>
                  <span className={brandTagline()}>Native-safe OTA modules</span>
                </span>
              </a>
              <nav className={desktopTopNav()} aria-label="Primary navigation">
                {topNavItems.map((item) => (
                  <a
                    key={item.path || 'home'}
                    href={createLocalizedHref(localePrefix, item.path)}
                    className={topNavLink({
                      active: isActiveNavItem(routeWithoutLocale, item.path),
                    })}
                    aria-current={
                      isActiveNavItem(routeWithoutLocale, item.path)
                        ? 'page'
                        : undefined
                    }
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className={headerActions()}>
                {showGettingStartedCta ? (
                  <a href={gettingStartedHref} className={startButton()}>
                    {localizedNavLabels[localePrefix].gettingStarted}
                  </a>
                ) : null}
                <nav className={desktopLanguageNav()} aria-label="Language selection">
                  {languageLinks.map((language) => (
                    <a
                      key={language.prefix || 'en'}
                      href={createLocaleHref(language.prefix, currentPathname)}
                      className={languageLink({
                        active: localePrefix === language.prefix,
                      })}
                      aria-current={
                        localePrefix === language.prefix ? 'page' : undefined
                      }
                    >
                      {language.label}
                    </a>
                  ))}
                </nav>
                <a
                  href={githubRepositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open GitHub repository, ${formatStarCount(
                    starCount,
                  )} stars`}
                  className={githubLink()}
                >
                  <span>GitHub</span>
                  <span aria-hidden="true">★</span>
                  <span>{formatStarCount(starCount)}</span>
                </a>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={themeButton()}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
            <div className={mobileHeaderStrip()}>
              <nav className={mobileTopNav()} aria-label="Mobile navigation">
                {[...topNavItems, { label: localizedNavLabels[localePrefix].gettingStarted, path: '/docs/getting-started' as const }].map((item) => (
                  <a
                    key={item.path || 'home'}
                    href={createLocalizedHref(localePrefix, item.path)}
                    className={navPill({
                      active: isActiveNavItem(routeWithoutLocale, item.path),
                    })}
                    aria-current={
                      isActiveNavItem(routeWithoutLocale, item.path)
                        ? 'page'
                        : undefined
                    }
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <nav className={languageNav()} aria-label="Language selection">
                {languageLinks.map((language) => (
                  <a
                    key={language.prefix || 'en'}
                    href={createLocaleHref(language.prefix, currentPathname)}
                    className={languageLink({
                      active: localePrefix === language.prefix,
                    })}
                    aria-current={
                      localePrefix === language.prefix ? 'page' : undefined
                    }
                  >
                    {language.label}
                  </a>
                ))}
              </nav>
            </div>
          </header>
          {docsRoute ? (
            <div className={docsLayout()}>
              <DocsSidebar
                groups={navGroups}
                localePrefix={localePrefix}
                routeWithoutLocale={routeWithoutLocale}
              />
              <div className={stack({ gap: '6', minW: '0' })}>
                <MobileDocsNav
                  groups={navGroups}
                  localePrefix={localePrefix}
                  routeWithoutLocale={routeWithoutLocale}
                />
                {children}
              </div>
            </div>
          ) : (
            children
          )}
          <footer className={footerStyle()}>
            <span>© bunin React Native Micro Frontend</span>
            <a
              href={githubRepositoryUrl}
              target="_blank"
              rel="noreferrer"
              className={footerLink()}
            >
              GitHub · ★ {formatStarCount(starCount)}
            </a>
            <span>
              Native-safe feature delivery · Hot Updater compatible · Bun-first
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}

function DocsSidebar({
  groups,
  localePrefix,
  routeWithoutLocale,
}: {
  readonly groups: readonly LocalizedNavGroup[];
  readonly localePrefix: LocalePrefix;
  readonly routeWithoutLocale: string;
}) {
  return (
    <aside className={docsSidebarStyle()}>
      <div className={sidebarCard()}>
        <p className={sidebarEyebrow()}>Documentation</p>
        <nav className={stack({ gap: '5' })} aria-label="Documentation navigation">
          {groups.map((group) => (
            <div key={group.label} className={sidebarGroup()}>
              <p className={sidebarGroupLabel()}>{group.label}</p>
              <div className={stack({ gap: '1' })}>
                {group.items.map((item) => (
                  <a
                    key={item.path}
                    href={createLocalizedHref(localePrefix, item.path)}
                    className={sideNavLink({
                      active: isActiveNavItem(routeWithoutLocale, item.path),
                    })}
                    aria-current={
                      isActiveNavItem(routeWithoutLocale, item.path)
                        ? 'page'
                        : undefined
                    }
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MobileDocsNav({
  groups,
  localePrefix,
  routeWithoutLocale,
}: {
  readonly groups: readonly LocalizedNavGroup[];
  readonly localePrefix: LocalePrefix;
  readonly routeWithoutLocale: string;
}) {
  return (
    <nav className={mobileDocsNav()} aria-label="Documentation shortcuts">
      {groups.flatMap((group) =>
        group.items.map((item) => (
          <a
            key={item.path}
            href={createLocalizedHref(localePrefix, item.path)}
            className={navPill({
              active: isActiveNavItem(routeWithoutLocale, item.path),
            })}
            aria-current={
              isActiveNavItem(routeWithoutLocale, item.path) ? 'page' : undefined
            }
          >
            {item.label}
          </a>
        )),
      )}
    </nav>
  );
}

const formatStarCount = (count: number) =>
  new Intl.NumberFormat('en', {
    notation: count >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(count);

const siteHeader = () =>
  css({
    position: 'sticky',
    top: { base: '2', md: '4' },
    zIndex: '20',
    display: 'grid',
    gap: { base: '2', lg: '0' },
    rounded: '2xl',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface',
    shadow: 'card',
    backdropFilter: 'blur(22px)',
    px: { base: '2.5', sm: '3.5', md: '4' },
    py: { base: '2.5', md: '3' },
    overflow: 'hidden',
  });

const headerRow = () =>
  css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    minW: '0',
    w: 'full',
  });

const brandLink = () =>
  hstack({
    gap: { base: '2.5', md: '3' },
    alignItems: 'center',
    minW: '0',
    flexShrink: '0',
  });

const brandMark = () =>
  css({
    display: 'inline-grid',
    placeItems: 'center',
    w: { base: '8', md: '9' },
    h: { base: '8', md: '9' },
    rounded: { base: 'xl', md: '2xl' },
    bg: 'page.fg',
    color: 'page.bg',
    fontWeight: '900',
    flexShrink: '0',
    shadow: 'card',
  });

const brandCopy = () =>
  css({
    display: 'grid',
    gap: '1',
    minW: '0',
  });

const brandTagline = () =>
  css({
    display: { base: 'none', xl: 'block' },
    color: 'page.muted',
    fontSize: 'xs',
    fontWeight: '750',
    lineHeight: '1',
    whiteSpace: 'nowrap',
  });

const brandText = () =>
  css({
    minW: '0',
    maxW: { base: '42vw', sm: 'none' },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: { base: 'md', md: 'lg' },
    fontWeight: '900',
    letterSpacing: '-0.045em',
    lineHeight: '1',
    whiteSpace: 'nowrap',
  });

const desktopTopNav = () =>
  css({
    display: { base: 'none', lg: 'flex' },
    alignItems: 'center',
    gap: '1',
    rounded: 'full',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface.subtle',
    p: '1',
  });

const mobileTopNav = () =>
  css({
    display: { base: 'flex', lg: 'none' },
    gap: '1.5',
    minW: '0',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  });

const mobileHeaderStrip = () =>
  css({
    display: { base: 'grid', lg: 'none' },
    justifyContent: 'stretch',
    gap: '2',
    minW: '0',
    alignItems: 'center',
    pt: '2',
    borderTopWidth: '1px',
    borderTopColor: 'line',
  });

const languageNav = () =>
  css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1.5',
    ml: 'auto',
    minW: '0',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  });

const topNavLink = (props: { readonly active: boolean }) =>
  css({
    rounded: 'full',
    px: '3.5',
    py: '2',
    color: props.active ? 'accent' : 'page.muted',
    bg: props.active ? 'accent.soft' : 'transparent',
    fontSize: 'sm',
    fontWeight: '850',
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 160ms ease',
    _hover: {
      bg: 'accent.soft',
      color: 'page.fg',
    },
  });

const headerActions = () =>
  css({
    ml: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: { base: '1.5', sm: '2' },
    minW: '0',
    flexShrink: '1',
  });

const desktopLanguageNav = () =>
  css({
    display: { base: 'none', '2xl': 'flex' },
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1',
    rounded: 'full',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface.subtle',
    p: '1',
  });

const startButton = () =>
  css({
    display: { base: 'none', lg: 'inline-flex' },
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'page.fg',
    color: 'page.bg',
    px: '4',
    py: '2',
    fontSize: 'sm',
    fontWeight: '900',
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 160ms ease',
    _hover: {
      transform: 'translateY(-1px)',
      shadow: 'card',
    },
  });

const githubLink = () =>
  css({
    display: { base: 'none', sm: 'inline-flex' },
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    rounded: 'full',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface',
    color: 'page.fg',
    px: { base: '2.5', sm: '4' },
    py: '2',
    fontSize: { base: 'xs', sm: 'sm' },
    fontWeight: '900',
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 160ms ease',
    _hover: {
      bg: 'accent.soft',
      color: 'accent',
      transform: 'translateY(-1px)',
    },
  });

const themeButton = () =>
  css({
    cursor: 'pointer',
    rounded: 'full',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface',
    color: 'page.fg',
    px: { base: '3', sm: '4' },
    py: '2',
    fontSize: { base: 'xs', sm: 'sm' },
    fontWeight: '800',
    transition: 'all 160ms ease',
    _hover: { bg: 'accent.soft', color: 'page.fg' },
  });

const navPill = (props: { readonly active: boolean }) =>
  css({
    flexShrink: '0',
    rounded: 'full',
    px: { base: '3', md: '3.5' },
    py: '2',
    color: props.active ? 'accent' : 'page.muted',
    bg: props.active ? 'accent.soft' : 'surface',
    borderWidth: '1px',
    borderColor: props.active ? 'accent' : 'line',
    fontSize: { base: 'xs', md: 'sm' },
    fontWeight: '850',
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 160ms ease',
    _hover: {
      bg: 'accent.soft',
      color: 'page.fg',
      transform: 'translateY(-1px)',
    },
  });

const languageLink = (props: { readonly active: boolean }) =>
  css({
    flexShrink: '0',
    rounded: 'full',
    px: { base: '2.5', md: '3' },
    py: '2',
    color: props.active ? 'accent' : 'page.muted',
    bg: props.active ? 'accent.soft' : 'transparent',
    fontSize: { base: 'xs', md: 'sm' },
    fontWeight: '850',
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    _hover: { bg: 'accent.soft', color: 'page.fg' },
  });

const docsLayout = () =>
  css({
    display: 'grid',
    gridTemplateColumns: { base: 'minmax(0,1fr)', lg: '260px minmax(0,1fr)' },
    alignItems: 'start',
    gap: { base: '6', lg: '8' },
  });

const docsSidebarStyle = () =>
  css({
    display: { base: 'none', lg: 'block' },
    position: 'sticky',
    top: '104px',
  });

const sidebarCard = () =>
  stack({
    gap: '5',
    rounded: '3xl',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface',
    shadow: 'card',
    p: '5',
  });

const sidebarEyebrow = () =>
  css({
    m: '0',
    color: 'accent',
    fontSize: 'xs',
    fontWeight: '900',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  });

const sidebarGroup = () =>
  stack({
    gap: '2',
    pt: '3',
    borderTopWidth: '1px',
    borderTopColor: 'line',
  });

const sidebarGroupLabel = () =>
  css({
    m: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    color: 'accent',
    fontSize: '2xs',
    fontWeight: '950',
    letterSpacing: '0.14em',
    lineHeight: '1',
    textTransform: 'uppercase',
    _after: {
      content: '""',
      h: '1px',
      flex: '1',
      bg: 'line',
    },
  });

const sideNavLink = (props: { readonly active: boolean }) =>
  css({
    display: 'block',
    rounded: 'xl',
    px: '3',
    py: '2.5',
    color: props.active ? 'accent' : 'page.muted',
    bg: props.active ? 'accent.soft' : 'transparent',
    borderWidth: '1px',
    borderColor: props.active ? 'accent' : 'transparent',
    fontSize: 'sm',
    fontWeight: props.active ? '900' : '750',
    lineHeight: '1.25',
    textDecoration: 'none',
    transition: 'all 160ms ease',
    _hover: {
      bg: 'accent.soft',
      color: 'page.fg',
      transform: 'translateX(2px)',
    },
  });

const mobileDocsNav = () =>
  css({
    display: { base: 'flex', lg: 'none' },
    gap: '2',
    minW: '0',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    rounded: '2xl',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface',
    shadow: 'card',
    p: '2',
    '&::-webkit-scrollbar': { display: 'none' },
  });

const footerStyle = () =>
  hstack({
    justify: 'space-between',
    flexWrap: 'wrap',
    gap: '4',
    color: 'page.muted',
    fontSize: 'sm',
    lineHeight: '1.6',
    pb: '6',
  });

const footerLink = () =>
  css({
    color: 'page.muted',
    fontWeight: '700',
    textDecoration: 'none',
    _hover: { color: 'page.fg' },
  });
