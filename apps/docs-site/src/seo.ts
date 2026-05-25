import { absoluteSiteUrl, stripSiteBase } from './site-base.js';

type Locale = 'en' | 'ko' | 'zh-CN' | 'ja';

type SeoInfo = {
  readonly locale: Locale;
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
  readonly ogLocale: string;
  readonly section: SeoSection;
};

const brand = 'bunin React Native Micro Frontend';

const localePrefixes = {
  en: '',
  ko: '/ko',
  'zh-CN': '/zh-cn',
  ja: '/jp',
} satisfies Record<Locale, string>;

const copy = {
  en: {
    suffix: brand,
    overview:
      'Native-safe React Native micro frontend delivery with Hot Updater compatibility, host-provided state, and package-manager neutral workflows.',
    docs: 'Complete React Native micro frontend documentation: install, configure, register modules, share host state, verify native contracts, and publish safely.',
    hotUpdater:
      'Configure Hot Updater for native-safe React Native micro frontend OTA delivery with verification before publish.',
    packageManagers:
      'Use Bun, npm, pnpm, Yarn, and Deno with the same React Native micro frontend install and release workflow.',
    nativeContract:
      'Understand native contract hashing, Hermes and New Architecture compatibility, and when React Native OTA must be blocked.',
    globalState:
      'Provide host-owned sharedState to React Native micro frontends and read it safely with useMicroFrontendSharedState.',
  },
  ko: {
    suffix: `${brand} 한국어 문서`,
    overview:
      'Hot Updater 호환, Host shared state, native contract 검증을 제공하는 React Native micro frontend 한국어 가이드입니다.',
    docs: '설치, 설정, MFE 등록, Host 상태 전달, native contract 검증, 안전한 배포까지 정리한 한국어 문서입니다.',
    hotUpdater:
      'Hot Updater 앞단에 native-safety verification을 추가해 React Native MFE OTA를 안전하게 배포하는 방법입니다.',
    packageManagers:
      'Bun, npm, pnpm, Yarn, Deno에서 동일한 React Native micro frontend workflow를 실행하는 방법입니다.',
    nativeContract:
      'native hash, Hermes, New Architecture 호환성, OTA 차단 기준을 설명하는 한국어 문서입니다.',
    globalState:
      'Host가 제공한 sharedState를 React Native MFE에서 useMicroFrontendSharedState로 안전하게 읽는 방법입니다.',
  },
  'zh-CN': {
    suffix: `${brand} 简体中文文档`,
    overview:
      '面向 React Native micro frontend 的 native-safe delivery、Hot Updater 集成与 Host shared state 指南。',
    docs: '完整的简体中文文档：安装、配置、注册 MFE、传递 Host 状态、校验 native contract 并安全发布。',
    hotUpdater:
      '在 Hot Updater 前加入 native-safety verification，安全发布 React Native MFE OTA。',
    packageManagers:
      '使用 Bun、npm、pnpm、Yarn、Deno 执行同一套 React Native micro frontend workflow。',
    nativeContract:
      '解释 native hash、Hermes、New Architecture compatibility 以及何时必须阻止 OTA。',
    globalState:
      '说明如何在 React Native MFE 中通过 useMicroFrontendSharedState 安全读取 Host sharedState。',
  },
  ja: {
    suffix: `${brand} 日本語ドキュメント`,
    overview:
      'React Native micro frontend の native-safe delivery、Hot Updater 連携、Host shared state の日本語ガイドです。',
    docs: 'install、config、MFE registration、Host state、native contract verification、安全な publish までの日本語ドキュメントです。',
    hotUpdater:
      'Hot Updater の前段に native-safety verification を追加し、React Native MFE OTA を安全に公開します。',
    packageManagers:
      'Bun、npm、pnpm、Yarn、Deno で同じ React Native micro frontend workflow を実行します。',
    nativeContract:
      'native hash、Hermes、New Architecture compatibility、OTA を止める条件を説明します。',
    globalState:
      'Host が提供する sharedState を React Native MFE 内で useMicroFrontendSharedState により安全に読み取る方法です。',
  },
} satisfies Record<Locale, Record<string, string>>;

type SeoSection =
  | 'overview'
  | 'docs'
  | 'hotUpdater'
  | 'packageManagers'
  | 'nativeContract'
  | 'globalState';

const titles: Record<SeoSection, string> = {
  overview: 'Native-safe React Native Micro Frontends',
  docs: 'Documentation',
  hotUpdater: 'Hot Updater Setup',
  packageManagers: 'Package Manager Matrix',
  nativeContract: 'Native Contract Guide',
  globalState: 'Global State Guide',
} as const;

const localizedTitles = {
  en: titles,
  ko: {
    overview: 'Native-safe React Native Micro Frontend',
    docs: '한국어 문서',
    hotUpdater: 'Hot Updater 설정',
    packageManagers: '패키지 매니저 표',
    nativeContract: 'Native Contract 가이드',
    globalState: '전역 상태 가이드',
  },
  'zh-CN': {
    overview: 'Native-safe React Native Micro Frontend',
    docs: '简体中文文档',
    hotUpdater: 'Hot Updater 设置',
    packageManagers: '包管理器矩阵',
    nativeContract: 'Native Contract 指南',
    globalState: '全局状态指南',
  },
  ja: {
    overview: 'Native-safe React Native Micro Frontend',
    docs: '日本語ドキュメント',
    hotUpdater: 'Hot Updater 設定',
    packageManagers: 'Package Manager 一覧',
    nativeContract: 'Native Contract ガイド',
    globalState: 'Global State ガイド',
  },
} satisfies Record<Locale, typeof titles>;

const ogLocales = {
  en: 'en_US',
  ko: 'ko_KR',
  'zh-CN': 'zh_CN',
  ja: 'ja_JP',
} satisfies Record<Locale, string>;

export const alternateOgLocales = Object.values(ogLocales);

export function getSeoInfo(urlOriginal: string): SeoInfo {
  const pathname = stripSiteBase(toPathname(urlOriginal));
  const locale = getLocale(pathname);
  const section = getSection(pathname);
  const title = `${localizedTitles[locale][section]} | ${copy[locale].suffix}`;
  const description = copy[locale][section];

  return {
    locale,
    title,
    description,
    section,
    ogLocale: ogLocales[locale],
    keywords: [
      'React Native micro frontend',
      'React Native MFE',
      'Hot Updater',
      'native-safe OTA',
      'Hermes',
      'New Architecture',
      'Bun',
      'bunin',
      'host shared state',
      'native contract',
    ].join(', '),
  };
}

export function getCanonicalUrl(urlOriginal: string) {
  return absoluteSiteUrl(stripSiteBase(toPathname(urlOriginal)));
}

export function getOpenGraphImageUrl() {
  return absoluteSiteUrl('/og-image.svg');
}

export function getAlternateLinks(urlOriginal: string) {
  const pathname = stripSiteBase(toPathname(urlOriginal));
  const routeWithoutLocale = stripLocalePrefix(pathname);

  return [
    { lang: 'x-default', href: absoluteSiteUrl(routeWithoutLocale || '/') },
    { lang: 'en', href: absoluteSiteUrl(routeWithoutLocale || '/') },
    {
      lang: 'ko',
      href: absoluteSiteUrl(joinPath(localePrefixes.ko, routeWithoutLocale)),
    },
    {
      lang: 'zh-CN',
      href: absoluteSiteUrl(
        joinPath(localePrefixes['zh-CN'], routeWithoutLocale),
      ),
    },
    {
      lang: 'ja',
      href: absoluteSiteUrl(joinPath(localePrefixes.ja, routeWithoutLocale)),
    },
  ];
}

export function getJsonLd(urlOriginal: string) {
  const seo = getSeoInfo(urlOriginal);
  const canonical = getCanonicalUrl(urlOriginal);
  const imageUrl = getOpenGraphImageUrl();
  const breadcrumbItems = getBreadcrumbItems(urlOriginal, seo.locale);

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${absoluteSiteUrl('/')}#organization`,
        name: 'bunin',
        url: absoluteSiteUrl('/'),
        logo: imageUrl,
        sameAs: ['https://github.com/burned-in/react-native-micro-frontend'],
      },
      {
        '@type': 'WebSite',
        '@id': `${absoluteSiteUrl('/')}#website`,
        name: brand,
        url: absoluteSiteUrl('/'),
        inLanguage: seo.locale,
        description: seo.description,
        publisher: { '@id': `${absoluteSiteUrl('/')}#organization` },
      },
      {
        '@type': 'TechArticle',
        '@id': `${canonical}#article`,
        headline: seo.title,
        description: seo.description,
        url: canonical,
        image: imageUrl,
        inLanguage: seo.locale,
        isPartOf: { '@id': `${absoluteSiteUrl('/')}#website` },
        publisher: { '@id': `${absoluteSiteUrl('/')}#organization` },
        about: [
          'React Native',
          'Micro Frontend',
          'OTA',
          'Hot Updater',
          'Native Contract',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.href,
        })),
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${absoluteSiteUrl('/')}#source`,
        name: brand,
        codeRepository:
          'https://github.com/burned-in/react-native-micro-frontend',
        programmingLanguage: ['TypeScript', 'React Native'],
        runtimePlatform: ['iOS', 'Android', 'React Native'],
      },
    ],
  });
}

function toPathname(urlOriginal: string) {
  if (urlOriginal.startsWith('http://') || urlOriginal.startsWith('https://')) {
    return new URL(urlOriginal).pathname;
  }

  return urlOriginal.split('?')[0]?.split('#')[0] || '/';
}

function getLocale(pathname: string): Locale {
  if (pathname === '/ko' || pathname.startsWith('/ko/')) return 'ko';
  if (pathname === '/zh-cn' || pathname.startsWith('/zh-cn/')) return 'zh-CN';
  if (pathname === '/jp' || pathname.startsWith('/jp/')) return 'ja';
  return 'en';
}

function getSection(pathname: string): SeoSection {
  const route = stripLocalePrefix(pathname);

  if (route.startsWith('/docs/hot-updater')) return 'hotUpdater';
  if (route.startsWith('/docs/package-managers')) return 'packageManagers';
  if (route.startsWith('/docs/native-contract')) return 'nativeContract';
  if (route.startsWith('/docs/global-state')) return 'globalState';
  if (route.startsWith('/docs')) return 'docs';

  return 'overview';
}

function stripLocalePrefix(pathname: string) {
  if (pathname === '/ko' || pathname === '/zh-cn' || pathname === '/jp') {
    return '/';
  }

  return pathname.replace(/^\/(ko|zh-cn|jp)(?=\/)/, '') || '/';
}

function joinPath(prefix: string, path: string) {
  if (path === '/') {
    return prefix || '/';
  }

  return `${prefix}${path}`;
}

function getBreadcrumbItems(urlOriginal: string, locale: Locale) {
  const pathname = stripSiteBase(toPathname(urlOriginal));
  const routeWithoutLocale = stripLocalePrefix(pathname);
  const prefix = localePrefixes[locale];
  const docsPath = joinPath(prefix, '/docs');

  const homeLabels = {
    en: 'Home',
    ko: '홈',
    'zh-CN': '首页',
    ja: 'ホーム',
  } satisfies Record<Locale, string>;

  const docsLabels = {
    en: 'Docs',
    ko: '문서',
    'zh-CN': '文档',
    ja: 'ドキュメント',
  } satisfies Record<Locale, string>;

  const items = [
    {
      name: homeLabels[locale],
      href: absoluteSiteUrl(prefix || '/'),
    },
  ];

  if (routeWithoutLocale.startsWith('/docs')) {
    items.push({
      name: docsLabels[locale],
      href: absoluteSiteUrl(docsPath),
    });
  }

  if (seoSectionNeedsOwnBreadcrumb(getSection(pathname))) {
    items.push({
      name: localizedTitles[locale][getSection(pathname)],
      href: getCanonicalUrl(urlOriginal),
    });
  }

  return items;
}

function seoSectionNeedsOwnBreadcrumb(section: SeoSection) {
  return section !== 'overview' && section !== 'docs';
}
