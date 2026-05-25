import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'apps/docs-site/dist/client');
const routeGroups = [
  ['/', '/ko', '/zh-cn', '/jp'],
  ['/docs', '/ko/docs', '/zh-cn/docs', '/jp/docs'],
  [
    '/docs/hot-updater',
    '/ko/docs/hot-updater',
    '/zh-cn/docs/hot-updater',
    '/jp/docs/hot-updater',
  ],
  [
    '/docs/package-managers',
    '/ko/docs/package-managers',
    '/zh-cn/docs/package-managers',
    '/jp/docs/package-managers',
  ],
  [
    '/docs/native-contract',
    '/ko/docs/native-contract',
    '/zh-cn/docs/native-contract',
    '/jp/docs/native-contract',
  ],
  [
    '/docs/global-state',
    '/ko/docs/global-state',
    '/zh-cn/docs/global-state',
    '/jp/docs/global-state',
  ],
];

const hreflangOrder = ['en', 'ko', 'zh-CN', 'ja'];
const origin = normalizeOrigin(
  process.env.VITE_PUBLIC_SITE_ORIGIN || 'https://burned-in.github.io',
);
const base = normalizeBase(
  process.env.GITHUB_PAGES_BASE || process.env.SITE_BASE || '/',
);
const today = new Date().toISOString().slice(0, 10);

await mkdir(outputDir, { recursive: true });

const urls = routeGroups.flatMap((group) => {
  const alternates = createAlternates(group);

  return group.map((route) => {
    const loc = absoluteUrl(route);
    const priority = getPriority(route);
    const alternateLinks = alternates
      .map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${alternate.lang}" href="${escapeXml(alternate.href)}" />`,
      )
      .join('\n');

    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${alternateLinks}\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`;

const manifest = {
  name: 'bunin React Native Micro Frontend Docs',
  short_name: 'bunin RN MFE',
  description:
    'Native-safe React Native micro frontend documentation with Hot Updater, host state, and native contract workflows.',
  start_url: withBase('/'),
  scope: withBase('/'),
  display: 'standalone',
  background_color: '#050816',
  theme_color: '#22d3ee',
  icons: [
    {
      src: withBase('/favicon.svg'),
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
};

await writeFile(join(outputDir, 'sitemap.xml'), sitemap);
await writeFile(join(outputDir, 'robots.txt'), robots);
await writeFile(
  join(outputDir, 'site.webmanifest'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

function createAlternates(group) {
  const alternates = hreflangOrder.map((lang, index) => ({
    lang,
    href: absoluteUrl(group[index]),
  }));

  return [{ lang: 'x-default', href: absoluteUrl(group[0]) }, ...alternates];
}

function getPriority(route) {
  if (route === '/') return '1.0';
  if (route.endsWith('/docs') || route === '/docs') return '0.9';
  return '0.8';
}

function absoluteUrl(route) {
  return `${origin}${withBase(route)}`;
}

function withBase(route) {
  const normalizedRoute = route === '/' ? '/' : route;
  const path = base
    ? `${base}${normalizedRoute === '/' ? '/' : normalizedRoute}`
    : normalizedRoute;

  return path || '/';
}

function normalizeOrigin(originValue) {
  return originValue.endsWith('/') ? originValue.slice(0, -1) : originValue;
}

function normalizeBase(baseValue) {
  if (!baseValue || baseValue === '/') {
    return '';
  }

  const withLeadingSlash = baseValue.startsWith('/')
    ? baseValue
    : `/${baseValue}`;

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
