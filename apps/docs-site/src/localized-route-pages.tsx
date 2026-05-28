import { css } from '../styled-system/css';
import { grid, stack } from '../styled-system/patterns';
import {
  installMatrix,
  type LocalizedGuide,
  localizedGuides,
} from './content.js';
import { withSiteBase } from './site-base.js';
import {
  FeatureGrid,
  Hero,
  MatrixTable,
  PageHeader,
  SectionList,
  ShellSection,
} from './ui.js';

export type LocaleCode = 'ko' | 'zh' | 'jp';

const localeConfig = {
  ko: {
    guide: localizedGuides.ko,
    cards: [
      { title: 'Getting Started', body: '설치부터 runtime loading까지 복사/붙여넣기로 따라가는 첫 MFE 가이드입니다.' },
      { title: '쉬운 사용법', body: 'Bundle archive, Hot Updater/custom OTA, Expo EAS Update 중 하나를 먼저 고릅니다.' },
      { title: 'Hot Updater 설정', body: 'Hot Updater 배포는 유지하고 RNM은 native-unsafe OTA를 publish 전에 막습니다.' },
      { title: 'Metro / bundle archive', body: 'manifest.json, index.bundle, 참조 asset만 포함한 Metro-first archive를 만듭니다.' },
      { title: '패키지 매니저 & CLI', body: 'Bun, npm, pnpm, Yarn, Deno에서 같은 RNM command를 실행합니다.' },
      { title: 'Options reference', body: 'Host config, MFE config, registry, runtime option의 소유 파일을 찾습니다.' },
      { title: 'Native contract', body: '어떤 변경이 OTA-safe이고 어떤 변경이 Store release인지 판단합니다.' },
      { title: 'Re.Pack 비교', body: 'RNM의 Metro-first native-safety와 Re.Pack Module Federation architecture를 비교합니다.' },
      { title: '전역 상태', body: 'Host session, locale, feature flag, tenant context를 MFE에 안전하게 전달합니다.' },
    ],
    basePath: '/ko',
    homeEyebrow: 'React Native Micro Frontend',
    homeTitle: 'Native-safe 기능 모듈을 멋진 OTA workflow로 배포하세요.',
    homeSubtitle:
      'React Native feature module을 독립적으로 배포하고, native binary compatibility를 검증한 뒤 Host가 안전하게 로드할 수 있을 때만 Hot Updater로 publish합니다.',
    docsCta: '문서 보기',
    matrixCta: 'Hot Updater GitHub',
    docsEyebrow: '한국어 문서',
    gettingStartedTitle: 'Getting Started',
    gettingStartedSubtitle:
      '처음 설치부터 첫 MFE 등록, native-safety verification, runtime 로딩까지 바로 따라갈 수 있는 시작 가이드입니다.',
    easyWayTitle: '쉬운 사용법',
    easyWaySubtitle:
      'bundle, Hot Updater/OTA, Expo 중 현재 project에 맞는 적용 방식을 고릅니다.',
    optionsTitle: 'Options reference',
    optionsSubtitle:
      'Host config, MFE config, registry manifest, runtime Provider와 hook의 가능한 옵션을 모두 설명합니다.',
    hotTitle: 'Hot Updater 설정',
    hotSubtitle:
      '기존 OTA engine을 바꾸지 않고 Hot Updater 앞단에 native-safety check를 추가하는 route입니다.',
    metroBundleTitle: 'Metro / Bundle archive',
    metroBundleSubtitle:
      'withMfe로 Metro를 merge하고, rnm bundle archive를 createBundleArchiveLoader에 연결하는 방법입니다.',
    packageTitle: '패키지 매니저 표',
    packageSubtitle:
      'Repository는 Bun 우선이지만 consumer project는 Bun, npm, pnpm, Yarn, Deno로 설치, 통합, 검증, bundle, publish를 실행할 수 있습니다.',
    nativeTitle: 'Native contract',
    nativeSubtitle:
      'native hash가 무엇을 의미하고 왜 안전하지 않은 JavaScript update를 막아야 하는지 설명합니다.',
    repackTitle: 'RNM vs Re.Pack',
    repackSubtitle:
      'RNM의 Metro-first native-safety/Host-owned loader 방식과 Re.Pack 5.x의 Rspack/Webpack Module Federation runtime chunk 방식을 비교합니다.',
    globalStateTitle: '전역 상태 가져오기',
    globalStateSubtitle:
      'Host가 제공한 typed sharedState를 MFE에서 안전하게 읽는 방법입니다.',
    tableHeaders: [
      '도구',
      'Runtime 설치',
      'CLI 설치',
      '한 번 실행',
      '배포',
    ] as const,
  },
  zh: {
    guide: localizedGuides.zh,
    cards: [
      { title: 'Getting Started', body: '从安装到 runtime loading，按步骤复制粘贴完成第一个 MFE。' },
      { title: '简单用法', body: '先在 Bundle archive、Hot Updater/custom OTA、Expo EAS Update 中选择一条路径。' },
      { title: 'Hot Updater 设置', body: '保留 Hot Updater 交付，由 RNM 在发布前阻止 native-unsafe OTA。' },
      { title: 'Metro / bundle archive', body: '生成只包含 manifest.json、index.bundle 和已引用 assets 的 Metro-first archive。' },
      { title: '包管理器 & CLI', body: '用 Bun、npm、pnpm、Yarn、Deno 运行同一组 RNM command。' },
      { title: 'Options reference', body: '找到 Host config、MFE config、registry、runtime option 分别属于哪个文件。' },
      { title: 'Native contract', body: '判断哪些变更是 OTA-safe，哪些必须走 Store release。' },
      { title: 'Re.Pack 对比', body: '比较 RNM 的 Metro-first native-safety 与 Re.Pack Module Federation architecture。' },
      { title: '全局状态', body: '把 Host session、locale、feature flag、tenant context 安全传给 MFE。' },
    ],
    basePath: '/zh-cn',
    homeEyebrow: 'React Native Micro Frontend',
    homeTitle: '用精致的 OTA workflow 发布 native-safe 功能模块。',
    homeSubtitle:
      '独立发布 React Native feature modules，验证 native binary compatibility，并且只在 Host 可安全加载时通过 Hot Updater 发布。',
    docsCta: '查看文档',
    matrixCta: 'Hot Updater GitHub',
    docsEyebrow: '简体中文文档',
    gettingStartedTitle: 'Getting Started',
    gettingStartedSubtitle:
      '从首次安装到第一个 MFE 注册、native-safety verification 与 runtime 加载的入门指南。',
    easyWayTitle: '简单用法',
    easyWaySubtitle:
      '在 bundle、Hot Updater/OTA、Expo 中选择适合当前 project 的接入方式。',
    optionsTitle: 'Options reference',
    optionsSubtitle:
      '说明 Host config、MFE config、registry manifest、runtime Provider 与 hooks 的所有可用选项。',
    hotTitle: 'Hot Updater 设置',
    hotSubtitle:
      '不替换现有 OTA engine，而是在 Hot Updater 前面加入 native-safety check。',
    metroBundleTitle: 'Metro / Bundle archive',
    metroBundleSubtitle:
      '使用 withMfe merge Metro，并把 rnm bundle archive 接入 createBundleArchiveLoader。',
    packageTitle: '包管理器矩阵',
    packageSubtitle:
      'Repository 优先使用 Bun，但 consumer project 可用 Bun、npm、pnpm、Yarn、Deno 执行安装、集成、校验、bundle 与 publish。',
    nativeTitle: 'Native contract',
    nativeSubtitle:
      '说明 native hash 的含义，以及为什么必须阻止不安全的 JavaScript update。',
    repackTitle: 'RNM vs Re.Pack',
    repackSubtitle:
      '比较 RNM 的 Metro-first native-safety/Host-owned loader 与 Re.Pack 5.x 的 Rspack/Webpack Module Federation runtime chunk。',
    globalStateTitle: '读取全局状态',
    globalStateSubtitle: '在 MFE 中安全读取 Host 提供的 typed sharedState。',
    tableHeaders: [
      '工具',
      'Runtime 安装',
      'CLI 安装',
      '首次运行',
      '发布',
    ] as const,
  },
  jp: {
    guide: localizedGuides.ja,
    cards: [
      { title: 'Getting Started', body: 'install から runtime loading まで copy/paste で最初の MFE を作ります。' },
      { title: '簡単な使い方', body: 'Bundle archive、Hot Updater/custom OTA、Expo EAS Update から 1 つ選びます。' },
      { title: 'Hot Updater 設定', body: 'Hot Updater delivery は維持し、RNM が native-unsafe OTA を publish 前に止めます。' },
      { title: 'Metro / bundle archive', body: 'manifest.json、index.bundle、参照 asset だけを含む Metro-first archive を作ります。' },
      { title: 'Package managers & CLI', body: 'Bun、npm、pnpm、Yarn、Deno で同じ RNM command を実行します。' },
      { title: 'Options reference', body: 'Host config、MFE config、registry、runtime option の owner file を確認します。' },
      { title: 'Native contract', body: 'どの変更が OTA-safe で、どれが Store release か判断します。' },
      { title: 'Re.Pack 比較', body: 'RNM の Metro-first native-safety と Re.Pack Module Federation architecture を比較します。' },
      { title: 'Global state', body: 'Host session、locale、feature flag、tenant context を MFE に安全に渡します。' },
    ],
    basePath: '/jp',
    homeEyebrow: 'React Native Micro Frontend',
    homeTitle:
      'native-safe な feature module を洗練された OTA workflow で公開します。',
    homeSubtitle:
      'React Native feature modules を独立して公開し、native binary compatibility を検証し、Host が安全にロードできる場合だけ Hot Updater で publish します。',
    docsCta: 'ドキュメントを見る',
    matrixCta: 'Hot Updater GitHub',
    docsEyebrow: '日本語ドキュメント',
    gettingStartedTitle: 'Getting Started',
    gettingStartedSubtitle:
      '初回 install から最初の MFE registration、native-safety verification、runtime loading まで進める入門ガイドです。',
    easyWayTitle: '簡単な使い方',
    easyWaySubtitle:
      'bundle、Hot Updater/OTA、Expo から current project に合う path を選びます。',
    optionsTitle: 'Options reference',
    optionsSubtitle:
      'Host config、MFE config、registry manifest、runtime Provider と hooks の使用可能な option をすべて説明します。',
    hotTitle: 'Hot Updater 設定',
    hotSubtitle:
      '既存の OTA engine を置き換えず、Hot Updater の前段に native-safety check を追加する route です。',
    metroBundleTitle: 'Metro / Bundle archive',
    metroBundleSubtitle:
      'withMfe で Metro を merge し、rnm bundle archive を createBundleArchiveLoader に接続する方法です。',
    packageTitle: 'Package manager 一覧',
    packageSubtitle:
      'Repository は Bun 優先ですが、consumer project は Bun、npm、pnpm、Yarn、Deno で install、integration、verify、bundle、publish を実行できます。',
    nativeTitle: 'Native contract',
    nativeSubtitle:
      'native hash の意味と、安全でない JavaScript update を止める理由を説明します。',
    repackTitle: 'RNM vs Re.Pack',
    repackSubtitle:
      'RNM の Metro-first native-safety/Host-owned loader と Re.Pack 5.x の Rspack/Webpack Module Federation runtime chunk を比較します。',
    globalStateTitle: 'Global state を取得する',
    globalStateSubtitle:
      'Host が提供する typed sharedState を MFE 内で安全に読み取る方法です。',
    tableHeaders: [
      'Tool',
      'Runtime install',
      'CLI install',
      '初回実行',
      '公開',
    ] as const,
  },
} satisfies Record<
  LocaleCode,
  {
    readonly guide: LocalizedGuide;
    readonly cards: readonly { readonly title: string; readonly body: string }[];
    readonly basePath: string;
    readonly homeEyebrow: string;
    readonly homeTitle: string;
    readonly homeSubtitle: string;
    readonly docsCta: string;
    readonly matrixCta: string;
    readonly docsEyebrow: string;
    readonly gettingStartedTitle: string;
    readonly gettingStartedSubtitle: string;
    readonly easyWayTitle: string;
    readonly easyWaySubtitle: string;
    readonly optionsTitle: string;
    readonly optionsSubtitle: string;
    readonly hotTitle: string;
    readonly hotSubtitle: string;
    readonly metroBundleTitle: string;
    readonly metroBundleSubtitle: string;
    readonly packageTitle: string;
    readonly packageSubtitle: string;
    readonly nativeTitle: string;
    readonly nativeSubtitle: string;
    readonly repackTitle: string;
    readonly repackSubtitle: string;
    readonly globalStateTitle: string;
    readonly globalStateSubtitle: string;
    readonly tableHeaders: readonly [string, string, string, string, string];
  }
>;

export function LocalizedHomeRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <Hero
        eyebrow={config.homeEyebrow}
        title={config.homeTitle}
        subtitle={config.homeSubtitle}
        primaryCta={{ label: config.docsCta, href: `${config.basePath}/docs` }}
        secondaryCta={{
          label: config.matrixCta,
          href: 'https://github.com/gronxb/hot-updater',
        }}
      />
      <FeatureGrid features={config.cards} />
      <SectionList sections={config.guide.sections} />
    </ShellSection>
  );
}

export function LocalizedDocsRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.guide.title}
        subtitle={config.guide.subtitle}
        eyebrow={config.docsEyebrow}
      />
      <LocalizedRouteCards
        basePath={config.basePath}
        cards={config.cards}
      />
      <SectionList sections={config.guide.sections} />
    </ShellSection>
  );
}

export function LocalizedGettingStartedRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.gettingStartedTitle}
        subtitle={config.gettingStartedSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.gettingStartedSections.slice(0, 8)} />
    </ShellSection>
  );
}

export function LocalizedEasyWayRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.easyWayTitle}
        subtitle={config.easyWaySubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.easyWaySections} />
    </ShellSection>
  );
}

export function LocalizedOptionsRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.optionsTitle}
        subtitle={config.optionsSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.optionsSections} />
    </ShellSection>
  );
}

export function LocalizedHotUpdaterRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.hotTitle}
        subtitle={config.hotSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.hotUpdaterSections} />
    </ShellSection>
  );
}

export function LocalizedMetroBundleRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.metroBundleTitle}
        subtitle={config.metroBundleSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.metroBundleSections} />
    </ShellSection>
  );
}

export function LocalizedPackageManagersRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.packageTitle}
        subtitle={config.packageSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <MatrixTable rows={installMatrix} headers={config.tableHeaders} />
      <SectionList sections={config.guide.cliCommandSections} />
    </ShellSection>
  );
}

export function LocalizedNativeContractRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.nativeTitle}
        subtitle={config.nativeSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.nativeContractSections} />
    </ShellSection>
  );
}

export function LocalizedRepackComparisonRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.repackTitle}
        subtitle={config.repackSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.repackComparisonSections} />
    </ShellSection>
  );
}

export function LocalizedGlobalStateRoute({
  locale,
}: {
  readonly locale: LocaleCode;
}) {
  const config = localeConfig[locale];

  return (
    <ShellSection>
      <PageHeader
        title={config.globalStateTitle}
        subtitle={config.globalStateSubtitle}
        eyebrow={config.docsEyebrow}
      />
      <SectionList sections={config.guide.globalStateSections} />
    </ShellSection>
  );
}

function LocalizedRouteCards({
  basePath,
  cards,
}: {
  readonly basePath: string;
  readonly cards: LocalizedGuide['cards'];
}) {
  const hrefs = [
    `${basePath}/docs/getting-started`,
    `${basePath}/docs/easy-way`,
    `${basePath}/docs/hot-updater`,
    `${basePath}/docs/metro-bundle-archive`,
    `${basePath}/docs/package-managers`,
    `${basePath}/docs/options`,
    `${basePath}/docs/native-contract`,
    `${basePath}/docs/repack-comparison`,
    `${basePath}/docs/global-state`,
  ];

  return (
    <section className={grid({ columns: { base: 1, md: 2, xl: 3 }, gap: '5' })}>
      {cards.map((card, index) => (
        <a
          key={card.title}
          href={withSiteBase(hrefs[index] ?? `${basePath}/docs`)}
          className={routeCard()}
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
  );
}

const routeCard = () =>
  css({
    display: 'block',
    minW: '0',
    rounded: '3xl',
    borderWidth: '1px',
    borderColor: 'line',
    bg: 'surface',
    shadow: 'card',
    p: { base: '5', md: '6' },
    transition: 'all 160ms ease',
    _hover: {
      transform: 'translateY(-3px)',
      borderColor: 'accent',
    },
  });
