import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "@latent/core/Alert";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Composites/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: { appearance: "inverse", icon: <Icon name="megaphone" />, children: "New updates are available." },
  argTypes: { appearance: { control: "inline-radio", options: ["inverse", "subtle"] } },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Inverse: Story = { args: { onDismiss: () => {} } };
export const Subtle: Story = { args: { appearance: "subtle", onExpand: () => {} } };
