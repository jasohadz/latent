export default {
  name: "MultiSelect",
  summary: "A labeled multi-value dropdown: a bordered trigger showing a \"N selected\" summary + chevron, opening a floating panel of real SelectOption rows (each with a leading Checkbox). Selected values also render as a wrapped row of real, dismissible Badge chips below the trigger.",
  props: [
    { name: "label", type: "string", default: "—", description: "The field's label, above the trigger." },
    { name: "placeholder", type: "string", default: '"Select..."', description: "Shown in the trigger when nothing is selected." },
    { name: "items", type: "{ value: string; label: string }[]", default: "—", description: "The panel's options, in order." },
    { name: "value", type: "string[]", default: "—", description: "The chosen items' values. Controlled — this component holds no internal selection state (only its own open/closed state)." },
    { name: "onChange", type: "(value: string[]) => void", default: "—", description: "Fires with the full updated value array on every toggle (from a panel checkbox row or a chip's dismiss button)." },
    { name: "disabled", type: "boolean", default: "false", description: "Disables the trigger; the panel can't be opened." },
  ],
  example: `<MultiSelect label="Hobbies" placeholder="Select hobbies" items={hobbies} value={selected} onChange={setSelected} />`,
  doNot: [
    "Don't expect the trigger itself to show individual chips — it shows a \"N selected\" count summary (matching the Style 4 reference this was drawn from); the chips render in a separate row below the trigger, not inside it.",
    "Don't expect the panel to close after picking an option — unlike Select, MultiSelect stays open across selections (the standard multi-pick UX pattern) and only closes on outside click, Escape, or re-clicking the trigger.",
  ],
  swizzlePath: "packages/core/src/MultiSelect.tsx",
  extends: null,
  states: [
    { name: "closed, none selected", description: "Trigger shows the placeholder, no chip row.", tokens: ["trigger border"] },
    { name: "closed, some selected", description: "Trigger shows \"N selected\"; chip row appears below with real dismissible Badge instances.", tokens: ["trigger border"] },
    { name: "open (active)", description: "Trigger border switches to brand color; panel renders below (or below the chip row, if present).", tokens: ["trigger border (active)", "panel background", "panel border", "panel border-radius", "panel shadow"] },
    { name: "disabled", description: "Trigger border dims, cursor becomes not-allowed.", tokens: ["trigger border (disabled)"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space (trigger)", action: "Toggles the panel open/closed." },
      { key: "ArrowDown / ArrowUp (panel open)", action: "Moves focus to the next/previous option — a convenience, not full roving-tabindex management, same as Select." },
      { key: "Escape (panel open)", action: "Closes the panel and returns focus to the trigger." },
      { key: "Enter or Space (on an option)", action: "Toggles it in `value` — the panel stays open." },
      { key: "Enter or Space (on a chip's dismiss button)", action: "Removes that value — native <button> behavior via Badge's own onDismiss." },
    ],
    ariaAttributes: [
      { attribute: "aria-haspopup, aria-expanded (trigger)", description: 'aria-haspopup="listbox" always; aria-expanded reflects open state.' },
      { attribute: "role, aria-multiselectable, aria-labelledby (panel)", description: 'role="listbox" aria-multiselectable="true", labelled by the same id as the trigger\'s own label.' },
    ],
    focusBehaviors: [
      "Same new pattern as Select: outside-click closes the panel via a document mousedown listener, not reused from any existing component before Select/MultiSelect.",
    ],
  },
  // Built 2026-08-27, same synthesis pass as Select (see Select.doc.mjs for
  // the full foreign-reference context — 4 competing style explorations on
  // the Select page, none bound to Latent tokens). MultiSelect specifically
  // draws its trigger-summary behavior ("N selected" text, not inline
  // chips) from "Style 4"'s own MultiSelect Input reference, and its
  // separate below-trigger chip row from "Style 1"'s own "Selected Set"
  // reference — two different foreign approaches, deliberately combined
  // rather than picking one exclusively. The chip row itself reuses a real
  // Badge instance (variant="brand", onDismiss) instead of rebuilding the
  // reference's own bespoke "Selected Item" pill — Badge's brand variant
  // (blue background, dismiss x) already matches that reference's chip
  // look closely enough that a second, near-duplicate chip component
  // wasn't justified. Trigger/panel tokens are identical to Select's own
  // (same TextField-border/TopNav-panel reuse) — verified together in the
  // same Figma composed-preview session; "Select"/"no-live-data" caveat in
  // Select.doc.mjs applies here too.
  figmaTokens: {
    "trigger padding": "spacing.8",
    "trigger border-radius": "radius.lg",
    "trigger border": "color.border.default",
    "trigger border (active)": "color.border.brand",
    "trigger border (disabled)": "color.border.subtle",
    "label color": "color.text.secondary",
    "label font-size": "font-style.body-small",
    "label font-weight": "font-weight.600",
    "value color": "color.text.primary",
    "placeholder color": "color.text.tertiary",
    "chevron color": "color.icon.default",
    "chip row gap": "spacing.4",
    "panel gap": "spacing.4",
    "panel padding": "spacing.8",
    "panel background": "color.surface.raised",
    "panel border": "color.border.subtle",
    "panel border-radius": "radius.card",
    "panel shadow": "elevation.md",
  },
  figmaTokensSkipLiveCheck: ["panel shadow"],
};
