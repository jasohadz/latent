import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SubscribeField } from "@latent/core/SubscribeField";

const meta = {
  title: "Composites/SubscribeField",
  component: SubscribeField,
  tags: ["autodocs"],
  args: { buttonPosition: "side", value: "", onChange: () => {}, onSubmit: () => {} },
  argTypes: { buttonPosition: { control: "inline-radio", options: ["side", "bottom"] } },
  render: function Render(args) {
    const [v, setV] = React.useState(args.value);
    return <SubscribeField {...args} value={v} onChange={setV} />;
  },
} satisfies Meta<typeof SubscribeField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Side: Story = {};
export const Bottom: Story = { args: { buttonPosition: "bottom" } };
