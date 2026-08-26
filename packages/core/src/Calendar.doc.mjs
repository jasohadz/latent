export default {
  name: "Calendar",
  summary: "A date-picker grid with month/year navigation. Controlled — the consumer owns month/year/selection state.",
  props: [
    { name: "month", type: "number", default: "—", description: "0-11, matching Date#getMonth()." },
    { name: "year", type: "number", default: "—", description: "Full year, e.g. 2025." },
    { name: "selectedDays", type: "number[]", default: "[]", description: "Day-of-month numbers (current month only) rendered in the Active (selected) state." },
    { name: "rangeDays", type: "number[]", default: "[]", description: "Day-of-month numbers (current month only) rendered in the Range (in-range highlight) state." },
    { name: "disabledDays", type: "number[]", default: "[]", description: "Day-of-month numbers (current month only) rendered Disabled (non-interactive)." },
    { name: "yearOptions", type: "number[]", default: "10 years centered on `year`", description: "Options populating the year <select>." },
    { name: "onSelectDay", type: "(day: number) => void", default: "undefined", description: "Fires when a current-month day is clicked. Adjacent-month (hidden) days are non-interactive." },
    { name: "onPrevMonth", type: "() => void", default: "undefined", description: "Fires when the previous-month nav button is clicked." },
    { name: "onNextMonth", type: "() => void", default: "undefined", description: "Fires when the next-month nav button is clicked." },
    { name: "onMonthChange", type: "(month: number) => void", default: "undefined", description: "Fires when the month <select> changes." },
    { name: "onYearChange", type: "(year: number) => void", default: "undefined", description: "Fires when the year <select> changes." },
  ],
  example: `<Calendar month={8} year={2025} selectedDays={[9, 13]} rangeDays={[10, 11, 12]} onSelectDay={handleSelect} onPrevMonth={handlePrev} onNextMonth={handleNext} onMonthChange={setMonth} onYearChange={setYear} />`,
  doNot: [
    "Don't compute the day grid yourself — pass month/year and let Calendar derive weeks (including adjacent-month padding) internally.",
    "Don't hardcode colors/spacing in overrides; add or reuse a --lat-* custom property instead.",
  ],
  swizzlePath: "packages/core/src/Calendar.tsx",
  extends: null,
  states: [
    { name: "default", description: "Current-month day, no special state.", tokens: ["day text color (default)"] },
    { name: "hover", description: "Muted background on pointer hover.", tokens: ["day hover background"] },
    { name: "active (selected)", description: "Brand background, inverse text — one of selectedDays.", tokens: ["day active background", "day active text color"] },
    { name: "range", description: "Subtle background — one of rangeDays, between two selected endpoints.", tokens: ["day range background"] },
    { name: "disabled", description: "Native disabled attribute; dimmed text. Combines with range as a distinct \"range-disabled\" CSS class, though it shares the plain disabled text-color token.", tokens: ["day disabled text color"] },
    { name: "hidden", description: "Adjacent-month padding day — rendered as plain text, not a button at all, non-interactive by construction rather than by a disabled attribute.", tokens: ["day hidden text color"] },
  ],
  // Real, significant gap found by tracing the actual keyboard behavior,
  // not assumed from "it's a date picker so it probably has grid nav":
  // Calendar has NO arrow-key navigation between day cells at all. Every
  // day is a real <button> (confirmed in Calendar.tsx), so Tab/Shift+Tab
  // and Enter/Space work per-button natively — but there's no onKeyDown
  // implementing the WAI-ARIA date-grid pattern (ArrowUp/Down/Left/Right
  // moving focus between cells), no role="grid"/"row"/"gridcell" on the
  // container structure (plain divs with a CSS grid class only), and each
  // day button's only accessible content is the bare day-of-month number
  // — no aria-label with the full date, no aria-current="date" for today,
  // no aria-selected for the active day. A keyboard user must Tab through
  // up to 42 individual day buttons one at a time to reach a given date,
  // with no indication via a screen reader of which date each button
  // actually represents beyond the bare number. The header nav
  // (prev/next/month-select/year-select) is genuinely well-labeled
  // (aria-label on both nav buttons and both selects) and has a real
  // :focus-visible ring bound to color.border.focus — this gap is
  // specific to the day grid, not the whole component.
  accessibility: {
    keyboardInteractions: [
      { key: "Tab / Shift+Tab", action: "Moves focus to the next/previous focusable element in DOM order — nav buttons, selects, then every visible day button in row-major order. No arrow-key grid navigation exists." },
      { key: "Enter or Space (on a day button)", action: "Selects that day — native <button> activation, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-label (nav buttons)", description: '"Previous month" / "Next month" — present and correct.' },
      { attribute: "aria-label (selects)", description: '"Month" / "Year" — present and correct on both <select> elements.' },
      { attribute: "aria-label (day buttons)", description: "Missing — each day button's only accessible name is its bare day-of-month number (e.g. \"15\"), not the full date. A screen reader announces \"15, button\" with no month/year context." },
      { attribute: "aria-current / aria-selected", description: "Neither is set anywhere — today's date and the selected day(s) are conveyed only visually (background color), not programmatically." },
    ],
  },
  // The Calendar Day states in Figma (Default/Hover/Active/Hidden/Disabled/
  // Range/Range Disabled) map to CSS pseudo-classes and modifier classes
  // here rather than separate components — see Calendar.css.
  figmaTokens: {
    "container padding/gap": "spacing.16",
    "container background": "color.background.default",
    "container border": "color.border.subtle",
    "container border-radius": "radius.card",
    "header gap / select-group gap": "spacing.8",
    "nav-button padding": "spacing.8",
    "nav-button border": "color.border.brand",
    "nav-button border-radius": "radius.input",
    "nav-button hover background": "color.action.secondary.hover",
    "nav-button icon color": "color.icon.default",
    "select padding (horizontal)": "spacing.8",
    "select border": "color.border.default",
    "select border-radius": "radius.input",
    "select font-size": "typography.input.value.font-size.sm",
    "select line-height": "typography.input.value.line-height.sm",
    "body/grid gap": "spacing.4",
    "weekday text color": "color.text.tertiary",
    "weekday font-size": "font-size.200",
    "day border-radius": "radius.full",
    "day font-size": "font-size.200",
    "day text color (default)": "color.text.primary",
    "day hover background": "color.background.muted",
    "day active background": "color.action.primary.default",
    "day active text color": "color.text.on-brand",
    "day range background": "color.background.subtle",
    "day disabled text color": "color.text.disabled",
    "day hidden text color": "color.text.tertiary",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "focus ring offset": "sizing.focus-ring-offset",
  },
};
