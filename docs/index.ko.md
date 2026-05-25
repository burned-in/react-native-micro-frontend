# React Native Micro Frontend

**React Native feature team을 위한 native-safe delivery layer.**

`@bunin/react-native-micro-frontend`는 기능을 독립 모듈로 나누되, host app의 native binary contract를 안전하게 지키도록 돕습니다.

## 바로 시작

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

## 문서

| 문서 | 목적 |
| --- | --- |
| [한국어 README](README.ko.md) | 주요 가이드와 예제. |
| [English](../README.md) | English official guide. |
| [日本語](README.ja.md) | 日本語公式ドキュメント. |
| [简体中文](README.zh-CN.md) | 简体中文官方文档. |
| [패키지 매니저](package-managers.ko.md) | Bun, npm, pnpm, Yarn, Deno 명령 매트릭스. |
| [Native contract](native-contract.md) | native compatibility 설명. |
| [Hot Updater 설정](/docs/hot-updater) | Hot Updater route 문서. |

## 핵심 흐름

```txt
MFE 등록
  -> native contract 계산
  -> host binary와 비교
  -> OTA 허용 또는 차단
  -> runtime policy로 로드
```

## 설계 원칙

- **Safety first**: native 변경은 native release가 필요합니다.
- **Bun-first, ecosystem-friendly**: repository runtime은 Bun 우선이고, consumer project는 Bun, npm, pnpm, Yarn, Deno를 사용할 수 있습니다.
- **No hidden native patches**: generated file과 manual integration을 review 가능하게 유지합니다.
- **Hot Updater compatible**: compatibility check를 통과한 뒤 Hot Updater로 OTA delivery를 위임합니다.
- **Host-provided shared state**: Host가 session, locale, feature flag를 MFE에 안전하게 제공합니다.
