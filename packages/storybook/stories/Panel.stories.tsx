import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "@latent/core/Panel";

const meta = {
  title: "Composites/Panel",
  component: Panel,
  tags: ["autodocs"],
  args: { children: <div style={{ padding: 24 }}>Panel content</div> },
} satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
