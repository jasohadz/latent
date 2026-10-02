import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "@latent/core/Field";

const meta = {
  title: "Composites/Field",
  component: Field,
  tags: ["autodocs"],
  args: { label: "Email", placeholder: "you@example.com", helperText: "This field is required" },
  render: function Render(args) {
    const [v, setV] = React.useState("");
    return <Field {...args} value={v} onChange={(e) => setV(e.target.value)} />;
  },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
