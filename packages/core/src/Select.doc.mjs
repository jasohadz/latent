export default {
  name: "Select",
  summary: "A labeled single-value dropdown: a bordered trigger showing the chosen value (or a placeholder) + chevron, opening a floating panel of real SelectOption rows. Closes on selection, outside click, or Escape.",
  props: [
    { name: "label", type: "string", default: "—", description: "The field's label, above the trigger." },
    { name: "placeholder", type: "string", default: '"Select..."', description: "Shown in the trigger when no value is chosen." },
    { name: "items", type: "{ value: string; label: string }[]", default: "—", description: "The panel's options, in order." },
    { name: "value", type: "string", default: "undefined", description: "The chosen item's value. Controlled — this component holds no internal selection state (only its own open/closed state)." },
    { name: "onChange", type: "(value: string) => void", default: "—", description: "Fires with the clicked/activated item's value, then the panel closes." },
    { name: "disabled", type: "boolean", default: "false", description: "Disables the trigger; the panel can't be opened." },
  ],
  example: `<Select label="Hobby" placeholder="Select hobby" items={hobbies} value={hobby} onChange={setHobby} />`,
  doNot: [
    "Don't expect selected values to render as chips in the trigger — that's MultiSelect's own pattern (multiple values), not this one (exactly one). Select shows the chosen item's label as plain text.",
    "Don't expect a full ARIA combobox/roving-tabindex listbox — options are individually Tab-reachable (with Arrow/Escape as keyboard conveniences), the same honest simplification NavDropdown's sub-list already documents. See SelectOption.doc.mjs.",
    "Don't expect the panel to have a drop shadow — the Style 1 reference this was rebuilt from has none, just a 1px border; adding one would be a real (if small) fidelity regression.",
  ],
  swizzlePath: "packages/core/src/Select.tsx",
  extends: null,
  states: [
    { name: "closed", description: "Trigger shows the selected label or the placeholder, default border.", tokens: ["trigger border"] },
    { name: "open (active)", description: "Trigger border switches to brand color; panel renders directly below it (4px gap), flush against the trigger's own width — square-cornered rows, clipped by the panel's own border-radius via overflow: hidden.", tokens: ["trigger border (active)", "panel background", "panel border", "panel border-radius"] },
    { name: "disabled", description: "Trigger border dims, cursor becomes not-allowed.", tokens: ["trigger border (disabled)"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space (trigger)", action: "Toggles the panel open/closed." },
      { key: "ArrowDown / ArrowUp (panel open)", action: "Moves focus to the next/previous option — the same convenience NavDropdown's sub-list already provides, not full roving-tabindex management." },
      { key: "Escape (panel open)", action: "Closes the panel and returns focus to the trigger." },
      { key: "Enter or Space (on an option)", action: "Selects it, closes the panel, returns focus to the trigger." },
    ],
    ariaAttributes: [
      { attribute: "aria-haspopup, aria-expanded (trigger)", description: 'aria-haspopup="listbox" always; aria-expanded reflects open state.' },
      { attribute: "role, aria-labelledby (panel)", description: 'role="listbox", labelled by the same id as the trigger\'s own label.' },
    ],
    focusBehaviors: [
      "A new pattern in this codebase, not reused from an existing component: outside-click closes the panel (via a document mousedown listener checking containment), since a select left open after clicking elsewhere is a real usability bug in a way TopNav's/NavDropdown's own persistent-until-toggled menus tolerate.",
    ],
  },
  // Rebuilt 2026-08-27 to match "Style 1" specifically — the only foreign
  // reference the user kept on the Select page after deleting the other
  // three competing style explorations the first version of this
  // component (built the same day) had synthesized across. Real
  // differences from that first pass, confirmed via a fresh live pull of
  // Style 1's own "MultiSelect Input" and "Dropdown" references: panel
  // sits only 4px below the trigger (spacing.4, not spacing.8), has zero
  // internal padding/gap (rows go edge-to-edge, clipped to the panel's own
  // rounded corners via overflow: hidden, not individually rounded), no
  // drop shadow at all (Style 1's reference genuinely has none — the
  // first pass borrowed TopNav's elevation.md, which doesn't apply here),
  // and background.default (near-white) rather than surface.raised
  // (though those may resolve to the same value in this theme, the
  // reference's real binding is background.default). The trigger itself
  // is unchanged — still reuses TextField's own border/radius/padding
  // tokens exactly, confirmed correct in both passes.
  //
  // Verified together as one composed preview in Figma (label + trigger +
  // panel of real SelectOption instances), not built as its own named
  // Figma COMPONENT_SET — check-component-bindings has no live data for
  // "Select" itself as a result (reports "no-live-data", non-blocking,
  // same as any component before its first plugin sync); every token
  // below was independently confirmed live via the composed preview's own
  // figma_execute dump, the same rigor as a named component would get.
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
    "panel gap (from trigger)": "spacing.4",
    "panel background": "color.background.default",
    "panel border": "color.border.subtle",
    "panel border-radius": "radius.lg",
  },
};
