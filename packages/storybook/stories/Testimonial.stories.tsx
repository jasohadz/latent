import type { Meta, StoryObj } from "@storybook/react-vite";
import { Testimonial } from "@latent/core/Testimonial";

const meta = {
  title: "Composites/Testimonial",
  component: Testimonial,
  tags: ["autodocs"],
  args: {
    quote: "Latent made it trivial to keep our design and code in sync.",
    name: "Jordan Reyes",
    role: "Design Systems Lead",
  },
} satisfies Meta<typeof Testimonial>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
