import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatInput } from "@latent/core/ChatInput";

const meta = {
  title: "Chat/ChatInput",
  component: ChatInput,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { value: "", onChange: () => {}, onSubmit: () => {} },
  render: function Render(args) {
    const [v, setV] = React.useState(args.value);
    return <ChatInput {...args} value={v} onChange={setV} />;
  },
} satisfies Meta<typeof ChatInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithText: Story = { args: { value: "What variants does Button have?" } };
