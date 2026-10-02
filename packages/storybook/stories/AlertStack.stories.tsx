import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertStack } from "@latent/core/AlertStack";
import { Alert } from "@latent/core/Alert";
import { Icon } from "@latent/core/Icon";

const meta = {
  title: "Composites/AlertStack",
  component: AlertStack,
  tags: ["autodocs"],
  args: {
    children: ["First notice", "Second notice", "Third notice"].map((text) => (
      <Alert key={text} appearance="inverse" icon={<Icon name="megaphone" />} onDismiss={() => {}}>
        {text}
      </Alert>
    )),
  },
} satisfies Meta<typeof AlertStack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeAlerts: Story = {};
