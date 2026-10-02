import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleMultiple } from "@latent/core/ToggleMultiple";

const meta = {
  title: "Atoms/ToggleMultiple",
  component: ToggleMultiple,
  tags: ["autodocs"],
  args: { options: ["Day", "Week", "Month", "Quarter", "Year"], selectedIndex: 1, onChange: () => {} },
  render: function Render(args) {
    const [i, setI] = React.useState(args.selectedIndex);
    return <ToggleMultiple {...args} selectedIndex={i} onChange={setI} />;
  },
} satisfies Meta<typeof ToggleMultiple>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
