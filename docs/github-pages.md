# GitHub Pages deployment

This repository publishes the Vite + Vike documentation site with GitHub Actions.

## Default deployment URL

With the current repository remote, the default GitHub Pages URL is:

```text
https://burned-in.github.io/react-native-micro-frontend/
```

The workflow sets:

```bash
GITHUB_PAGES_BASE=/react-native-micro-frontend/
VITE_PUBLIC_SITE_ORIGIN=https://burned-in.github.io
```

That combination makes asset URLs, canonical URLs, Open Graph URLs, localized navigation, `robots.txt`, and `sitemap.xml` resolve under the project-page path.

## Repository settings

1. Open **Settings → Pages** in GitHub.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`, or run the **Docs Pages** workflow manually.

The workflow builds `apps/docs-site` and uploads `apps/docs-site/dist/client` as the Pages artifact.

## SEO output

The docs build emits:

```text
apps/docs-site/dist/client/sitemap.xml
apps/docs-site/dist/client/robots.txt
apps/docs-site/dist/client/og-image.svg
apps/docs-site/dist/client/favicon.svg
apps/docs-site/dist/client/site.webmanifest
apps/docs-site/dist/client/.nojekyll
```

Every pre-rendered route also includes:

- canonical URL
- localized `hreflang` alternates
- Open Graph metadata
- Twitter card metadata
- JSON-LD structured data
- favicon and web app manifest
- indexable robots directives

## Custom domain with an apex A record

For an apex domain such as `example.com`, set the GitHub repository **Settings → Pages → Custom domain** to the domain first, then configure DNS.

Use these GitHub Pages A records at your DNS provider:

```text
@  A  185.199.108.153
@  A  185.199.109.153
@  A  185.199.110.153
@  A  185.199.111.153
```

Optional IPv6 records:

```text
@  AAAA  2606:50c0:8000::153
@  AAAA  2606:50c0:8001::153
@  AAAA  2606:50c0:8002::153
@  AAAA  2606:50c0:8003::153
```

For the `www` subdomain, add:

```text
www  CNAME  burned-in.github.io
```

Do not include the repository name in the CNAME target.

## Custom domain workflow variables

If the custom domain should serve this project at the domain root, add repository variables in **Settings → Secrets and variables → Actions → Variables**:

```text
DOCS_SITE_BASE=/
DOCS_PUBLIC_ORIGIN=https://example.com
DOCS_CUSTOM_DOMAIN=example.com
```

Then run the **Docs Pages** workflow again.

For local verification with a root custom-domain build:

```bash
GITHUB_PAGES_BASE=/ VITE_PUBLIC_SITE_ORIGIN=https://example.com bun run docs:build
```

## DNS verification commands

After DNS propagation, verify the apex A records:

```bash
dig example.com +noall +answer -t A
```

Verify `www`:

```bash
dig www.example.com +nostats +nocomments +nocmd
```

DNS changes can take up to 24 hours. After GitHub accepts the domain, enable **Enforce HTTPS** in **Settings → Pages**.

Reference: GitHub Pages custom domain documentation lists the official apex A/AAAA records and the `www` CNAME target pattern.
