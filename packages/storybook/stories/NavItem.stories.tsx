import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavItem } from "@latent/core/NavItem";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Navigation/NavItem",
  component: NavItem,
  tags: ["autodocs"],
  args: { label: "Dashboard", icon: <Icon name="layout-dashboard" />, onClick: () => {} },
} satisfies Meta<typeof NavItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
