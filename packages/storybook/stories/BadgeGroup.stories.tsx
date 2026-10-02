import type { Meta, StoryObj } from "@storybook/react-vite";
import { BadgeGroup } from "@latent/core/BadgeGroup";

const meta = {
  title: "Composites/BadgeGroup",
  component: BadgeGroup,
  tags: ["autodocs"],
  args: { position: "leading", badgeLabel: "New", children: "Latent 2.0 is here", onClick: () => {} },
  argTypes: {
    position: { control: "inline-radio", options: ["leading", "trailing", "none"] },
    size: { control: "inline-radio", options: ["small", "large"] },
  },
} satisfies Meta<typeof BadgeGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Leading: Story = {};
export const Trailing: Story = { args: { position: "trailing" } };
export const NoBadge: Story = { args: { position: "none" } };
