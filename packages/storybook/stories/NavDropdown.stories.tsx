import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavDropdown } from "@latent/core/NavDropdown";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Navigation/NavDropdown",
  component: NavDropdown,
  tags: ["autodocs"],
  args: {
    label: "Resources",
    icon: <Icon name="boxes" />,
    expanded: true,
    onToggle: () => {},
    subItems: [{ label: "Tutorials" }, { label: "Academy" }, { label: "Experts" }],
  },
  render: function Render(args) {
    const [open, setOpen] = React.useState(args.expanded);
    return <NavDropdown {...args} expanded={open} onToggle={setOpen} />;
  },
} satisfies Meta<typeof NavDropdown>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};
export const Collapsed: Story = { args: { expanded: false } };
