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
  | 'globalState';

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
    | '/docs/global-state';
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
    globalState: 'グローバル状態',
  },
} satisfies Record<LocalePrefix, Record<NavLabelKey, string>>;

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

const createNavItems = (prefix: LocalePrefix): readonly LocalizedNavItem[] => {
  const labels = localizedNavLabels[prefix];

  return [
    { label: labels.overview, path: '' },
    { label: labels.docs, path: '/docs' },
    { label: labels.gettingStarted, path: '/docs/getting-started' },
    { label: labels.easyWay, path: '/docs/easy-way' },
    { label: labels.options, path: '/docs/options' },
    { label: labels.hotUpdater, path: '/docs/hot-updater' },
    { label: labels.metroBundle, path: '/docs/metro-bundle-archive' },
    { label: labels.packageManagers, path: '/docs/package-managers' },
    { label: labels.nativeContract, path: '/docs/native-contract' },
    { label: labels.globalState, path: '/docs/global-state' },
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
  const navItems = createNavItems(localePrefix);
  const homeHref = createLocalizedHref(localePrefix, '');
  const seo = getSeoInfo(pageContext.urlOriginal);
  const canonicalUrl = getCanonicalUrl(pageContext.urlOriginal);
  const ogImageUrl = getOpenGraphImageUrl();
  const alternateLinks = getAlternateLinks(pageContext.urlOriginal);

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
            gap: { base: '8', md: '12' },
            maxW: '7xl',
            mx: 'auto',
            px: { base: '4', sm: '5', md: '8' },
            py: { base: '4', md: '6' },
          })}
        >
          <header
            className={stack({
              gap: { base: '3', md: '3.5' },
              rounded: '3xl',
              borderWidth: '1px',
              borderColor: 'line',
              bg: 'surface',
              shadow: 'card',
              px: { base: '3', sm: '4', md: '5' },
              py: { base: '3', md: '4' },
            })}
          >
            <div
              className={hstack({
                justify: 'space-between',
                alignItems: 'center',
                gap: '3',
                minW: '0',
              })}
            >
              <a
                href={homeHref}
                className={hstack({
                  gap: { base: '2.5', md: '3' },
                  alignItems: 'center',
                  minW: '0',
                })}
              >
                <span
                  className={css({
                    display: 'inline-grid',
                    placeItems: 'center',
                    w: { base: '8', md: '10' },
                    h: { base: '8', md: '10' },
                    rounded: { base: 'xl', md: '2xl' },
                    bg: 'page.fg',
                    color: 'page.bg',
                    fontWeight: '900',
                    flexShrink: '0',
                  })}
                >
                  B
                </span>
                <span
                  className={css({
                    minW: '0',
                    maxW: { base: '42vw', sm: 'none' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: { base: 'md', md: 'lg' },
                    fontWeight: '900',
                    letterSpacing: '-0.045em',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                  })}
                >
                  bunin / RN MFE
                </span>
              </a>
              <div
                className={css({
                  ml: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: { base: '1.5', sm: '2' },
                  flexShrink: '0',
                })}
              >
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
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
            <div
              className={css({
                minW: '0',
                rounded: '2xl',
                bg: 'surface.subtle',
                borderWidth: '1px',
                borderColor: 'line',
                p: '1.5',
              })}
            >
              <nav
                className={css({
                  display: 'flex',
                  gap: '1.5',
                  maxW: 'full',
                  overflowX: 'auto',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  scrollbarWidth: 'none',
                  scrollSnapType: 'x proximity',
                  '&::-webkit-scrollbar': { display: 'none' },
                })}
                aria-label="Main navigation"
              >
                {navItems.map((item) => (
                  <a
                    key={item.path}
                    href={createLocalizedHref(localePrefix, item.path)}
                    className={navLink({
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
                <span
                  className={css({
                    flexShrink: '0',
                    w: '1px',
                    h: '5',
                    bg: 'line',
                    mx: '1',
                  })}
                  aria-hidden="true"
                />
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
          {children}
          <footer
            className={hstack({
              justify: 'space-between',
              flexWrap: 'wrap',
              gap: '4',
              color: 'page.muted',
              fontSize: 'sm',
              lineHeight: '1.6',
              pb: '6',
            })}
          >
            <span>© bunin React Native Micro Frontend</span>
            <a
              href={githubRepositoryUrl}
              target="_blank"
              rel="noreferrer"
              className={css({
                color: 'page.muted',
                fontWeight: '700',
                textDecoration: 'none',
                _hover: { color: 'page.fg' },
              })}
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

const formatStarCount = (count: number) =>
  new Intl.NumberFormat('en', {
    notation: count >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(count);

const githubLink = () =>
  css({
    display: 'inline-flex',
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
    _hover: { bg: 'accent.soft', color: 'page.fg' },
  });

const navLink = (props: { readonly active: boolean }) =>
  css({
    flexShrink: '0',
    scrollSnapAlign: 'start',
    rounded: 'full',
    px: { base: '3', md: '3.5' },
    py: '2',
    color: props.active ? 'accent' : 'page.muted',
    bg: props.active ? 'accent.soft' : 'surface',
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
    scrollSnapAlign: 'start',
    rounded: 'full',
    px: { base: '3', md: '3.5' },
    py: '2',
    color: props.active ? 'accent' : 'page.muted',
    bg: props.active ? 'accent.soft' : 'surface',
    fontSize: { base: 'xs', md: 'sm' },
    fontWeight: '850',
    lineHeight: '1',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    _hover: { bg: 'accent.soft', color: 'page.fg' },
  });
