import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "@latent/core/Search";

const meta = {
  title: "Composites/Search",
  component: Search,
  tags: ["autodocs"],
  args: { appearance: "outline", value: "", onChange: () => {}, onSubmit: () => {} },
  argTypes: { appearance: { control: "inline-radio", options: ["filled", "outline"] } },
  render: function Render(args) {
    const [v, setV] = React.useState(args.value);
    return <Search {...args} value={v} onChange={setV} />;
  },
} satisfies Meta<typeof Search>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Filled: Story = { args: { appearance: "filled" } };
