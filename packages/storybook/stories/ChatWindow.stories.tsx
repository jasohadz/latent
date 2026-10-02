import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatWindow } from "@latent/core/ChatWindow";
import { MessageBubble } from "@latent/core/MessageBubble";

const meta = {
  title: "Chat/ChatWindow",
  component: ChatWindow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  render: function Render() {
    const [v, setV] = React.useState("");
    return (
      <div style={{ height: 320 }}>
        <ChatWindow inputProps={{ value: v, onChange: setV, onSubmit: () => {} }}>
          <MessageBubble sender="assistant">Hi! Ask me anything about Latent.</MessageBubble>
          <MessageBubble sender="user">What variants does Button have?</MessageBubble>
          <MessageBubble sender="assistant">primary, secondary, and ghost.</MessageBubble>
        </ChatWindow>
      </div>
    );
  },
  // Overridden by render's controlled state; present so the required prop type-checks.
  args: { inputProps: { value: "", onChange: () => {}, onSubmit: () => {} } },
} satisfies Meta<typeof ChatWindow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Conversation: Story = {};
