import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SideNav } from "@latent/core/SideNav";
import { NavItem } from "@latent/core/NavItem";
import { NavDropdown } from "@latent/core/NavDropdown";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Navigation/SideNav",
  component: SideNav,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { brand: "Acme Inc.", collapsed: false, onToggleCollapse: () => {} },
  render: function Render(args) {
    const [collapsed, setCollapsed] = React.useState(args.collapsed);
    const [open, setOpen] = React.useState(true);
    return (
      <SideNav {...args} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)}>
        <NavItem label="Overview" icon={<Icon name="layout-dashboard" />} selected onClick={() => {}} />
        <NavDropdown
          label="Resources"
          icon={<Icon name="boxes" />}
          expanded={open}
          onToggle={setOpen}
          subItems={[{ label: "Tutorials" }, { label: "Academy" }]}
        />
      </SideNav>
    );
  },
} satisfies Meta<typeof SideNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};
export const Collapsed: Story = { args: { collapsed: true } };
