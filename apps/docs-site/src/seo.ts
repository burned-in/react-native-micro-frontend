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
      'Native-safe React Native and Expo micro frontend delivery with Hot Updater compatibility, host-provided state, and package-manager neutral workflows.',
    docs: 'Complete React Native micro frontend documentation: install, configure, register modules, share host state, verify native contracts, and publish safely.',
    gettingStarted:
      'Getting started guide for React Native micro frontends: install packages, declare host policy, register a module, verify native safety, and load it at runtime.',
    easyWay:
      'Easy Way guide for React Native micro frontends: choose Bundle without OTA publish, Hot Updater/custom OTA delivery, or Expo EAS Update.',
    options:
      'Complete options reference for React Native micro frontend Host config, MFE config, registry manifests, runtime providers, hooks, and screen APIs.',
    hotUpdater:
      'Configure Hot Updater for native-safe React Native micro frontend OTA delivery with verification before publish.',
    metroBundle:
      'Configure Metro with withMfe and load portable rnm bundle archives through a Host-owned bundle archive loader.',
    packageManagers:
      'Use Bun, npm, pnpm, Yarn, and Deno with the same RNM install, integration, verify, bundle, and publish commands.',
    nativeContract:
      'Understand native contract hashing, Hermes and New Architecture compatibility, and when React Native OTA must be blocked.',
    globalState:
      'Provide host-owned sharedState to React Native micro frontends and read it safely with useMicroFrontendSharedState.',
  },
  ko: {
    suffix: `${brand} 한국어 문서`,
    overview:
      'Expo 지원, Hot Updater 호환, Host shared state, native contract 검증을 제공하는 React Native micro frontend 한국어 가이드입니다.',
    docs: '설치, 설정, MFE 등록, Host 상태 전달, native contract 검증, 안전한 배포까지 정리한 한국어 문서입니다.',
    gettingStarted:
      'React Native MFE를 처음 시작하기 위한 설치, Host policy 설정, module 등록, native safety 검증, runtime 로딩 가이드입니다.',
    easyWay:
      'React Native MFE Easy Way 가이드입니다. OTA 없는 Bundle, Hot Updater/custom OTA delivery, Expo EAS Update 중 맞는 경로를 고릅니다.',
    options:
      'Host config, MFE config, registry manifest, runtime Provider, hook, screen API의 모든 옵션을 정리한 레퍼런스입니다.',
    hotUpdater:
      'Hot Updater 앞단에 native-safety verification을 추가해 React Native MFE OTA를 안전하게 배포하는 방법입니다.',
    metroBundle:
      'withMfe로 Metro를 설정하고 Host-owned bundle archive loader로 portable rnm bundle archive를 로드하는 방법입니다.',
    packageManagers:
      'Bun, npm, pnpm, Yarn, Deno에서 RNM 설치, 통합, 검증, bundle, publish command를 실행하는 방법입니다.',
    nativeContract:
      'native hash, Hermes, New Architecture 호환성, OTA 차단 기준을 설명하는 한국어 문서입니다.',
    globalState:
      'Host가 제공한 sharedState를 React Native MFE에서 useMicroFrontendSharedState로 안전하게 읽는 방법입니다.',
  },
  'zh-CN': {
    suffix: `${brand} 简体中文文档`,
    overview:
      '面向 React Native/Expo micro frontend 的 native-safe delivery、Hot Updater 集成与 Host shared state 指南。',
    docs: '完整的简体中文文档：安装、配置、注册 MFE、传递 Host 状态、校验 native contract 并安全发布。',
    gettingStarted:
      'React Native MFE 入门指南：安装 package、声明 Host policy、注册 module、校验 native safety 并通过 runtime 加载。',
    easyWay:
      'React Native MFE Easy Way 指南：在无 OTA publish 的 Bundle、Hot Updater/custom OTA delivery、Expo EAS Update 中选择合适路径。',
    options:
      '完整选项参考：Host config、MFE config、registry manifest、runtime Provider、hooks 与 screen API。',
    hotUpdater:
      '在 Hot Updater 前加入 native-safety verification，安全发布 React Native MFE OTA。',
    metroBundle:
      '使用 withMfe 配置 Metro，并通过 Host-owned bundle archive loader 加载 portable rnm bundle archive。',
    packageManagers:
      '使用 Bun、npm、pnpm、Yarn、Deno 执行 RNM 安装、集成、校验、bundle 与 publish command。',
    nativeContract:
      '解释 native hash、Hermes、New Architecture compatibility 以及何时必须阻止 OTA。',
    globalState:
      '说明如何在 React Native MFE 中通过 useMicroFrontendSharedState 安全读取 Host sharedState。',
  },
  ja: {
    suffix: `${brand} 日本語ドキュメント`,
    overview:
      'React Native/Expo micro frontend の native-safe delivery、Hot Updater 連携、Host shared state の日本語ガイドです。',
    docs: 'install、config、MFE registration、Host state、native contract verification、安全な publish までの日本語ドキュメントです。',
    gettingStarted:
      'React Native MFE の入門ガイドです。install、Host policy、module registration、native safety verification、runtime loading を説明します。',
    easyWay:
      'React Native MFE Easy Way guide です。OTA publish なしの Bundle、Hot Updater/custom OTA delivery、Expo EAS Update から選びます。',
    options:
      'Host config、MFE config、registry manifest、runtime Provider、hooks、screen API の全 option reference です。',
    hotUpdater:
      'Hot Updater の前段に native-safety verification を追加し、React Native MFE OTA を安全に公開します。',
    metroBundle:
      'withMfe で Metro を設定し、Host-owned bundle archive loader で portable rnm bundle archive を読み込みます。',
    packageManagers:
      'Bun、npm、pnpm、Yarn、Deno で RNM install、integration、verify、bundle、publish command を実行します。',
    nativeContract:
      'native hash、Hermes、New Architecture compatibility、OTA を止める条件を説明します。',
    globalState:
      'Host が提供する sharedState を React Native MFE 内で useMicroFrontendSharedState により安全に読み取る方法です。',
  },
} satisfies Record<Locale, Record<string, string>>;

type SeoSection =
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

const titles: Record<SeoSection, string> = {
  overview: 'Native-safe React Native Micro Frontends',
  docs: 'Documentation',
  gettingStarted: 'Getting Started',
  easyWay: 'Easy Way',
  options: 'Options Reference',
  hotUpdater: 'Hot Updater Setup',
  metroBundle: 'Metro / Bundle Archive',
  packageManagers: 'Package Managers and CLI Commands',
  nativeContract: 'Native Contract Guide',
  globalState: 'Global State Guide',
} as const;

const localizedTitles = {
  en: titles,
  ko: {
    overview: 'Native-safe React Native Micro Frontend',
    docs: '한국어 문서',
    gettingStarted: 'Getting Started',
    easyWay: '쉬운 사용법',
    options: '옵션 레퍼런스',
    hotUpdater: 'Hot Updater 설정',
    metroBundle: 'Metro / Bundle Archive',
    packageManagers: '패키지 매니저와 CLI 명령어',
    nativeContract: 'Native Contract 가이드',
    globalState: '전역 상태 가이드',
  },
  'zh-CN': {
    overview: 'Native-safe React Native Micro Frontend',
    docs: '简体中文文档',
    gettingStarted: 'Getting Started',
    easyWay: '简单用法',
    options: '选项参考',
    hotUpdater: 'Hot Updater 设置',
    metroBundle: 'Metro / Bundle Archive',
    packageManagers: '包管理器与 CLI 命令',
    nativeContract: 'Native Contract 指南',
    globalState: '全局状态指南',
  },
  ja: {
    overview: 'Native-safe React Native Micro Frontend',
    docs: '日本語ドキュメント',
    gettingStarted: 'Getting Started',
    easyWay: '簡単な使い方',
    options: 'Options reference',
    hotUpdater: 'Hot Updater 設定',
    metroBundle: 'Metro / Bundle Archive',
    packageManagers: 'Package managers と CLI command',
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

  if (route.startsWith('/docs/getting-started')) return 'gettingStarted';
  if (route.startsWith('/docs/easy-way')) return 'easyWay';
  if (route.startsWith('/docs/options')) return 'options';
  if (route.startsWith('/docs/hot-updater')) return 'hotUpdater';
  if (route.startsWith('/docs/metro-bundle-archive')) return 'metroBundle';
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
