import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "@latent/core/Tabs";

const meta = {
  title: "Atoms/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: { options: ["Day", "Week", "Month", "Quarter", "Year"], selectedIndex: 1, onChange: () => {} },
  render: function Render(args) {
    const [i, setI] = React.useState(args.selectedIndex);
    return <Tabs {...args} selectedIndex={i} onChange={setI} />;
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
