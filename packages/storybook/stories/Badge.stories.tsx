import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@latent/core/Badge";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { variant: "brand", size: "medium", children: "New", icon: <Icon name="sparkles" /> },
  argTypes: {
    variant: { control: "inline-radio", options: ["neutral", "brand", "success", "warning", "danger"] },
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dismissible: Story = {
  args: { variant: "danger", children: "Error", icon: <Icon name="circle-alert" />, onDismiss: () => {} },
};
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8 }}>
      <Badge {...args} variant="neutral">Neutral</Badge>
      <Badge {...args} variant="brand">New</Badge>
      <Badge {...args} variant="success" icon={<Icon name="check" />}>Active</Badge>
      <Badge {...args} variant="warning" icon={<Icon name="triangle-alert" />}>Pending</Badge>
      <Badge {...args} variant="danger" icon={<Icon name="circle-alert" />}>Error</Badge>
    </div>
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Badge {...args} size="small">Small</Badge>
      <Badge {...args} size="medium">Medium</Badge>
      <Badge {...args} size="large">Large</Badge>
    </div>
  ),
};
