import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectOption } from "@latent/core/SelectOption";

const meta = {
  title: "Composites/SelectOption",
  component: SelectOption,
  tags: ["autodocs"],
  args: { label: "Hiking", onClick: () => {} },
} satisfies Meta<typeof SelectOption>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const List: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", width: 240 }}>
      <SelectOption label="Hiking" onClick={() => {}} />
      <SelectOption label="Fishing" selected onClick={() => {}} />
      <SelectOption label="Reading" onClick={() => {}} />
    </div>
  ),
};
