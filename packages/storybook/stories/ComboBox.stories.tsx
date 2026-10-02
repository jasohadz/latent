import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboBox } from "@latent/core/ComboBox";

const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "uy", label: "Uruguay" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
];

const meta = {
  title: "Composites/ComboBox",
  component: ComboBox,
  tags: ["autodocs"],
  args: { label: "Country", placeholder: "Search country...", items: countries, value: undefined, onChange: () => {} },
  render: function Render(args) {
    const [v, setV] = React.useState<string | undefined>(args.value);
    return (
      <div style={{ width: 280, minHeight: 320 }}>
        <ComboBox {...args} value={v} onChange={setV} />
      </div>
    );
  },
} satisfies Meta<typeof ComboBox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithValue: Story = { args: { value: "uk" } };
export const Disabled: Story = { args: { disabled: true, value: "ca" } };
