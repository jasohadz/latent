import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageBubble } from "@latent/core/MessageBubble";

const meta = {
  title: "Chat/MessageBubble",
  component: MessageBubble,
  tags: ["autodocs"],
  args: { sender: "assistant", children: "How can I help?" },
  argTypes: { sender: { control: "inline-radio", options: ["user", "assistant"] } },
} satisfies Meta<typeof MessageBubble>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {};
export const User: Story = { args: { sender: "user", children: "What variants does Button have?" } };
