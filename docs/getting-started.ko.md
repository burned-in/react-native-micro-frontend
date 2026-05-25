# Getting Started

이 문서는 package 설치, Host policy 선언, 첫 MFE 등록, native safety 검증, Host 전용 loader로 module을 mount하는 흐름을 정확히 설명합니다.


## 0. 지금 만들 구조

React Native MFE 구성은 보통 두 project로 나뉩니다.

```txt
host-app/
  react-native-micro-frontend.config.ts  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # MFE default component entry
  mfe.config.ts                          # MFE-local assumptions
```

먼저 이렇게 이해하면 됩니다.

| 요소 | 역할 |
| --- | --- |
| Host App | 설치된 native binary, navigation, fallback UI, shared state, 실제 bundle loader를 소유합니다. |
| MFE | 기능을 별도 JavaScript bundle로 배포하고 root component 하나를 default export합니다. |
| `react-native-micro-frontend.config.ts` | OTA provider, package manager, native-change policy, iOS/Android integration mode 같은 Host policy입니다. |
| `rnm.registry.json` | `rnm add`가 만드는 runtime registry입니다. Host가 어떤 MFE를 알고 있고 entry file이 어디인지 알게 합니다. |
| runtime hooks | Host loader가 렌더링하기 전에 missing, blocked, native-incompatible MFE를 막는 safety gate입니다. |

중요: 이 라이브러리는 native-safety와 registry layer입니다. remote JavaScript를 자동으로 실행해 주는 도구가 아닙니다. 실제 실행은 Host App이 Hot Updater, embedded bundle, custom loader 중 하나로 연결해야 합니다.

## 1. 설치

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

다른 package manager 명령은 [`package-managers.ko.md`](package-managers.ko.md)에 정리되어 있습니다.

## 2. Host policy 설정

`react-native-micro-frontend.config.ts`는 Host 정책을 설명합니다. 일반적인 runtime module 등록은 `rnm add`가 만드는 `rnm.registry.json`에 두고, Host config의 `mfes`는 비워 둡니다.

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

의미:

- Host config는 OTA, package-manager, native-change, iOS, Android 정책의 source of truth입니다.
- `mfes: {}`는 module 등록 정보를 `rnm.registry.json`에서 가져오겠다는 뜻입니다.
- generated native integration은 review 가능하게 유지합니다.
- package-manager 차이는 허용하되 명시적으로 관리합니다.

## 3. MFE 등록과 검증

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```

`rnm add`는 Host App의 `rnm.registry.json`을 만들거나 갱신합니다. `entry` 값은 MFE project root 기준의 파일이며, Metro가 bundle할 시작점이자 Host resolver가 나중에 load할 module 위치입니다.

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

검증이 통과한 뒤에만 publish합니다. native contract check가 실패하면 OTA 대신 Store release를 진행해야 합니다.

## 4. MFE component 제공

MFE entry file은 root component를 반드시 **default export**해야 합니다. Host loader가 따로 named export mapping을 구현하지 않는 한 named export에 의존하지 않습니다.

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

## 5. Host App에서 mount

runtime package는 missing module, blocked module, native hash mismatch를 막는 registry safety gate를 담당합니다. JavaScript bundle download나 evaluation은 직접 하지 않습니다. 실제 loader는 Hot Updater, embedded bundle, custom loader 중 Host App이 선택합니다.

`useMicroFrontend()`로 safety gate를 먼저 통과시킨 뒤, Host 전용 loader가 반환한 `module.default`를 렌더링합니다.

```tsx
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import type { MfeManifest, MfeRegistry } from "@bunin/react-native-micro-frontend";
import {
  MicroFrontendProvider,
  useMicroFrontend,
} from "@bunin/react-native-micro-frontend/runtime";
import registryJson from "./rnm.registry.json";

type MfeModule = {
  default: ComponentType;
};

async function loadMfeModule(manifest: MfeManifest): Promise<MfeModule> {
  // Hot Updater, embedded bundle, custom loader 중 하나로 교체하세요.
  return hostSpecificBundleLoader<MfeModule>(manifest);
}

function MfeMount(props: { readonly name: string }) {
  const mfe = useMicroFrontend(props.name);
  const [Component, setComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (mfe.status !== "ready" || !mfe.manifest) return;

    let mounted = true;

    loadMfeModule(mfe.manifest).then((module) => {
      if (mounted) setComponent(() => module.default);
    });

    return () => {
      mounted = false;
    };
  }, [mfe.status, mfe.manifest]);

  if (mfe.status !== "ready" || !Component) {
    return <Loading reason={mfe.reason} />;
  }

  return <Component />;
}

export function App() {
  return (
    <MicroFrontendProvider
      registry={registryJson as MfeRegistry}
      sharedState={{ locale: "ko-KR" }}
    >
      <MfeMount name="mfe-feature" />
    </MicroFrontendProvider>
  );
}
```

`MicroFrontendScreen`은 의도적으로 fallback 중심의 placeholder입니다. 실제 bundle loader를 연결해야 한다면 `useMicroFrontend()`를 사용하세요.

다음 문서:

- [`options.ko.md`](options.ko.md): Host, MFE, registry, runtime option 전체
- [`native-contract.md`](native-contract.md): OTA 차단 기준
- [`package-managers.ko.md`](package-managers.ko.md): npm, pnpm, Yarn, Bun, Deno 명령
- 웹 `/ko/docs/global-state`: Host-provided global state
