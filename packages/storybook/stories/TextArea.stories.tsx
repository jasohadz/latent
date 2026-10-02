import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextArea } from "@latent/core/TextArea";

const meta = {
  title: "Atoms/TextArea",
  component: TextArea,
  tags: ["autodocs"],
  args: { appearance: "outline", placeholder: "Enter text" },
  argTypes: { appearance: { control: "inline-radio", options: ["filled", "outline"] } },
  render: function Render(args) {
    const [v, setV] = React.useState("");
    return <TextArea {...args} value={v} onChange={(e) => setV(e.target.value)} />;
  },
} satisfies Meta<typeof TextArea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Filled: Story = { args: { appearance: "filled" } };
