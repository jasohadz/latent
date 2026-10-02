import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNav, type TopNavMenu } from "@latent/core/TopNav";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Navigation/TopNav",
  component: TopNav,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    menu: "none",
    onMenuChange: () => {},
    logo: <img src="/latent-logo-icon-default.svg" alt="Latent" width={24} height={24} />,
    ctaLabel: "Free Trial",
    productItems: [
      { title: "Analytics", description: "Track usage", icon: <Icon name="chart-bar" /> },
      { title: "Automations", description: "Save time", icon: <Icon name="zap" /> },
    ],
    downloadFeatured: {
      title: "Download for macOS",
      description: "Recommended for most users",
      icon: <Icon name="apple" />,
    },
    downloadItems: [{ title: "Windows", description: "64-bit", icon: <Icon name="monitor" /> }],
  },
  argTypes: { menu: { control: "inline-radio", options: ["none", "product", "download"] } },
  render: function Render(args) {
    const [menu, setMenu] = React.useState<TopNavMenu>(args.menu ?? "none");
    React.useEffect(() => setMenu(args.menu ?? "none"), [args.menu]);
    return (
      // Room below for the open mega menu so it's captured in snapshots.
      <div style={{ minHeight: args.menu === "none" ? undefined : 480 }}>
        <TopNav {...args} menu={menu} onMenuChange={setMenu} />
      </div>
    );
  },
} satisfies Meta<typeof TopNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const ProductMenuOpen: Story = { args: { menu: "product" } };
export const DownloadMenuOpen: Story = { args: { menu: "download" } };
