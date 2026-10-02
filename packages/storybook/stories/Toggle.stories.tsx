import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "@latent/core/Toggle";

const meta = {
  title: "Atoms/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { options: ["List", "Grid"], selectedIndex: 0, onChange: () => {} },
  render: function Render(args) {
    const [i, setI] = React.useState(args.selectedIndex);
    return <Toggle {...args} selectedIndex={i} onChange={setI} />;
  },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondSelected: Story = { args: { selectedIndex: 1 } };
