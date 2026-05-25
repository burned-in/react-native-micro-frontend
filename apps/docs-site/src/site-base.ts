const rawSiteBase = import.meta.env.BASE_URL || "/";

export const siteBasePath = normalizeSiteBase(rawSiteBase);
export const siteOrigin = normalizeSiteOrigin(import.meta.env.VITE_PUBLIC_SITE_ORIGIN || "https://burned-in.github.io");

export function withSiteBase(path: string) {
  if (isExternalPath(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!siteBasePath) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return `${siteBasePath}/`;
  }

  return `${siteBasePath}${normalizedPath}`;
}

export function absoluteSiteUrl(path: string) {
  const withBase = withSiteBase(path);

  return `${siteOrigin}${withBase}`;
}

export function stripSiteBase(pathname: string) {
  if (!siteBasePath) {
    return pathname;
  }

  if (pathname === siteBasePath) {
    return "/";
  }

  if (pathname.startsWith(`${siteBasePath}/`)) {
    return pathname.slice(siteBasePath.length) || "/";
  }

  return pathname;
}

function normalizeSiteBase(base: string) {
  if (!base || base === "/") {
    return "";
  }

  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  const withoutTrailingSlash = withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;

  return withoutTrailingSlash;
}

function isExternalPath(path: string) {
  return path.startsWith("http://") || path.startsWith("https://") || path.startsWith("mailto:") || path.startsWith("#");
}

function normalizeSiteOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}
