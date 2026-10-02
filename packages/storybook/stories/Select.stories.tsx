import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "@latent/core/Select";

const hobbyItems = [
  { value: "hiking", label: "Hiking" },
  { value: "fishing", label: "Fishing" },
  { value: "reading", label: "Reading" },
  { value: "gaming", label: "Playing games" },
];

const meta = {
  title: "Composites/Select",
  component: Select,
  tags: ["autodocs"],
  args: { label: "Hobby", placeholder: "Select hobby", items: hobbyItems, value: undefined, onChange: () => {} },
  render: function Render(args) {
    const [v, setV] = React.useState<string | undefined>(args.value);
    return <Select {...args} value={v} onChange={setV} />;
  },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithValue: Story = { args: { value: "fishing" } };
