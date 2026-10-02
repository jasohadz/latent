import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextField } from "@latent/core/TextField";

const meta = {
  title: "Atoms/TextField",
  component: TextField,
  tags: ["autodocs"],
  args: { appearance: "outline", placeholder: "you@example.com" },
  argTypes: { appearance: { control: "inline-radio", options: ["filled", "outline"] } },
  render: function Render(args) {
    const [v, setV] = React.useState("");
    return <TextField {...args} value={v} onChange={(e) => setV(e.target.value)} />;
  },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Filled: Story = { args: { appearance: "filled" } };
export const Disabled: Story = { args: { disabled: true } };
