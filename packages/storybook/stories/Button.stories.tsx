import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@latent/core/Button";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  args: { variant: "primary", size: "md", children: "Save", onClick: () => {} },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Loading: Story = { args: { isLoading: true, children: "Saving" } };
export const Disabled: Story = { args: { disabled: true } };
export const WithIcon: Story = { args: { icon: <Icon name="chevron-right" size="xs" />, children: "Next" } };
export const IconOnlyGhost: Story = {
  render: () => (
    <Button variant="ghost" iconOnly aria-label="More options" icon={<Icon name="ellipsis" size="xs" />} onClick={() => {}} />
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
};
