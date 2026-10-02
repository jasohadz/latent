import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavLink } from "@latent/core/TopNavLink";

const meta = {
  title: "Navigation/TopNavLink",
  component: TopNavLink,
  tags: ["autodocs"],
  args: { label: "Product", showChevron: true, onClick: () => {} },
} satisfies Meta<typeof TopNavLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { active: true } };
export const NoChevron: Story = { args: { label: "Pricing", showChevron: false } };
