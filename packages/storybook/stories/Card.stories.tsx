import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "@latent/core/Card";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Composites/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    layout: "content",
    title: "Ship faster",
    body: "A design system that keeps Figma and code honestly in sync.",
    ctaLabel: "Learn more",
    icon: <Icon name="sparkles" />,
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Content: Story = {};
