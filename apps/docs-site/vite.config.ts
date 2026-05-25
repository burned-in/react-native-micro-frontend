import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vike from "vike/plugin";

const siteBase = normalizeBasePath(process.env.GITHUB_PAGES_BASE ?? process.env.SITE_BASE ?? "/");

export default defineConfig({
  base: siteBase,
  plugins: [react(), vike()],
  build: {
    chunkSizeWarningLimit: 900,
  },
});

function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === "/") {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;

  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
