export default {
  name: "MultiSelect",
  summary: "A labeled multi-value dropdown. Selected values render as real, dismissible Badge chips wrapping inside the bordered trigger itself, next to a chevron. Opens a floating panel of real SelectOption rows.",
  props: [
    { name: "label", type: "string", default: "—", description: "The field's label, above the trigger." },
    { name: "placeholder", type: "string", default: '"Select..."', description: "Shown in the trigger when nothing is selected." },
    { name: "items", type: "{ value: string; label: string }[]", default: "—", description: "The panel's options, in order." },
    { name: "value", type: "string[]", default: "—", description: "The chosen items' values. Controlled — this component holds no internal selection state (only its own open/closed state)." },
    { name: "onChange", type: "(value: string[]) => void", default: "—", description: "Fires with the full updated value array on every toggle (from a panel row or a chip's dismiss button)." },
    { name: "disabled", type: "boolean", default: "false", description: "Disables the trigger; the panel can't be opened." },
  ],
  example: `<MultiSelect label="Hobbies" placeholder="Select hobbies" items={hobbies} value={selected} onChange={setSelected} />`,
  doNot: [
    "Don't expect a \"N selected\" count summary in the trigger — chips render inline, inside the bordered box itself, wrapping to multiple lines as needed. This matches the Style 1 Figma reference exactly; a count summary was an earlier, now-discarded design (see the 2026-08-27 rebuild note below).",
    "Don't expect the panel to close after picking an option — MultiSelect stays open across selections (the standard multi-pick UX pattern) and only closes on outside click, Escape, or re-clicking the trigger.",
    "Don't expect a checkbox next to each panel row — Style 1's real reference has none; a row's checked-ness is only visible via aria-selected and via whether its chip is currently showing in the trigger.",
  ],
  swizzlePath: "packages/core/src/MultiSelect.tsx",
  extends: null,
  states: [
    { name: "closed, none selected", description: "Trigger shows the placeholder text.", tokens: ["trigger border"] },
    { name: "closed, some selected", description: "Trigger shows wrapped, dismissible Badge chips instead of the placeholder — no count summary.", tokens: ["trigger border"] },
    { name: "open (active)", description: "Trigger border switches to brand color; panel renders directly below (4px gap), flush and shadowless.", tokens: ["trigger border (active)", "panel background", "panel border", "panel border-radius"] },
    { name: "disabled", description: "Trigger border dims, cursor becomes not-allowed.", tokens: ["trigger border (disabled)"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space (trigger)", action: "Toggles the panel open/closed." },
      { key: "ArrowDown / ArrowUp (panel open)", action: "Moves focus to the next/previous option — a convenience, not full roving-tabindex management, same as Select." },
      { key: "Escape (panel open)", action: "Closes the panel and returns focus to the trigger." },
      { key: "Enter or Space (on an option)", action: "Toggles it in `value` — the panel stays open." },
      { key: "Enter or Space (on a chip's dismiss button)", action: "Removes that value — native <button> behavior via Badge's own onDismiss. Its click also stopPropagation()s so it doesn't also toggle the panel open/closed." },
    ],
    ariaAttributes: [
      { attribute: "role, aria-haspopup, aria-expanded (trigger)", description: 'The trigger is a <div role="button"> (not a real <button> — it contains Badge\'s own dismiss <button>s, and a <button> can\'t be a descendant of another <button>), with aria-haspopup="listbox" and aria-expanded reflecting open state.' },
      { attribute: "role, aria-multiselectable, aria-labelledby (panel)", description: 'role="listbox" aria-multiselectable="true", labelled by the same id as the trigger\'s own label.' },
    ],
    focusBehaviors: [
      "Same pattern as Select: outside-click closes the panel via a document mousedown listener.",
    ],
  },
  // Rebuilt 2026-08-27 to match "Style 1" specifically — the only foreign
  // reference the user kept on the Select page after deleting the other
  // three competing style explorations the first version of this
  // component (built the same day) had synthesized across, including the
  // "Style 4" reference that first version's trigger-summary and
  // checkbox-driven rows were actually drawn from. That first version is
  // gone in this rebuild, replaced by a fresh live pull of Style 1's own
  // "MultiSelect Input" reference, which shows a real "Selected Set"
  // instance (a row of chips) composed *inside* its own bordered box in
  // the States3/States4 variants — not a below-trigger row, not "N
  // selected" text. Rebuilt to match that exactly: chips render inline
  // via flex-wrap inside .lat-multi-select__trigger itself.
  //
  // Also removed: SelectOption's showCheckbox usage (Style 1's rows have
  // no checkbox at all — see SelectOption.doc.mjs for the full removal
  // rationale) and the "N selected" summary text entirely.
  //
  // Panel/trigger tokens are otherwise identical to Select's own rebuild
  // (see Select.doc.mjs) — same 4px trigger-to-panel gap, zero internal
  // padding, no shadow, background.default.
  //
  // Rebuilt again same day as a real, named Figma COMPONENT_SET
  // (state=closed/open) — same reasoning as Select.doc.mjs: this was only
  // ever a composed preview before, with no component identity or live
  // bindings of its own. No real reason for that shortcut; fixed to match
  // every other composite this session.
  figmaTokens: {
    "trigger padding": "spacing.8",
    "trigger border-radius": "radius.lg",
    "trigger border": "color.border.default",
    "trigger border (active)": "color.border.brand",
    "trigger border (disabled)": "color.border.subtle",
    "label color": "color.text.secondary",
    "label font-size": "font-style.body-small",
    "label font-weight": "font-weight.600",
    "placeholder color": "color.text.tertiary",
    "chip gap": "spacing.4",
    "chevron color": "color.icon.default",
    "panel gap (from trigger)": "spacing.4",
    "panel background": "color.background.default",
    "panel border": "color.border.subtle",
    "panel border-radius": "radius.lg",
  },
  // Same reasoning as Select.doc.mjs's own skip entry.
  figmaTokensSkipLiveCheck: ["label font-weight"],
};
