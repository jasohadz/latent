import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const dirname = import.meta.dirname;

// No local node_modules here on purpose — react/react-dom/vite/@vitejs/
// plugin-react/typescript are all already present at the repo root
// (confirmed 2026-08-26), and Node's module resolution walks up to find
// them from here. Adding a second copy under packages/gallery would risk
// a version drifting out of sync with the one packages/core/chat-app use.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@latent/core": path.resolve(dirname, "../core/src"),
      "@latent/theme": path.resolve(dirname, "../theme-neutral"),
    },
  },
  server: {
    // core/src and theme-neutral live outside this package's root — allow
    // the dev server to serve them directly rather than swizzling/copying.
    // Same gotcha packages/chat-app's vite.config.ts documents.
    fs: { allow: [path.resolve(dirname, "..")] },
  },
  // Button.tsx/Icon.tsx guard `process.env` with a typeof check now (fixed
  // 2026-08-25), so this isn't required to avoid a crash — but without it
  // their dev-only console.warn()s are silently treated as non-production
  // and fire regardless of NODE_ENV, which is the safe default, not the
  // precise one. Set explicitly so the gallery reflects real dev behavior.
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
});
