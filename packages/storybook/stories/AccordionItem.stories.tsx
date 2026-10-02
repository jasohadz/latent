import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccordionItem } from "@latent/core/AccordionItem";

const meta = {
  title: "Composites/AccordionItem",
  component: AccordionItem,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    title: "What is Latent?",
    open: true,
    onToggle: () => {},
    children: "A proof-of-concept design system with an agent-facing CLI.",
  },
  render: function Render(args) {
    const [open, setOpen] = React.useState(args.open);
    return <AccordionItem {...args} open={open} onToggle={setOpen} />;
  },
} satisfies Meta<typeof AccordionItem>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
