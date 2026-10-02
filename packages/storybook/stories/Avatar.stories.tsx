import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "@latent/core/Avatar";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { size: "medium", shape: "circle", initial: "F" },
  argTypes: {
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
    shape: { control: "inline-radio", options: ["circle", "square"] },
  },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {};
export const IconSquare: Story = { args: { shape: "square", initial: undefined, icon: <Icon name="user" /> } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Avatar {...args} size="small" />
      <Avatar {...args} size="medium" />
      <Avatar {...args} size="large" />
    </div>
  ),
};
