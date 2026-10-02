import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavSubItem } from "@latent/core/NavSubItem";

const meta = {
  title: "Navigation/NavSubItem",
  component: NavSubItem,
  tags: ["autodocs"],
  args: { label: "Tutorials", onClick: () => {} },
} satisfies Meta<typeof NavSubItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
