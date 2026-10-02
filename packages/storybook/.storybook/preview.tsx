import React from "react";
import type { Preview } from "@storybook/react-vite";
// fonts.css first: its @imports must lead the bundled CSS or browsers drop them.
import "@latent/theme/fonts.css";
import "@latent/theme/theme.css";
import "./preview.css";

const preview: Preview = {
  // Toolbar light/dark switch — drives data-latent-mode on <html>, the same
  // attribute theme.css's :root[data-latent-mode="dark"] block reads.
  globalTypes: {
    latentMode: {
      description: "Latent color mode",
      toolbar: {
        title: "Mode",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { latentMode: "light" },
  decorators: [
    (Story, context) => {
      const mode = context.globals.latentMode ?? "light";
      document.documentElement.setAttribute("data-latent-mode", mode);
      return <Story />;
    },
  ],
  parameters: {
    layout: "centered",
    controls: { matchers: { color: /(background|color)$/i } },
    // Snapshot every story in both modes — each mode sets the latentMode
    // global the decorator above reads.
    chromatic: {
      modes: {
        light: { latentMode: "light" },
        dark: { latentMode: "dark" },
      },
    },
  },
};

export default preview;
