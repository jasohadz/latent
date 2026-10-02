import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Atoms/Icon",
  component: Icon,
  tags: ["autodocs"],
  args: { name: "sparkles", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Set: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12 }}>
      {["arrow-up", "sparkles", "users", "chevron-right", "settings", "zap"].map((n) => (
        <Icon key={n} {...args} name={n} />
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
        <Icon key={s} {...args} size={s} />
      ))}
    </div>
  ),
};
