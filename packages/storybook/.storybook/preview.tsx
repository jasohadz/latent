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
    // Toolbar density switch — drives data-latent-density on <html>, which
    // theme.css's :root[data-latent-density="condensed"] block reads
    // (spacing, radius, type, and action heights all compress).
    latentDensity: {
      description: "Latent density",
      toolbar: {
        title: "Density",
        icon: "component",
        items: [
          { value: "default", title: "Default" },
          { value: "condensed", title: "Condensed" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { latentMode: "light", latentDensity: "default" },
  decorators: [
    (Story, context) => {
      const mode = context.globals.latentMode ?? "light";
      document.documentElement.setAttribute("data-latent-mode", mode);
      // "default" is theme.css's baseline, so it's the absence of the attribute.
      const density = context.globals.latentDensity ?? "default";
      if (density === "default") document.documentElement.removeAttribute("data-latent-density");
      else document.documentElement.setAttribute("data-latent-density", density);
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
