import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: [
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "react",
  conditions: {
    extend: {
      dark: ".dark &",
    },
  },
  globalCss: {
    "html, body": {
      margin: "0",
      minHeight: "100%",
      bg: "page.bg",
      color: "page.fg",
      fontFamily: "body",
      scrollBehavior: "smooth",
    },
    "*": {
      boxSizing: "border-box",
    },
    "a": {
      color: "inherit",
      textDecoration: "none",
    },
    "::selection": {
      bg: "accent.selection",
      color: "page.fg",
    },
  },
  theme: {
    extend: {
      tokens: {
        fonts: {
          body: { value: "Inter, 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans CJK KR', 'Noto Sans CJK JP', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
          mono: { value: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" },
        },
        colors: {
          ink: {
            50: { value: "#f8fafc" },
            100: { value: "#f1f5f9" },
            200: { value: "#e2e8f0" },
            300: { value: "#cbd5e1" },
            400: { value: "#94a3b8" },
            500: { value: "#64748b" },
            600: { value: "#475569" },
            700: { value: "#334155" },
            800: { value: "#1e293b" },
            900: { value: "#0f172a" },
            950: { value: "#020617" },
          },
          cyan: {
            300: { value: "#67e8f9" },
            400: { value: "#22d3ee" },
            500: { value: "#06b6d4" },
          },
          violet: {
            300: { value: "#c4b5fd" },
            400: { value: "#a78bfa" },
            500: { value: "#8b5cf6" },
          },
          emerald: {
            300: { value: "#6ee7b7" },
            400: { value: "#34d399" },
            500: { value: "#10b981" },
          },
        },
      },
      semanticTokens: {
        colors: {
          page: {
            bg: { value: { base: "#f8fbff", _dark: "#050816" } },
            fg: { value: { base: "{colors.ink.950}", _dark: "#f8fbff" } },
            muted: { value: { base: "{colors.ink.600}", _dark: "{colors.ink.300}" } },
          },
          surface: {
            DEFAULT: { value: { base: "rgba(255,255,255,0.86)", _dark: "rgba(15,23,42,0.72)" } },
            subtle: { value: { base: "rgba(241,245,249,0.86)", _dark: "rgba(15,23,42,0.48)" } },
            strong: { value: { base: "#ffffff", _dark: "#0f172a" } },
          },
          line: {
            DEFAULT: { value: { base: "rgba(15,23,42,0.12)", _dark: "rgba(226,232,240,0.14)" } },
          },
          accent: {
            DEFAULT: { value: { base: "{colors.violet.500}", _dark: "{colors.cyan.300}" } },
            soft: { value: { base: "rgba(139,92,246,0.12)", _dark: "rgba(103,232,249,0.14)" } },
            selection: { value: { base: "rgba(139,92,246,0.22)", _dark: "rgba(103,232,249,0.28)" } },
          },
        },
        shadows: {
          card: { value: { base: "0 24px 80px rgba(15,23,42,0.12)", _dark: "0 24px 80px rgba(0,0,0,0.38)" } },
        },
      },
    },
  },
});
