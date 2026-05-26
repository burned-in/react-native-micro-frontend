# Getting Started

本指南准确说明首次使用流程：安装 package、声明 Host policy、注册第一个 MFE、校验 native safety，并通过 Host-owned loader 挂载 module。


## 0. 你要搭建什么

React Native MFE 通常由两个 project 组成：

```txt
host-app/
  react-native-micro-frontend.config.ts  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # MFE default component entry
  mfe.config.ts                          # MFE-local assumptions
```

可以先按这个模型理解：

| 部分 | 作用 |
| --- | --- |
| Host App | 拥有已安装的 native binary、navigation、fallback UI、shared state 和真实 bundle loader。 |
| MFE | 以独立 JavaScript bundle 发布功能，并 default export 一个 root component。 |
| `react-native-micro-frontend.config.ts` | Host policy：OTA provider、package manager、native-change policy、iOS/Android integration mode。 |
| `rnm.registry.json` | 由 `rnm add` 生成的 runtime registry；告诉 Host 哪些 MFE 存在以及 entry file 在哪里。 |
| runtime hooks | 在 Host loader 渲染前，阻止 missing、blocked 或 native-incompatible MFE。 |

注意：本库是 native-safety 与 registry layer。它不会自动执行 remote JavaScript。Host App 仍然需要接入 Hot Updater、embedded bundle 或 custom loader。

## 1. 安装

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

其他 package manager 命令见 [`package-managers.zh-CN.md`](package-managers.zh-CN.md)。

## 2. 配置 Host policy

`react-native-micro-frontend.config.ts` 描述 Host policy。常规 runtime module registration 放在 `rnm add` 生成的 `rnm.registry.json` 中，因此 Host config 里的 `mfes` 保持为空。

```ts
import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: {
    enabled: true,
    provider: "hot-updater",
    mode: "manual",
  },
  nativeChangePolicy: "ask",
  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },
  package: {
    sync: "manual",
    sharedStrategy: "strict-singleton",
  },
  ios: {
    pods: "manual",
  },
  android: {
    integration: "manual",
  },
  mfes: {},
});
```

含义：

- Host config 是 OTA、package-manager、native-change、iOS 和 Android policy 的 source of truth。
- `mfes: {}` 表示 module registration 来自 `rnm.registry.json`。
- generated native integration 保持可审查。
- package-manager 差异可以存在，但必须显式管理。

## 3. 注册并校验 MFE

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```

`rnm add` 会在 Host App 中创建或更新 `rnm.registry.json`。`entry` 值是相对于 MFE project root 的文件路径，也是 Metro bundle entry 和 Host resolver 后续加载的 module 位置。

```json
{
  "schemaVersion": 1,
  "mfes": {
    "mfe-feature": {
      "name": "mfe-feature",
      "version": "1.0.0",
      "entry": "./src/index.tsx",
      "path": "../mfe-feature",
      "ota": {
        "enabled": true,
        "mode": "manual",
        "provider": "hot-updater"
      },
      "nativeChangePolicy": "ask",
      "status": "active"
    }
  }
}
```

只有校验通过后才发布。native contract check 失败时，应走 Store release，而不是推送 OTA。

## 4. 提供 MFE component

MFE entry file 必须 **default export** root component。除非自己的 Host loader 明确实现 named export mapping，否则不要依赖 named export。

```tsx
// mfe-feature/src/index.tsx
import { Text, View } from "react-native";

export default function MfeFeature() {
  return (
    <View>
      <Text>MFE Feature</Text>
    </View>
  );
}
```

## 5. 在 Host App 中挂载

runtime package 负责 registry safety gate：missing module、blocked module、native hash mismatch。它不会自己下载或执行 JavaScript bundle。实际 loader 由 Host App 选择，可以是 Hot Updater、embedded bundle 或 custom loader。

使用 `createMicroFrontendLoader()` 创建 loader，并把它传给 `MicroFrontendComponent`。loader 会优先读取 `rnm.registry.json` 中的 config 值（`ota.provider`、`embeddedBundlePath`、`otaBundleUrl`）。如果某个值不适合写入 registry，可以通过 `loadOptions` 或创建出的 loader 的第二个参数直接传入。

```tsx
import type { MfeManifest, MfeRegistry } from "@bunin/react-native-micro-frontend";
import {
  MicroFrontendComponent,
  MicroFrontendProvider,
  createMicroFrontendLoader,
  type MicroFrontendModule,
} from "@bunin/react-native-micro-frontend/runtime";
import registryJson from "./rnm.registry.json";

type MfeFeatureProps = {
  readonly title?: string;
};

type MfeModule = MicroFrontendModule<MfeFeatureProps>;

// 请把这些声明替换为真实的 Hot Updater、embedded bundle 或 custom CDN 实现。
declare function loadWithHotUpdater<TModule>(
  manifest: MfeManifest,
): Promise<TModule>;
declare function loadEmbeddedBundle<TModule>(
  manifest: MfeManifest,
): Promise<TModule>;
declare function loadCustomBundle<TModule>(
  manifest: MfeManifest,
): Promise<TModule>;

const loadMfeModule = createMicroFrontendLoader<MfeModule>({
  hotUpdater: loadWithHotUpdater,
  embedded: loadEmbeddedBundle,
  custom: loadCustomBundle,
});

export function App() {
  return (
    <MicroFrontendProvider
      registry={registryJson as MfeRegistry}
      sharedState={{ locale: "zh-CN" }}
    >
      <MicroFrontendComponent<MfeFeatureProps>
        name="mfe-feature"
        load={loadMfeModule}
        componentProps={{ title: "MFE Feature" }}
        fallback={(state) => <Loading reason={state.reason} />}
        errorFallback={(error) => (
          <Loading
            reason={error instanceof Error ? error.message : "MFE load failed."}
          />
        )}
      />
    </MicroFrontendProvider>
  );
}

// 当某个值没有存储在 rnm.registry.json 中时，也可以直接设置：
// <MicroFrontendComponent
//   name="mfe-feature"
//   load={loadMfeModule}
//   loadOptions={{ provider: "custom", otaBundleUrl: "https://cdn.example.com/mfe.bundle" }}
//   fallback={(state) => <Loading reason={state.reason} />}
// />
```


下一步：

- [`options.zh-CN.md`](options.zh-CN.md)：查看 Host、MFE、registry 与 runtime 的全部选项
- [`native-contract.md`](native-contract.md)：了解 OTA 阻断标准
- [`package-managers.zh-CN.md`](package-managers.zh-CN.md)：npm、pnpm、Yarn、Bun、Deno 命令
- 网站 `/zh-cn/docs/global-state`：Host-provided global state
