import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "node:path";

const dirname = import.meta.dirname;

// Stories live here, not next to the components — packages/core/src is
// deliberately exactly 3 files per component (.tsx/.css/.doc.mjs), which the
// CLI's component discovery and the pre-commit hook both assume.
const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  // Reuse the gallery's public dir so TopNav's logo resolves at the same path.
  staticDirs: ["../../gallery/public"],
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      // Same aliases/define as packages/gallery/vite.config.ts — keep in step.
      resolve: {
        alias: {
          "@latent/core": path.resolve(dirname, "../../core/src"),
          "@latent/theme": path.resolve(dirname, "../../theme-neutral"),
        },
      },
      server: { fs: { allow: [path.resolve(dirname, "../..")] } },
      define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
      },
    }),
};

export default config;
