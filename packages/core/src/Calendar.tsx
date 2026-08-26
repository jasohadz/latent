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

function formatFullDate(year: number, month: number, day: number): string {
  return new Date(year, month, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

    function isFocusable(w: number, d: number): boolean {
      const cell = weeks[w]?.[d];
      return Boolean(cell) && !cell.hidden && !disabledDays.includes(cell.day);
    }

    function findInitialFocus(): { week: number; day: number } {
      for (let w = 0; w < weeks.length; w++) {
        for (let d = 0; d < 7; d++) {
          if (!weeks[w][d].hidden && selectedDays.includes(weeks[w][d].day)) return { week: w, day: d };
        }
      }
      for (let w = 0; w < weeks.length; w++) {
        for (let d = 0; d < 7; d++) {
          if (isFocusable(w, d)) return { week: w, day: d };
        }
      }
      return { week: 0, day: 0 };
    }

    const [focusPos, setFocusPos] = React.useState(findInitialFocus);

    // Re-clamp whenever the visible grid changes shape (month/year navigated
    // externally, e.g. via the header selects) — the previous focusPos may
    // no longer point at a real day in the new grid. Deliberately does not
    // steal DOM focus here — only updates which cell tabIndex=0 lands on,
    // so changing the month via the dropdown doesn't yank focus into the grid.
    React.useEffect(() => {
      setFocusPos((prev) => (isFocusable(prev.week, prev.day) ? prev : findInitialFocus()));
      // Intentionally keyed on [month, year] only, not on every prop these
      // closures touch — this should run when the visible grid changes
      // shape, not on every render (no lint tool enforces exhaustive-deps
      // in this repo; the narrower list here is deliberate, not an oversight).
    }, [month, year]);

    const dayRefs = React.useRef(new Map<string, HTMLButtonElement>());

    // Moves the roving-tabindex grid cursor. Scoped to the currently visible
    // month only, by design — deliberately does not cross into the previous/
    // next month (those cells are non-interactive <span>s, not real buttons;
    // crossing would mean calling onPrevMonth/onNextMonth and refocusing once
    // the new month's props land, real added complexity not attempted here —
    // see Calendar.doc.mjs). Skips over hidden/disabled cells in the movement
    // direction rather than landing on an unfocusable one; if no real cell is
    // found before running off the visible grid, focus simply doesn't move.
    function moveFocus(deltaWeek: number, deltaDay: number) {
      let w = focusPos.week;
      let d = focusPos.day;
      for (let attempt = 0; attempt < 42; attempt++) {
        w += deltaWeek;
        d += deltaDay;
        if (d < 0) { d = 6; w -= 1; }
        if (d > 6) { d = 0; w += 1; }
        if (w < 0 || w >= weeks.length) return;
        if (isFocusable(w, d)) {
          setFocusPos({ week: w, day: d });
          dayRefs.current.get(`${w}-${d}`)?.focus();
          return;
        }
      }
    }

    function moveToRowEdge(edge: "start" | "end") {
      const w = focusPos.week;
      const range = edge === "start" ? [0, 1, 2, 3, 4, 5, 6] : [6, 5, 4, 3, 2, 1, 0];
      for (const d of range) {
        if (isFocusable(w, d)) {
          setFocusPos({ week: w, day: d });
          dayRefs.current.get(`${w}-${d}`)?.focus();
          return;
        }
      }
    }

    function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); moveFocus(0, -1); break;
        case "ArrowRight": e.preventDefault(); moveFocus(0, 1); break;
        case "ArrowUp": e.preventDefault(); moveFocus(-1, 0); break;
        case "ArrowDown": e.preventDefault(); moveFocus(1, 0); break;
        case "Home": e.preventDefault(); moveToRowEdge("start"); break;
        case "End": e.preventDefault(); moveToRowEdge("end"); break;
      }
    }

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
          <div
            className="lat-calendar__grid"
            role="grid"
            aria-label={`${MONTH_NAMES[month]} ${year}`}
            onKeyDown={handleGridKeyDown}
          >
            {weeks.map((week, weekIndex) => (
              <div className="lat-calendar__row" role="row" key={weekIndex}>
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
                  const isRoving = focusPos.week === weekIndex && focusPos.day === dayIndex;
                  return (
                    <button
                      type="button"
                      role="gridcell"
                      key={dayIndex}
                      ref={(el) => {
                        const key = `${weekIndex}-${dayIndex}`;
                        if (el) dayRefs.current.set(key, el);
                        else dayRefs.current.delete(key);
                      }}
                      className={["lat-calendar__day", stateClass].filter(Boolean).join(" ")}
                      disabled={isDisabled}
                      tabIndex={isRoving ? 0 : -1}
                      aria-label={formatFullDate(year, month, cell.day)}
                      aria-selected={isActive}
                      onClick={() => onSelectDay?.(cell.day)}
                      onFocus={() => setFocusPos({ week: weekIndex, day: dayIndex })}
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
