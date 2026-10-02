import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@latent/core/Calendar";
import { Panel } from "@latent/core/Panel";

// Fixed month/year/selection so Chromatic snapshots don't change with the
// real date.
const meta = {
  title: "Composites/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  args: {
    month: 7,
    year: 2026,
    selectedDays: [9, 13],
    rangeDays: [10, 11, 12],
    onSelectDay: () => {},
    onPrevMonth: () => {},
    onNextMonth: () => {},
    onMonthChange: () => {},
    onYearChange: () => {},
  },
  render: function Render(args) {
    const [month, setMonth] = React.useState(args.month);
    const [year, setYear] = React.useState(args.year);
    const [selected, setSelected] = React.useState(args.selectedDays);
    return (
      <Panel style={{ display: "inline-block" }}>
        <Calendar
          {...args}
          month={month}
          year={year}
          selectedDays={selected}
          onSelectDay={(day) => setSelected([day])}
          onPrevMonth={() => setMonth((m) => (m === 0 ? 11 : m - 1))}
          onNextMonth={() => setMonth((m) => (m === 11 ? 0 : m + 1))}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </Panel>
    );
  },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RangeSelected: Story = {};
