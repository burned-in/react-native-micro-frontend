export type NavItem = {
  readonly label: string;
  readonly href: string;
};

export type Feature = {
  readonly title: string;
  readonly body: string;
};

export type DocSection = {
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly code?: string;
  readonly cards?: readonly Feature[];
};

export const navItems: readonly NavItem[] = [
  { label: 'Overview', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Hot Updater', href: '/docs/hot-updater' },
  { label: 'Package managers', href: '/docs/package-managers' },
  { label: 'Native contract', href: '/docs/native-contract' },
  { label: '한국어', href: '/ko/docs' },
  { label: '中文', href: '/zh-cn/docs' },
  { label: '日本語', href: '/jp/docs' },
];

export const packageManagers = ['Bun', 'npm', 'pnpm', 'Yarn', 'Deno'] as const;

export const installMatrix = [
  {
    tool: 'Bun',
    runtime: 'bun add @bunin/react-native-micro-frontend',
    cli: 'bun add -d @bunin/react-native-micro-frontend-cli',
    run: 'bunx @bunin/react-native-micro-frontend-cli init',
    release: 'bun run release:publish',
  },
  {
    tool: 'npm',
    runtime: 'npm install @bunin/react-native-micro-frontend',
    cli: 'npm install --save-dev @bunin/react-native-micro-frontend-cli',
    run: 'npx @bunin/react-native-micro-frontend-cli init',
    release: 'npm run release:publish',
  },
  {
    tool: 'pnpm',
    runtime: 'pnpm add @bunin/react-native-micro-frontend',
    cli: 'pnpm add -D @bunin/react-native-micro-frontend-cli',
    run: 'pnpm dlx @bunin/react-native-micro-frontend-cli init',
    release: 'pnpm run release:publish',
  },
  {
    tool: 'Yarn',
    runtime: 'yarn add @bunin/react-native-micro-frontend',
    cli: 'yarn add -D @bunin/react-native-micro-frontend-cli',
    run: 'yarn dlx @bunin/react-native-micro-frontend-cli init',
    release: 'yarn release:publish',
  },
  {
    tool: 'Deno',
    runtime: 'deno add npm:@bunin/react-native-micro-frontend',
    cli: 'deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli',
    run: 'deno run -A npm:@bunin/react-native-micro-frontend-cli init',
    release: 'deno task release:publish',
  },
] as const;

export const features: readonly Feature[] = [
  {
    title: 'Native-safe OTA',
    body: 'OTA is allowed only when React Native, Hermes, New Architecture, and native dependency assumptions still match the host binary.',
  },
  {
    title: 'Registry-first runtime',
    body: 'Every feature module has a version, entry point, native hash, OTA policy, and runtime state that the host can inspect before loading.',
  },
  {
    title: 'Hot Updater compatible',
    body: 'The library wraps and verifies Hot Updater workflows instead of replacing your existing OTA delivery engine.',
  },
  {
    title: 'Host-provided state',
    body: 'The host can intentionally provide session, locale, feature flags, or analytics context to feature modules through runtime hooks.',
  },
  {
    title: 'Package-manager neutral',
    body: 'Consumer projects can use Bun, npm, pnpm, Yarn, or Deno while the repository release pipeline remains Bun-first.',
  },
  {
    title: 'Reviewable integration',
    body: 'Generated Podfile, Gradle, and Metro include files are explicit artifacts; the CLI avoids silent native patching.',
  },
];

export const homeSections: readonly DocSection[] = [
  {
    eyebrow: 'Development status',
    title: 'Active development on the 0.x line.',
    body: [
      'This project is still being hardened across the runtime, CLI, native-contract checks, and Hot Updater adapter workflows.',
      'Pin exact package versions before production use, run native compatibility checks in CI, and expect API refinements while the 0.x line evolves.',
    ],
    code: `status: active development
license: MIT
beerware spirit: appreciated, not the legal package license`,
  },
  {
    eyebrow: 'Core concept',
    title: 'Separate JavaScript delivery from native binary risk.',
    body: [
      'React Native apps have two deployment surfaces: JavaScript that can usually ship through OTA, and native code that requires an app store release.',
      'This library records the native contract of the host and every feature module, then blocks unsafe OTA before runtime or publish time.',
    ],
    code: `if nativeContractChanged
  block OTA
  require store release
else if moduleBlocked
  block runtime load
else
  allow Hot Updater deploy`,
  },
  {
    eyebrow: 'Install',
    title: 'Start with Bun, keep every package manager supported.',
    body: [
      'Bun is the preferred local workflow for this repository. Consumer apps can still install and run the CLI with npm, pnpm, Yarn, or Deno.',
    ],
    code: `bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init`,
  },
  {
    eyebrow: 'First module',
    title: 'A beginner-friendly path from empty host to verified module.',
    body: [
      'Initialize the host, register one feature module, verify native compatibility, then publish only after the safety check passes.',
      'The sample name is intentionally generic so teams can replace it with checkout, profile, support, payments, or any product feature.',
    ],
    code: `rnm init
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production`,
  },
];

export const docsSections: readonly DocSection[] = [
  {
    eyebrow: 'Configuration',
    title: 'Declare policy once, let the CLI enforce it.',
    body: [
      'The config file describes React Native support, OTA provider, native-change policy, package-manager strategy, and registered feature modules.',
      'The defaults are conservative: generated files first, manual native integration, strict package sharing, and explicit native-change decisions.',
    ],
    code: `import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: { enabled: true, provider: "hot-updater", mode: "manual" },
  nativeChangePolicy: "ask",
  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },
  mfes: {},
});`,
  },
  {
    eyebrow: 'CLI flow',
    title: 'Initialize, register, verify, publish.',
    body: [
      'The CLI generates reviewable integration files, registers feature modules, compares native contracts, and prints Hot Updater deploy commands only after OTA safety checks pass.',
    ],
    code: `rnm init
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production`,
  },
  {
    eyebrow: 'Runtime',
    title: 'Load feature modules through an explicit runtime policy.',
    body: [
      'The runtime reads the registry and refuses blocked modules, missing modules, and native-hash mismatches. The host owns the fallback UI.',
    ],
    code: `import { MicroFrontendProvider, MicroFrontendScreen } from "@bunin/react-native-micro-frontend/runtime";

export function App({ registry }) {
  return (
    <MicroFrontendProvider registry={registry}>
      <MicroFrontendScreen name="mfe-feature" fallback={<Loading />} />
    </MicroFrontendProvider>
  );
}`,
  },
  {
    eyebrow: 'Global state',
    title: 'Get host-owned global state inside an MFE.',
    body: [
      'Pass a small typed sharedState snapshot from the host into MicroFrontendProvider, then read it inside any MFE with useMicroFrontendSharedState<T>().',
      'Use useIsMfe() when shared components need to know whether they are rendering in the host shell or in a host-mounted MFE subtree.',
      'Use this for read-oriented values such as session identity, locale, feature flags, tenant, experiment bucket, or analytics context. Do not put secrets, large caches, or native-only handles in sharedState.',
      'The host remains the source of truth. When an MFE needs to change global state, call a host-owned command, event, or typed callback instead of mutating the host store directly.',
    ],
    code: `import {
  MicroFrontendProvider,
  useIsMfe,
  useMicroFrontendSharedState,
} from "@bunin/react-native-micro-frontend/runtime";

export type HostSharedState = {
  readonly session?: { readonly userId: string };
  readonly locale: "en-US" | "ko-KR" | "zh-CN" | "ja-JP";
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly tenant?: { readonly id: string };
};

const sharedState: HostSharedState = {
  session: { userId: "user_123" },
  locale: "ko-KR",
  featureFlags: { checkoutV2: true, profileMfe: true },
  tenant: { id: "bunin" },
};

export function MountedFeatureModule({ registry }) {
  return (
    <MicroFrontendProvider isMfe registry={registry} sharedState={sharedState}>
      <FeatureModuleHeader />
    </MicroFrontendProvider>
  );
}

export function FeatureModuleHeader() {
  const isMfe = useIsMfe();
  const host = useMicroFrontendSharedState<HostSharedState>();
  const userId = host.session?.userId ?? "guest";
  const checkoutV2 = host.featureFlags.checkoutV2 ?? false;

  return <Text>{isMfe ? "MFE" : "Host"} · {host.locale} · {userId} · checkoutV2={String(checkoutV2)}</Text>;
}`,
  },
];

const globalStateSection = docsSections[3];

if (!globalStateSection) {
  throw new Error('Global state documentation section is missing.');
}

export const globalStateSections: readonly DocSection[] = [globalStateSection];

export const hotUpdaterSections: readonly DocSection[] = [
  {
    eyebrow: 'Hot Updater route',
    title:
      'Keep Hot Updater as delivery, add native-safety verification before it.',
    body: [
      'This library does not replace Hot Updater. It verifies whether a feature module is eligible for OTA, then lets Hot Updater perform the deployment.',
      'Use this page as the routed setup guide for teams that already have Hot Updater or are adding it to a host app.',
    ],
    code: `import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: {
    enabled: true,
    provider: "hot-updater",
    mode: "manual",
    existingHotUpdater: {
      strategy: "reuse",
      configPath: "./hot-updater.config.ts",
    },
  },
  nativeChangePolicy: "ask",
  mfes: {},
});`,
  },
  {
    eyebrow: 'Adapter',
    title: 'Wrap the existing Hot Updater config with MFE metadata.',
    body: [
      'The adapter keeps the Hot Updater config readable while adding registry metadata used by verification and publish commands.',
      'Generated deployment commands are printed only after the CLI confirms that OTA is safe for the selected module.',
    ],
    code: `import { withReactNativeMicroFrontend } from "@bunin/react-native-micro-frontend-hot-updater-adapter";

export default withReactNativeMicroFrontend({
  hotUpdaterConfig: {
    // Keep your existing Hot Updater options here.
  },
  mfe: {
    name: "mfe-feature",
    version: "1.0.0",
    entry: "./src/index.tsx",
  },
});`,
  },
  {
    eyebrow: 'Publish',
    title: 'Verify first, deploy second.',
    body: [
      'Use the package-manager matrix when host teams use different tools. The safety rule is identical; only the command runner changes.',
    ],
    code: `rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Generated command after verification
bunx hot-updater deploy -p ios -c production`,
  },
];

export const nativeContractSections: readonly DocSection[] = [
  {
    eyebrow: 'Native contract',
    title: 'A native hash captures assumptions that JavaScript cannot change.',
    body: [
      'The native contract includes React Native version, Hermes, New Architecture, relevant package native dependencies, Podfile.lock pods, Gradle dependencies, AndroidManifest permissions, and selected Info.plist inputs.',
      'When a contract changes, OTA is blocked and a native release is required.',
    ],
    code: `nativeHash = hash(
  reactNativeVersion
  + hermes
  + newArchitecture
  + nativeDependencies
  + pods
  + gradle
  + androidManifest
  + infoPlist
)`,
  },
  {
    eyebrow: 'Decision rule',
    title: 'OTA is an optimization, not an escape hatch.',
    body: [
      'JS-only changes are eligible for OTA. Native ABI changes, dependency changes, runtime flag changes, and host/module native-hash mismatches require a store release.',
    ],
    code: `React Native version changed -> store release
Hermes changed -> store release
New Architecture changed -> store release
Native dependency changed -> store release
Native hash mismatch -> store release
Module blocked -> runtime blocked`,
  },
];

export type LocalizedGuide = {
  readonly title: string;
  readonly subtitle: string;
  readonly cards: readonly Feature[];
  readonly sections: readonly DocSection[];
  readonly hotUpdaterSections: readonly DocSection[];
  readonly globalStateSections: readonly DocSection[];
  readonly nativeContractSections: readonly DocSection[];
};

const localizedGuidesShared = {
  koGlobalState: {
    eyebrow: '전역 상태',
    title: 'MFE 안에서 Host 전역 상태를 가져옵니다.',
    body: [
      'Host는 작은 typed sharedState snapshot을 MicroFrontendProvider에 전달하고, MFE는 useMicroFrontendSharedState<T>()로 읽습니다.',
      '같은 component가 Host shell과 MFE subtree 양쪽에서 실행될 수 있으면 useIsMfe()로 현재 위치를 구분합니다.',
      'session identity, locale, feature flag, tenant, experiment bucket, analytics context처럼 read-oriented 값에만 사용합니다. secret, 큰 cache, native-only handle은 넣지 않습니다.',
      'source of truth는 Host에 남깁니다. Feature module은 global store를 직접 소유하지 않고 host command, event, typed callback으로 변경을 요청해야 합니다.',
    ],
    code: globalStateSections[0]?.code ?? '',
  },
  zhGlobalState: {
    eyebrow: '全局状态',
    title: '在 MFE 内读取 Host 拥有的全局状态。',
    body: [
      'Host 将小型 typed sharedState snapshot 传给 MicroFrontendProvider，MFE 再通过 useMicroFrontendSharedState<T>() 读取。',
      '当共享 component 需要判断自己运行在 Host shell 还是 MFE subtree 中时，可使用 useIsMfe()。',
      '只用于 session identity、locale、feature flags、tenant、experiment bucket、analytics context 等只读值。不要放入 secret、大型 cache 或 native-only handle。',
      'Host 仍然是 source of truth。Feature module 不应直接拥有 global store，而应通过 host command、event 或 typed callback 请求变更。',
    ],
    code: globalStateSections[0]?.code ?? '',
  },
  jaGlobalState: {
    eyebrow: 'Global state',
    title: 'MFE 内で Host-owned global state を読み取ります。',
    body: [
      'Host は小さな typed sharedState snapshot を MicroFrontendProvider に渡し、MFE は useMicroFrontendSharedState<T>() で読み取ります。',
      '共有 component が Host shell と MFE subtree のどちらで動いているかを知る必要がある場合は、useIsMfe() を使います。',
      'session identity、locale、feature flags、tenant、experiment bucket、analytics context のような read-oriented value にだけ使います。secret、大きな cache、native-only handle は入れません。',
      'source of truth は Host に残します。Feature module は global store を直接所有せず、host command、event、typed callback で変更を依頼します。',
    ],
    code: globalStateSections[0]?.code ?? '',
  },
} as const;

export const localizedGuides = {
  ko: {
    title: '처음부터 배포까지: 검증 가능한 첫 MFE 만들기',
    subtitle:
      '설치, Host 설정, MFE 등록, runtime 로딩, Host-provided shared state, Hot Updater 배포까지 같은 정보 구조로 정리한 한국어 문서입니다.',
    cards: [
      {
        title: 'Hot Updater 설정',
        body: '기존 Hot Updater를 유지하면서 native-safety check를 앞단에 둡니다.',
      },
      {
        title: '패키지 매니저',
        body: 'Bun, npm, pnpm, Yarn, Deno에서 같은 workflow를 실행합니다.',
      },
      {
        title: 'Native contract',
        body: '어떤 변경이 Store release를 요구하는지 판단합니다.',
      },
      {
        title: '전역 상태',
        body: 'Host sharedState를 MFE에서 타입 안전하게 읽는 방법입니다.',
      },
    ],
    sections: [
      {
        eyebrow: '개발 상태',
        title: '0.x 라인은 아직 활발히 개발 중입니다.',
        body: [
          'runtime, CLI, native-contract check, Hot Updater adapter workflow를 계속 안정화하고 있습니다.',
          '프로덕션에서는 exact package version을 고정하고 CI에서 native compatibility check를 돌리는 것을 권장합니다. 실제 package license는 채택 장벽을 낮추기 위해 MIT로 유지합니다.',
        ],
        code: `status: active development
license: MIT
beerware spirit: appreciated`,
      },
      {
        eyebrow: '설정',
        title: '정책을 한 번 선언하고 CLI가 계속 검증하게 합니다.',
        body: [
          '설정 파일은 React Native 지원 범위, OTA provider, native-change policy, package-manager strategy, 등록된 feature module을 설명합니다.',
          '기본 방향은 보수적입니다. generated file 우선, manual native integration, strict package sharing, 명시적인 native-change 판단을 사용합니다.',
        ],
        code: docsSections[0]?.code ?? '',
      },
      {
        eyebrow: 'CLI 흐름',
        title: '초기화, 등록, 검증, 배포 순서로 진행합니다.',
        body: [
          'CLI는 review 가능한 integration file을 만들고, feature module을 등록하고, native contract를 비교한 뒤 OTA safety check가 통과할 때만 Hot Updater deploy command를 출력합니다.',
        ],
        code: docsSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime',
        title: '명시적인 runtime policy를 통해 feature module을 로드합니다.',
        body: [
          'Runtime은 registry를 읽고 blocked module, missing module, native-hash mismatch를 거부합니다. fallback UI는 Host가 소유합니다.',
        ],
        code: docsSections[2]?.code ?? '',
      },
      {
        eyebrow: '전역 상태',
        title: 'MFE 안에서 Host 전역 상태를 가져옵니다.',
        body: [
          'Host는 작은 typed sharedState snapshot을 MicroFrontendProvider에 전달하고, MFE는 useMicroFrontendSharedState<T>()로 읽습니다.',
          '같은 component가 Host shell과 MFE subtree 양쪽에서 실행될 수 있으면 useIsMfe()로 현재 위치를 구분합니다.',
          'session identity, locale, feature flag, tenant, experiment bucket, analytics context처럼 read-oriented 값에만 사용합니다. secret, 큰 cache, native-only handle은 넣지 않습니다.',
          'source of truth는 Host에 남깁니다. Feature module은 global store를 직접 소유하지 않고 host command, event, typed callback으로 변경을 요청해야 합니다.',
        ],
        code: docsSections[3]?.code ?? '',
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          'Hot Updater는 delivery로 유지하고, 앞단에 native-safety verification을 추가합니다.',
        body: [
          '이 라이브러리는 Hot Updater를 대체하지 않습니다. feature module이 OTA 가능한지 먼저 검증하고, 실제 배포는 Hot Updater가 수행하게 합니다.',
          '이미 Hot Updater를 쓰는 팀이나 Host App에 새로 추가하는 팀 모두 이 route를 설정 가이드로 사용할 수 있습니다.',
        ],
        code: hotUpdaterSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Adapter',
        title: '기존 Hot Updater config를 MFE metadata와 함께 감쌉니다.',
        body: [
          'Adapter는 Hot Updater config를 읽기 쉽게 유지하면서 verification과 publish command에 필요한 registry metadata를 추가합니다.',
          'CLI가 선택된 module의 OTA 안전성을 확인한 뒤에만 deploy command를 출력합니다.',
        ],
        code: hotUpdaterSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Publish',
        title: '먼저 검증하고, 그 다음 배포합니다.',
        body: [
          'Host team이 서로 다른 package manager를 사용해도 safety rule은 같습니다. 달라지는 것은 command runner뿐입니다.',
        ],
        code: hotUpdaterSections[2]?.code ?? '',
      },
    ],
    globalStateSections: [localizedGuidesShared.koGlobalState],
    nativeContractSections: [
      {
        eyebrow: 'Native contract',
        title: 'native hash는 JavaScript가 바꿀 수 없는 가정을 캡처합니다.',
        body: [
          'native contract에는 React Native version, Hermes, New Architecture, native dependency, Podfile.lock pod, Gradle dependency, AndroidManifest permission, Info.plist 입력값이 포함됩니다.',
          'contract가 바뀌면 OTA를 차단하고 native release를 요구합니다.',
        ],
        code: nativeContractSections[0]?.code ?? '',
      },
      {
        eyebrow: '판단 규칙',
        title: 'OTA는 최적화이지 native release를 우회하는 수단이 아닙니다.',
        body: [
          'JS-only 변경은 OTA 후보가 될 수 있습니다. native ABI, dependency, runtime flag, host/module native-hash mismatch는 store release가 필요합니다.',
        ],
        code: nativeContractSections[1]?.code ?? '',
      },
    ],
  },
  zh: {
    title: '从安装到发布：创建可验证的第一个 MFE',
    subtitle:
      '这里用相同的信息结构说明安装、Host 配置、MFE 注册、runtime 加载、Host-provided shared state 与 Hot Updater 发布。',
    cards: [
      {
        title: 'Hot Updater 设置',
        body: '保留现有 Hot Updater，并在前面加入 native-safety check。',
      },
      {
        title: '包管理器',
        body: '用 Bun、npm、pnpm、Yarn、Deno 执行同一套 workflow。',
      },
      { title: 'Native contract', body: '判断哪些变更必须走 Store release。' },
      { title: '全局状态', body: '在 MFE 中类型安全地读取 Host sharedState。' },
    ],
    sections: [
      {
        eyebrow: '开发状态',
        title: '0.x 版本线仍在积极开发中。',
        body: [
          'runtime、CLI、native-contract check 和 Hot Updater adapter workflow 仍在持续加固。',
          '生产使用前请固定精确 package version，并在 CI 中运行 native compatibility check。实际 package license 保持 MIT，以降低采用和合规成本。',
        ],
        code: `status: active development
license: MIT
beerware spirit: appreciated`,
      },
      {
        eyebrow: '配置',
        title: '只声明一次策略，然后让 CLI 持续校验。',
        body: [
          '配置文件描述 React Native 支持范围、OTA provider、native-change policy、package-manager strategy 以及注册的 feature modules。',
          '默认策略偏保守：generated file 优先、manual native integration、strict package sharing、显式 native-change 判断。',
        ],
        code: docsSections[0]?.code ?? '',
      },
      {
        eyebrow: 'CLI 流程',
        title: '按初始化、注册、校验、发布的顺序执行。',
        body: [
          'CLI 生成可审查的 integration file，注册 feature module，比较 native contract，并且只在 OTA safety check 通过后输出 Hot Updater deploy command。',
        ],
        code: docsSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime',
        title: '通过明确的 runtime policy 加载 feature modules。',
        body: [
          'Runtime 读取 registry，并拒绝 blocked module、missing module 和 native-hash mismatch。fallback UI 由 Host 负责。',
        ],
        code: docsSections[2]?.code ?? '',
      },
      {
        eyebrow: '全局状态',
        title: '在 MFE 内读取 Host 拥有的全局状态。',
        body: [
          'Host 将小型 typed sharedState snapshot 传给 MicroFrontendProvider，MFE 再通过 useMicroFrontendSharedState<T>() 读取。',
          '当共享 component 需要判断自己运行在 Host shell 还是 MFE subtree 中时，可使用 useIsMfe()。',
          '只用于 session identity、locale、feature flags、tenant、experiment bucket、analytics context 等只读值。不要放入 secret、大型 cache 或 native-only handle。',
          'Host 仍然是 source of truth。Feature module 不应直接拥有 global store，而应通过 host command、event 或 typed callback 请求变更。',
        ],
        code: docsSections[3]?.code ?? '',
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          '保留 Hot Updater 作为 delivery，并在前面添加 native-safety verification。',
        body: [
          '本库不替代 Hot Updater。它先验证 feature module 是否可以 OTA，然后让 Hot Updater 执行实际发布。',
          '已经使用 Hot Updater 或准备在 Host App 中新增 Hot Updater 的团队，都可以使用这个 route 作为设置指南。',
        ],
        code: hotUpdaterSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Adapter',
        title: '用 MFE metadata 包装现有 Hot Updater config。',
        body: [
          'Adapter 保持 Hot Updater config 易读，同时加入 verification 和 publish command 所需的 registry metadata。',
          '只有 CLI 确认所选 module 的 OTA 安全后，才会输出 deploy command。',
        ],
        code: hotUpdaterSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Publish',
        title: '先校验，再发布。',
        body: [
          '即使 Host team 使用不同的 package manager，safety rule 也相同；变化的只有 command runner。',
        ],
        code: hotUpdaterSections[2]?.code ?? '',
      },
    ],
    globalStateSections: [localizedGuidesShared.zhGlobalState],
    nativeContractSections: [
      {
        eyebrow: 'Native contract',
        title: 'native hash 捕获 JavaScript 无法改变的假设。',
        body: [
          'native contract 包含 React Native version、Hermes、New Architecture、native dependency、Podfile.lock pods、Gradle dependencies、AndroidManifest permissions 和 Info.plist 输入。',
          'contract 发生变化时，OTA 会被阻止并要求 native release。',
        ],
        code: nativeContractSections[0]?.code ?? '',
      },
      {
        eyebrow: '判断规则',
        title: 'OTA 是优化，不是绕过 native release 的后门。',
        body: [
          'JS-only 变更可以成为 OTA 候选。native ABI、dependency、runtime flag、host/module native-hash mismatch 都需要 store release。',
        ],
        code: nativeContractSections[1]?.code ?? '',
      },
    ],
  },
  ja: {
    title: '導入から公開まで: 検証可能な最初の MFE を作る',
    subtitle:
      'install、Host 設定、MFE 登録、runtime loading、Host-provided shared state、Hot Updater publish まで同じ情報構造で整理した日本語ドキュメントです。',
    cards: [
      {
        title: 'Hot Updater 設定',
        body: '既存の Hot Updater を維持し、その前段に native-safety check を置きます。',
      },
      {
        title: 'Package managers',
        body: 'Bun、npm、pnpm、Yarn、Deno で同じ workflow を実行します。',
      },
      {
        title: 'Native contract',
        body: 'どの変更が Store release を必要とするか判断します。',
      },
      {
        title: 'Global state',
        body: 'MFE 内で Host sharedState を type-safe に読み取る方法です。',
      },
    ],
    sections: [
      {
        eyebrow: '開発ステータス',
        title: '0.x line はまだ活発に開発中です。',
        body: [
          'runtime、CLI、native-contract check、Hot Updater adapter workflow を継続的に harden しています。',
          'production 前には exact package version を pin し、CI で native compatibility check を実行してください。実際の package license は採用と compliance のため MIT にします。',
        ],
        code: `status: active development
license: MIT
beerware spirit: appreciated`,
      },
      {
        eyebrow: '設定',
        title: 'policy を一度宣言し、CLI に継続的に検証させます。',
        body: [
          'config file は React Native support、OTA provider、native-change policy、package-manager strategy、登録済み feature modules を説明します。',
          'default は保守的です。generated file first、manual native integration、strict package sharing、明示的な native-change decision を使います。',
        ],
        code: docsSections[0]?.code ?? '',
      },
      {
        eyebrow: 'CLI flow',
        title: 'initialize、register、verify、publish の順で進めます。',
        body: [
          'CLI は review 可能な integration file を生成し、feature module を登録し、native contract を比較し、OTA safety check が通った場合だけ Hot Updater deploy command を出力します。',
        ],
        code: docsSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime',
        title: '明示的な runtime policy で feature modules をロードします。',
        body: [
          'Runtime は registry を読み、blocked module、missing module、native-hash mismatch を拒否します。fallback UI は Host が所有します。',
        ],
        code: docsSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Global state',
        title: 'MFE 内で Host-owned global state を読み取ります。',
        body: [
          'Host は小さな typed sharedState snapshot を MicroFrontendProvider に渡し、MFE は useMicroFrontendSharedState<T>() で読み取ります。',
          '共有 component が Host shell と MFE subtree のどちらで動いているかを知る必要がある場合は、useIsMfe() を使います。',
          'session identity、locale、feature flags、tenant、experiment bucket、analytics context のような read-oriented value にだけ使います。secret、大きな cache、native-only handle は入れません。',
          'source of truth は Host に残します。Feature module は global store を直接所有せず、host command、event、typed callback で変更を依頼します。',
        ],
        code: docsSections[3]?.code ?? '',
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          'Hot Updater を delivery として維持し、その前段に native-safety verification を追加します。',
        body: [
          'このライブラリは Hot Updater を置き換えません。feature module が OTA 可能か先に検証し、実際の公開は Hot Updater に任せます。',
          'すでに Hot Updater を使っている team も、Host App にこれから追加する team も、この route を setup guide として使えます。',
        ],
        code: hotUpdaterSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Adapter',
        title:
          '既存の Hot Updater config を MFE metadata と一緒に wrap します。',
        body: [
          'Adapter は Hot Updater config の読みやすさを保ちながら、verification と publish command に必要な registry metadata を追加します。',
          'CLI が選択 module の OTA safety を確認した後だけ deploy command を出力します。',
        ],
        code: hotUpdaterSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Publish',
        title: '先に検証し、その後で公開します。',
        body: [
          'Host team が異なる package manager を使っても safety rule は同じです。変わるのは command runner だけです。',
        ],
        code: hotUpdaterSections[2]?.code ?? '',
      },
    ],
    globalStateSections: [localizedGuidesShared.jaGlobalState],
    nativeContractSections: [
      {
        eyebrow: 'Native contract',
        title:
          'native hash は JavaScript が変更できない前提を capture します。',
        body: [
          'native contract には React Native version、Hermes、New Architecture、native dependency、Podfile.lock pods、Gradle dependencies、AndroidManifest permissions、Info.plist inputs が含まれます。',
          'contract が変わると OTA はブロックされ、native release が必要になります。',
        ],
        code: nativeContractSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Decision rule',
        title:
          'OTA は optimization であり、native release の抜け道ではありません。',
        body: [
          'JS-only change は OTA の候補になります。native ABI、dependency、runtime flag、host/module native-hash mismatch は store release が必要です。',
        ],
        code: nativeContractSections[1]?.code ?? '',
      },
    ],
  },
} as const satisfies Record<string, LocalizedGuide>;
