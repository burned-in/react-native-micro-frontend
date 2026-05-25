# GitHub Pages deployment

This repository publishes the Vite + Vike documentation site with GitHub Actions.

## Repository settings

1. Open **Settings → Pages** in GitHub.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`, or run the **Docs Pages** workflow manually.

The workflow builds `apps/docs-site` and uploads `apps/docs-site/dist/client` as the Pages artifact.

## Project page base path

For a normal project page such as:

```text
https://<owner>.github.io/react-native-micro-frontend/
```

use the default workflow. It sets:

```bash
GITHUB_PAGES_BASE=/react-native-micro-frontend/
```

This keeps assets, navigation, localized links, and Vike client routing under the repository path.

## Root domain or custom domain

If the site is served at the domain root, build with:

```bash
bun run docs:build:github-pages:root
```

or set the workflow environment to:

```yaml
env:
  GITHUB_PAGES_BASE: /
```

## Local verification

```bash
bun run docs:typecheck
bun run docs:build:github-pages
```

The output is generated at:

```text
apps/docs-site/dist/client
```

Do not commit that generated output; GitHub Actions uploads it directly.
