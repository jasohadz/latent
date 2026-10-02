import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "@latent/core/Switch";

const meta = {
  title: "Atoms/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { pressed: true, supportingText: "Enable notifications", onChange: () => {} },
  render: function Render(args) {
    const [on, setOn] = React.useState(args.pressed);
    return <Switch {...args} pressed={on} onChange={setOn} />;
  },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { pressed: false } };
