import type { Meta, StoryObj } from "@storybook/react-vite";
import { MegaMenuItem } from "@latent/core/MegaMenuItem";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Navigation/MegaMenuItem",
  component: MegaMenuItem,
  tags: ["autodocs"],
  args: {
    layout: "standard",
    icon: <Icon name="chart-bar" />,
    title: "Analytics",
    description: "Track usage",
  },
  argTypes: { layout: { control: "inline-radio", options: ["standard", "featured"] } },
} satisfies Meta<typeof MegaMenuItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {};
export const Featured: Story = {
  args: {
    layout: "featured",
    icon: <Icon name="apple" />,
    title: "Download for macOS",
    description: "Recommended for most users",
    badgeLabel: "New",
  },
};
