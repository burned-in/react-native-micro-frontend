import React, { useEffect, useState } from "react";
import { Head } from "vike-react/Head";
import { usePageContext } from "vike-react/usePageContext";
import { css } from "../styled-system/css";
import { hstack, stack } from "../styled-system/patterns";
import "../styled-system/styles.css";

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", stored ? stored === "dark" : prefersDark);
  } catch (_) {}
})();`;

type LocalePrefix = "" | "/ko" | "/zh-cn" | "/jp";

type LocalizedNavItem = {
  readonly label: string;
  readonly path: "" | "/docs" | "/docs/hot-updater" | "/docs/package-managers" | "/docs/native-contract";
};

const localizedNavLabels = {
  "": {
    overview: "Overview",
    docs: "Docs",
    hotUpdater: "Hot Updater",
    packageManagers: "Package managers",
    nativeContract: "Native contract",
  },
  "/ko": {
    overview: "개요",
    docs: "문서",
    hotUpdater: "Hot Updater",
    packageManagers: "패키지 매니저",
    nativeContract: "Native contract",
  },
  "/zh-cn": {
    overview: "概览",
    docs: "文档",
    hotUpdater: "Hot Updater",
    packageManagers: "包管理器",
    nativeContract: "Native contract",
  },
  "/jp": {
    overview: "概要",
    docs: "ドキュメント",
    hotUpdater: "Hot Updater",
    packageManagers: "Package managers",
    nativeContract: "Native contract",
  },
} satisfies Record<LocalePrefix, Record<string, string>>;

const getPathname = (urlOriginal: string) => {
  if (urlOriginal.startsWith("http://") || urlOriginal.startsWith("https://")) {
    return new URL(urlOriginal).pathname;
  }

  return urlOriginal.split("?")[0]?.split("#")[0] || "/";
};

const detectLocalePrefix = (urlOriginal: string): LocalePrefix => {
  const pathname = getPathname(urlOriginal);

  if (pathname === "/ko" || pathname.startsWith("/ko/")) {
    return "/ko";
  }

  if (pathname === "/zh-cn" || pathname.startsWith("/zh-cn/")) {
    return "/zh-cn";
  }

  if (pathname === "/jp" || pathname.startsWith("/jp/")) {
    return "/jp";
  }

  return "";
};

const createNavItems = (prefix: LocalePrefix): readonly LocalizedNavItem[] => {
  const labels = localizedNavLabels[prefix];

  return [
    { label: labels.overview, path: "" },
    { label: labels.docs, path: "/docs" },
    { label: labels.hotUpdater, path: "/docs/hot-updater" },
    { label: labels.packageManagers, path: "/docs/package-managers" },
    { label: labels.nativeContract, path: "/docs/native-contract" },
  ];
};

const createLocalizedHref = (prefix: LocalePrefix, path: LocalizedNavItem["path"]) => {
  if (!prefix) {
    return path || "/";
  }

  return `${prefix}${path}`;
};

export default function Layout({ children }: { readonly children: React.ReactNode }) {
  const pageContext = usePageContext();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const localePrefix = detectLocalePrefix(pageContext.urlOriginal);
  const navItems = createNavItems(localePrefix);
  const homeHref = createLocalizedHref(localePrefix, "");

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={theme === "dark" ? "#050816" : "#f8fbff"} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Sans+SC:wght@400;500;700;900&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </Head>
      <div
        className={css({
          minH: "100vh",
          bg: "page.bg",
          color: "page.fg",
          backgroundImage: {
            base: "radial-gradient(circle at top left, rgba(139,92,246,0.16), transparent 34%), radial-gradient(circle at bottom right, rgba(34,211,238,0.13), transparent 36%)",
            _dark: "radial-gradient(circle at top left, rgba(34,211,238,0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(139,92,246,0.16), transparent 36%)",
          },
        })}
      >
        <div className={stack({ gap: { base: "8", md: "12" }, maxW: "7xl", mx: "auto", px: { base: "4", sm: "5", md: "8" }, py: { base: "4", md: "6" } })}>
          <header
            className={hstack({
              justify: "space-between",
              alignItems: "center",
              gap: { base: "3", md: "5" },
              flexWrap: "wrap",
              rounded: { base: "3xl", md: "full" },
              borderWidth: "1px",
              borderColor: "line",
              bg: "surface",
              shadow: "card",
              px: { base: "3", sm: "4", md: "6" },
              py: { base: "3", md: "3" },
            })}
          >
            <a href={homeHref} className={hstack({ gap: "3", alignItems: "center", flexShrink: 0 })}>
              <span
                className={css({
                  display: "inline-grid",
                  placeItems: "center",
                  w: "9",
                  h: "9",
                  rounded: "xl",
                  bg: "page.fg",
                  color: "page.bg",
                  fontWeight: "900",
                })}
              >
                B
              </span>
              <span className={css({ fontWeight: "900", letterSpacing: "-0.04em", whiteSpace: "nowrap" })}>bunin / RN MFE</span>
            </a>
            <nav
              className={css({
                order: { base: "3", lg: "initial" },
                display: "flex",
                gap: "2",
                w: { base: "full", lg: "auto" },
                maxW: "full",
                overflowX: { base: "auto", lg: "visible" },
                flexWrap: { base: "nowrap", lg: "wrap" },
                justifyContent: { base: "flex-start", lg: "flex-end" },
                scrollbarWidth: "none",
                pb: { base: "1", lg: "0" },
                '&::-webkit-scrollbar': { display: "none" },
              })}
              aria-label="Main navigation"
            >
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={createLocalizedHref(localePrefix, item.path)}
                  className={css({
                    flexShrink: "0",
                    rounded: "full",
                    px: "3",
                    py: "2",
                    color: "page.muted",
                    bg: "surface.subtle",
                    fontSize: "sm",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                    _hover: { bg: "accent.soft", color: "page.fg" },
                  })}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/ko/docs"
                className={languageLink({ active: localePrefix === "/ko" })}
              >
                한국어
              </a>
              <a
                href="/zh-cn/docs"
                className={languageLink({ active: localePrefix === "/zh-cn" })}
              >
                中文
              </a>
              <a
                href="/jp/docs"
                className={languageLink({ active: localePrefix === "/jp" })}
              >
                日本語
              </a>
            </nav>
            <button
              type="button"
              onClick={toggleTheme}
              className={css({
                order: { base: "2", lg: "initial" },
                ml: "auto",
                cursor: "pointer",
                rounded: "full",
                borderWidth: "1px",
                borderColor: "line",
                bg: "surface.subtle",
                color: "page.fg",
                px: "4",
                py: "2",
                fontWeight: "800",
              })}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </header>
          {children}
          <footer className={hstack({ justify: "space-between", flexWrap: "wrap", gap: "4", color: "page.muted", fontSize: "sm", pb: "6" })}>
            <span>© bunin React Native Micro Frontend</span>
            <span>Native-safe feature delivery · Hot Updater compatible · Bun-first</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const languageLink = (props: { readonly active: boolean }) => css({
  flexShrink: "0",
  rounded: "full",
  px: "3",
  py: "2",
  color: props.active ? "accent" : "page.muted",
  bg: props.active ? "accent.soft" : "surface.subtle",
  fontSize: "sm",
  fontWeight: "800",
  whiteSpace: "nowrap",
  _hover: { bg: "accent.soft", color: "page.fg" },
});
