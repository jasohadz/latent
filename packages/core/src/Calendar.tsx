import React from "react";
import { Icon } from "./Icon";
import "./Calendar.css";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayCell {
  day: number;
  /** True for a day belonging to the previous/next month, shown faded and non-interactive. */
  hidden: boolean;
}

export interface CalendarProps {
  /** 0-11, matching Date#getMonth(). */
  month: number;
  year: number;
  /** Day-of-month numbers (current month only) rendered in the "Active" (selected) state. */
  selectedDays?: number[];
  /** Day-of-month numbers (current month only) rendered in the "Range" (in-range highlight) state. */
  rangeDays?: number[];
  /** Day-of-month numbers (current month only) rendered "Disabled" (non-interactive). */
  disabledDays?: number[];
  /** Options populating the year <select>. Defaults to 10 years centered on `year`. */
  yearOptions?: number[];
  onSelectDay?: (day: number) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  className?: string;
}

function getWeeks(month: number, year: number): DayCell[][] {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, hidden: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, hidden: false });
  }
  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextMonthDay++, hidden: true });
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/**
 * Calendar — a date-picker grid with month/year navigation. Controlled:
 * the consumer owns `month`/`year`/selection state and responds to the
 * callbacks. Styling comes entirely from --lat-* custom properties.
 */
export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      month,
      year,
      selectedDays = [],
      rangeDays = [],
      disabledDays = [],
      yearOptions,
      onSelectDay,
      onPrevMonth,
      onNextMonth,
      onMonthChange,
      onYearChange,
      className,
    },
    ref
  ) => {
    const weeks = getWeeks(month, year);
    const years = yearOptions ?? Array.from({ length: 10 }, (_, i) => year - 5 + i);
    const classes = ["lat-calendar", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes}>
        <div className="lat-calendar__header">
          <button
            type="button"
            className="lat-calendar__nav-button"
            aria-label="Previous month"
            onClick={onPrevMonth}
          >
            <Icon name="chevron-left" size="xs" weight="light" />
          </button>
          <div className="lat-calendar__select-group">
            <select
              className="lat-calendar__select"
              aria-label="Month"
              value={month}
              onChange={(e) => onMonthChange?.(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
            <select
              className="lat-calendar__select lat-calendar__select--year"
              aria-label="Year"
              value={year}
              onChange={(e) => onYearChange?.(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="lat-calendar__nav-button"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <Icon name="chevron-right" size="xs" weight="light" />
          </button>
        </div>

        <div className="lat-calendar__body">
          <div className="lat-calendar__weekday-row">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="lat-calendar__weekday">{label}</span>
            ))}
          </div>
          <div className="lat-calendar__grid">
            {weeks.map((week, weekIndex) => (
              <div className="lat-calendar__row" key={weekIndex}>
                {week.map((cell, dayIndex) => {
                  if (cell.hidden) {
                    return (
                      <span className="lat-calendar__day lat-calendar__day--hidden" key={dayIndex}>
                        {cell.day}
                      </span>
                    );
                  }
                  const isDisabled = disabledDays.includes(cell.day);
                  const isActive = selectedDays.includes(cell.day);
                  const isRange = rangeDays.includes(cell.day);
                  const stateClass = isDisabled
                    ? isRange
                      ? "lat-calendar__day--range-disabled"
                      : "lat-calendar__day--disabled"
                    : isActive
                    ? "lat-calendar__day--active"
                    : isRange
                    ? "lat-calendar__day--range"
                    : "";
                  return (
                    <button
                      type="button"
                      key={dayIndex}
                      className={["lat-calendar__day", stateClass].filter(Boolean).join(" ")}
                      disabled={isDisabled}
                      onClick={() => onSelectDay?.(cell.day)}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Calendar.displayName = "Calendar";
