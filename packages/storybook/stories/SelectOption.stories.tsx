import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectOption } from "@latent/core/SelectOption";

const meta = {
  title: "Composites/SelectOption",
  component: SelectOption,
  tags: ["autodocs"],
  args: { label: "Hiking", onClick: () => {} },
  // role="option" is only valid inside a listbox — which is where Select,
  // MultiSelect, and ComboBox always render it — so the stories do too.
  decorators: [
    (Story) => (
      <div role="listbox" aria-label="Hobbies" style={{ display: "flex", flexDirection: "column", width: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectOption>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const List: Story = {
  render: () => (
    <>
      <SelectOption label="Hiking" onClick={() => {}} />
      <SelectOption label="Fishing" selected onClick={() => {}} />
      <SelectOption label="Reading" onClick={() => {}} />
    </>
  ),
};
