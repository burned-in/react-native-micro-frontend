import vikeReact from "vike-react/config";
import type { Config } from "vike/types";

export default {
  extends: vikeReact,
  prerender: true,
  title: "@bunin/react-native-micro-frontend",
  description: "Native-safe micro frontend delivery for React Native feature teams.",
  lang: "en-US",
} satisfies Config;
