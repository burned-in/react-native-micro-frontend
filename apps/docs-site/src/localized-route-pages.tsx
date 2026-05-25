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
    basePath: '/ko',
    homeEyebrow: 'React Native Micro Frontend',
    homeTitle: 'Native-safe 기능 모듈을 멋진 OTA workflow로 배포하세요.',
    homeSubtitle:
      'React Native feature module을 독립적으로 배포하고, native binary compatibility를 검증한 뒤 Host가 안전하게 로드할 수 있을 때만 Hot Updater로 publish합니다.',
    docsCta: '문서 보기',
    matrixCta: '패키지 매니저 표',
    docsEyebrow: '한국어 문서',
    hotTitle: 'Hot Updater 설정',
    hotSubtitle:
      '기존 OTA engine을 바꾸지 않고 Hot Updater 앞단에 native-safety check를 추가하는 route입니다.',
    packageTitle: '패키지 매니저 표',
    packageSubtitle:
      'Repository는 Bun 우선이지만 consumer project는 Bun, npm, pnpm, Yarn, Deno를 사용할 수 있습니다.',
    nativeTitle: 'Native contract',
    nativeSubtitle:
      'native hash가 무엇을 의미하고 왜 안전하지 않은 JavaScript update를 막아야 하는지 설명합니다.',
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
    basePath: '/zh-cn',
    homeEyebrow: 'React Native Micro Frontend',
    homeTitle: '用精致的 OTA workflow 发布 native-safe 功能模块。',
    homeSubtitle:
      '独立发布 React Native feature modules，验证 native binary compatibility，并且只在 Host 可安全加载时通过 Hot Updater 发布。',
    docsCta: '查看文档',
    matrixCta: '包管理器矩阵',
    docsEyebrow: '简体中文文档',
    hotTitle: 'Hot Updater 设置',
    hotSubtitle:
      '不替换现有 OTA engine，而是在 Hot Updater 前面加入 native-safety check。',
    packageTitle: '包管理器矩阵',
    packageSubtitle:
      'Repository 优先使用 Bun，但 consumer project 可使用 Bun、npm、pnpm、Yarn、Deno。',
    nativeTitle: 'Native contract',
    nativeSubtitle:
      '说明 native hash 的含义，以及为什么必须阻止不安全的 JavaScript update。',
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
    basePath: '/jp',
    homeEyebrow: 'React Native Micro Frontend',
    homeTitle:
      'native-safe な feature module を洗練された OTA workflow で公開します。',
    homeSubtitle:
      'React Native feature modules を独立して公開し、native binary compatibility を検証し、Host が安全にロードできる場合だけ Hot Updater で publish します。',
    docsCta: 'ドキュメントを見る',
    matrixCta: 'Package manager 一覧',
    docsEyebrow: '日本語ドキュメント',
    hotTitle: 'Hot Updater 設定',
    hotSubtitle:
      '既存の OTA engine を置き換えず、Hot Updater の前段に native-safety check を追加する route です。',
    packageTitle: 'Package manager 一覧',
    packageSubtitle:
      'Repository は Bun 優先ですが、consumer project は Bun、npm、pnpm、Yarn、Deno を使用できます。',
    nativeTitle: 'Native contract',
    nativeSubtitle:
      'native hash の意味と、安全でない JavaScript update を止める理由を説明します。',
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
    readonly basePath: string;
    readonly homeEyebrow: string;
    readonly homeTitle: string;
    readonly homeSubtitle: string;
    readonly docsCta: string;
    readonly matrixCta: string;
    readonly docsEyebrow: string;
    readonly hotTitle: string;
    readonly hotSubtitle: string;
    readonly packageTitle: string;
    readonly packageSubtitle: string;
    readonly nativeTitle: string;
    readonly nativeSubtitle: string;
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
          href: `${config.basePath}/docs/package-managers`,
        }}
      />
      <FeatureGrid features={config.guide.cards} />
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
        cards={config.guide.cards}
      />
      <SectionList sections={config.guide.sections} />
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
    `${basePath}/docs/hot-updater`,
    `${basePath}/docs/package-managers`,
    `${basePath}/docs/native-contract`,
    `${basePath}/docs/global-state`,
  ];

  return (
    <section className={grid({ columns: { base: 1, md: 2, xl: 4 }, gap: '5' })}>
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
