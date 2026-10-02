import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "@latent/core/Stat";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Composites/Stat",
  component: Stat,
  tags: ["autodocs"],
  args: { icon: <Icon name="users" />, value: "2,400+", label: "Teams building with Latent" },
} satisfies Meta<typeof Stat>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
