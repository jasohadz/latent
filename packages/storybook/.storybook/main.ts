import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "node:path";

const dirname = import.meta.dirname;

// Stories live here, not next to the components — packages/core/src is
// deliberately exactly 3 files per component (.tsx/.css/.doc.mjs), which the
// CLI's component discovery and the pre-commit hook both assume.
const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)",
    '../src/stories/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'
  ],
  framework: "@storybook/react-vite",
  // Compiles Story UI's .mdx pages — without it `storybook build` (and so
  // Chromatic) fails on them; dev mode compiles lazily and never notices.
  // addon-mcp serves an MCP endpoint at http://localhost:6006/mcp so coding
  // agents (and Story UI) can read component docs and stories. The component
  // manifest is what it serves — built from the stories and their source.
  addons: ["@storybook/addon-docs", "@storybook/addon-mcp"],
  features: { experimentalComponentsManifest: true },
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
