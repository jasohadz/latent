import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MultiSelect } from "@latent/core/MultiSelect";

const hobbyItems = [
  { value: "hiking", label: "Hiking" },
  { value: "fishing", label: "Fishing" },
  { value: "reading", label: "Reading" },
  { value: "gaming", label: "Playing games" },
];

const meta = {
  title: "Composites/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
  args: { label: "Hobbies", placeholder: "Select hobbies", items: hobbyItems, value: ["hiking"], onChange: () => {} },
  render: function Render(args) {
    const [v, setV] = React.useState<string[]>(args.value);
    return <MultiSelect {...args} value={v} onChange={setV} />;
  },
} satisfies Meta<typeof MultiSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OneSelected: Story = {};
export const Empty: Story = { args: { value: [] } };
