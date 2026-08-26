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
  // Fixed 2026-08-26 — was a real, significant gap (see git history for
  // the original finding). Implements the WAI-ARIA date-grid pattern:
  // role="grid"/"row"/"gridcell", roving tabindex (one day button is
  // tabIndex=0 at a time; Tab now enters the grid once instead of
  // stopping at all 42 cells), Arrow/Home/End moving the roving cursor,
  // and a full aria-label per day (weekday, month, day, year, not just
  // the bare number) via Date#toLocaleDateString. aria-selected reflects
  // selectedDays. There is no "today" concept anywhere in this component
  // (no isToday logic, no today CSS class, no today prop) — an earlier
  // version of this doc incorrectly claimed one existed; corrected, not
  // just left stale, since it would have misled anyone reading it into
  // expecting aria-current for a feature that was never built.
  // Deliberate, documented limitation: arrow-key navigation is scoped to
  // the currently visible month only. It does not cross into the
  // previous/next month (those cells are non-interactive <span>s, not
  // real buttons) — reaching a date in an adjacent month still requires
  // Tab to the month/year controls, changing month, then Tab back into
  // the grid. Full month-crossing (auto-advancing month + refocusing the
  // correct day once the new month's props land) is real added
  // complexity, not attempted here.
  accessibility: {
    keyboardInteractions: [
      { key: "Tab / Shift+Tab", action: "Moves focus to the next/previous focusable element — nav buttons, selects, then the grid. Enters/exits the day grid at exactly one point (the roving-tabindex cell), not once per day button." },
      { key: "ArrowLeft / ArrowRight / ArrowUp / ArrowDown", action: "Moves the roving focus cursor one day/week within the visible month, skipping over hidden or disabled cells in that direction. Does not cross into the previous/next month — see the limitation noted above." },
      { key: "Home / End", action: "Moves to the first/last focusable day in the current row (week)." },
      { key: "Enter or Space (on the focused day button)", action: "Selects that day — native <button> activation, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-label (nav buttons)", description: '"Previous month" / "Next month" — present and correct.' },
      { attribute: "aria-label (selects)", description: '"Month" / "Year" — present and correct on both <select> elements.' },
      { attribute: "aria-label (grid)", description: 'role="grid" container labeled with the visible month and year, e.g. "January 2026".' },
      { attribute: "aria-label (day buttons)", description: 'Full date via Date#toLocaleDateString (e.g. "Wednesday, January 15, 2026"), not just the bare day-of-month number.' },
      { attribute: "aria-selected", description: "Set on day buttons in selectedDays. No aria-current — there's genuinely no \"today\" concept in this component to attach it to (see above)." },
    ],
    focusBehaviors: [
      "Roving tabindex: only the focused day button (or the initial-focus target — the first selectedDays entry if any, else the first real day of the month) has tabIndex=0; every other real day button is tabIndex=-1 so Tab skips them. Clicking a different day with the mouse updates which cell is the roving target too, so a subsequent Tab-out-then-back-in lands on the right cell.",
    ],
  },
  // The Calendar Day states in Figma (Default/Hover/Active/Hidden/Disabled/
  // Range/Range Disabled) map to CSS pseudo-classes and modifier classes
  // here rather than separate components — see Calendar.css.
  //
  // Visual-fidelity pass, 2026-08-26 (separate from the keyboard-nav fix
  // above) — re-verified the header against a live pull of the real
  // Figma node (not the original doc text, which had drifted), reported
  // by a user actually looking at both side by side. Three real, confirmed
  // mismatches fixed:
  // - Nav buttons had a border (color.border.brand) and radius.input;
  //   the real Figma instance (a Button appearance=outline/size=small/
  //   icon-only=yes reuse) has no border at all and uses radius.slimlg —
  //   Button's own already-documented icon-only-small recipe
  //   (Button.doc.mjs), which Calendar's hand-rolled CSS had never
  //   actually matched.
  // - The month/year <select> font-size/line-height were bound to
  //   typography.input.value.font-size/line-height.sm, which resolves to
  //   16px in default density — the real Figma Label is bound to
  //   font.style.body-small (a stable 14px), the same token pair
  //   TextField/TextArea already use correctly for their own text.
  // - The selects had no real chevron icon at all — just the browser's
  //   own native <select> arrow (different shape/size/color per browser,
  //   no controlled spacing). Figma's Month/Year Field has a real Icon
  //   instance with a spacing.4 gap after the label. Fixed by wrapping
  //   each <select> (appearance: none, native arrow suppressed) with a
  //   real, decorative (aria-hidden) Icon positioned via CSS — see
  //   .lat-calendar__select-wrapper/__select-chevron in Calendar.css.
  figmaTokens: {
    "container padding/gap": "spacing.16",
    "container background": "color.background.default",
    "container border": "color.border.subtle",
    "container border-radius": "radius.card",
    "header gap / select-group gap": "spacing.8",
    // No "nav-button border" entry — fixed 2026-08-26, see accessibility/
    // states notes below: the real Figma instance (a Button
    // appearance=outline/size=small/icon-only=yes reuse) has no
    // border/stroke at all, confirmed by reading the live node directly,
    // not the original (wrong) doc text.
    "nav-button padding (vertical)": "spacing.6",
    "nav-button border-radius": "radius.slimlg",
    "nav-button hover background": "color.action.secondary.hover",
    "nav-button icon color": "color.icon.default",
    "select padding (left)": "spacing.8",
    // Right side reserves space for the chevron icon (icon width + gap +
    // edge inset) — see .lat-calendar__select-chevron in Calendar.css.
    "select padding (right)": "spacing.24",
    "select border": "color.border.default",
    "select border-radius": "radius.input",
    "select font-size": "font-style.body-small",
    "select line-height": "font-line-height.200-normal",
    "select chevron color": "color.icon.default",
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
