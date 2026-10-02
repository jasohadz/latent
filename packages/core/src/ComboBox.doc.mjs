export default {
  name: "ComboBox",
  summary: "An editable, searchable dropdown: a labeled trigger with a leading search icon and a text input that filters a floating panel of real SelectOption rows as you type. Use it over Select when the list is long enough that typing beats scrolling.",
  props: [
    { name: "label", type: "string", default: "—", description: "The field's label, above the trigger." },
    { name: "placeholder", type: "string", default: '"Search..."', description: "Shown in the input when it's empty." },
    { name: "items", type: "{ value: string; label: string }[]", default: "—", description: "Every option, in order. Typing filters them by a case-insensitive match anywhere in the label." },
    { name: "value", type: "string", default: "undefined", description: "The chosen item's value. Controlled — the component holds only its own open state, typed text, and highlighted row." },
    { name: "onChange", type: "(value: string) => void", default: "—", description: "Fires with the picked item's value (click, or Enter on the highlighted row), then the panel closes and the input shows that item's label." },
    { name: "disabled", type: "boolean", default: "false", description: "Disables the input; the panel can't be opened." },
  ],
  example: `<ComboBox label="Country" placeholder="Search country..." items={countries} value={country} onChange={setCountry} />`,
  doNot: [
    "Don't use ComboBox for a handful of options — Select is the simpler control when there's nothing worth searching.",
    "Don't expect free-text values — onChange only ever fires with one of the items' values; text that matches nothing is discarded when the panel closes.",
    "Don't expect a drop shadow on the panel — Figma's Combo Box (like Select) has only a 1px border.",
  ],
  swizzlePath: "packages/core/src/ComboBox.tsx",
  extends: null,
  states: [
    { name: "closed", description: "Input shows the chosen item's label, or the placeholder; default border.", tokens: ["trigger border", "placeholder color"] },
    { name: "open", description: "Trigger border switches to brand; the panel renders 4px below with the filtered rows. The highlighted row (first match by default) uses SelectOption's hover background — Figma's open variant shows it as a Select Option in state=hover.", tokens: ["trigger border (active)", "panel background", "panel border", "panel border-radius", "panel padding", "active row background"] },
    { name: "disabled", description: "Trigger border dims, cursor becomes not-allowed.", tokens: ["trigger border (disabled)"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Typing", action: "Filters the rows and opens the panel; the first match is highlighted." },
      { key: "ArrowDown / ArrowUp", action: "Opens the panel, or moves the highlighted row (wrapping). Focus never leaves the input." },
      { key: "Enter", action: "Picks the highlighted row and closes the panel." },
      { key: "Escape", action: "Closes the panel; the input goes back to the chosen item's label." },
    ],
    ariaAttributes: [
      { attribute: 'role="combobox", aria-expanded, aria-controls, aria-autocomplete="list" (input)', description: "The WAI-ARIA combobox pattern — unlike Select, whose options are individually Tab-reachable, ComboBox keeps focus in the input." },
      { attribute: "aria-activedescendant (input)", description: "Points at the highlighted row's id, so screen readers announce it as the arrow keys move." },
      { attribute: 'role="listbox", aria-labelledby (panel)', description: "Labelled by the same id as the input's label. Rows are real SelectOption elements with tabIndex -1." },
    ],
    focusBehaviors: [
      "Outside click closes the panel, the same document mousedown containment check Select uses.",
      "Rows cancel mousedown so clicking one doesn't blur the input before the click lands.",
    ],
  },
  // Ported 2026-10-02 from Figma's "Combo Box" COMPONENT_SET (289:1920,
  // state=closed/open), read live via figma_execute. Same session, before
  // porting: the Figma component's trigger/panel radius, border widths, and
  // text font sizes were unbound (values matched, bindings didn't — despite
  // its own description claiming radius/lg) and were bound to exactly what
  // Select's live component uses (radius/lg, sizing-border/thin,
  // font/style/body-small). One real difference from Select, kept as
  // Figma has it: trigger gap is spacing.4 (Select's code uses spacing.8,
  // though Select's own Figma trigger is also bound to spacing/4 — a
  // separate Select drift, not addressed here). Figma's open variant shows
  // typed "Uni" next to rows that include "Uruguay", which a substring
  // filter wouldn't keep — treated as illustrative demo text, not a
  // filtering spec. Not yet in component-bindings.live.json until Latent
  // Sync runs with ComboBox in its COMPONENT_NAMES.
  figmaTokens: {
    "gap (label to trigger)": "spacing.4",
    "trigger padding": "spacing.8",
    "trigger gap": "spacing.4",
    "trigger border-radius": "radius.lg",
    "trigger border width": "sizing-border.thin",
    "trigger border": "color.border.default",
    "trigger border (active)": "color.border.brand",
    "trigger border (disabled)": "color.border.subtle",
    "label color": "color.text.secondary",
    "label font-size": "font-style.body-small",
    "label font-weight": "font-weight.600",
    "value color": "color.text.primary",
    "value font-size": "font-style.body-small",
    "placeholder color": "color.text.tertiary",
    "panel padding": "spacing.4",
    "panel background": "color.background.default",
    "panel border": "color.border.subtle",
    "panel border-radius": "radius.lg",
    "active row background": "color.background.brand",
  },
  // "label font-weight": Bold font style, no fontWeight variable bound —
  // same as Select's label. "trigger border (disabled)": Figma has no
  // disabled variant; reused from Select's code. "active row background":
  // bound inside the Select Option instance, which the coarse check reads
  // as SelectOption's binding, not ComboBox's.
  figmaTokensSkipLiveCheck: ["label font-weight", "trigger border (disabled)", "active row background"],
};
