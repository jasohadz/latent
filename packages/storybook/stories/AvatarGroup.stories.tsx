import type { Meta, StoryObj } from "@storybook/react-vite";
import { AvatarGroup } from "@latent/core/AvatarGroup";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Composites/AvatarGroup",
  component: AvatarGroup,
  tags: ["autodocs"],
  args: {
    spacing: "overlap",
    avatars: [{ initial: "F" }, { initial: "J" }, { icon: <Icon name="user" /> }],
    overflowCount: 2,
  },
  argTypes: { spacing: { control: "inline-radio", options: ["overlap", "spaced"] } },
} satisfies Meta<typeof AvatarGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Overlap: Story = {};
export const Spaced: Story = { args: { spacing: "spaced" } };
