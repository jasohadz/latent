export default {
  name: "Checkbox",
  summary: "A standalone boolean control — an atom, not select-specific, though it's what SelectOption composes for MultiSelect's multi-choice rows.",
  props: [
    { name: "checked", type: "boolean", default: "—", description: "Controlled — this component holds no internal state." },
    { name: "onChange", type: "(checked: boolean) => void", default: "—", description: "Fires with the new value on click." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "16/20/24px, reusing Icon's own sizing.icon.sm/md/lg tokens rather than inventing a separate size scale." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
  ],
  example: `<Checkbox checked={agreed} onChange={setAgreed} />`,
  doNot: [
    "Don't expect a native <input type=\"checkbox\"> under the hood — this follows Switch's existing role=\"checkbox\"-on-a-real-<button> convention instead, for consistency with the rest of this codebase.",
  ],
  swizzlePath: "packages/core/src/Checkbox.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  states: [
    { name: "unchecked", description: "Transparent background, bordered box.", tokens: ["box border color", "box border width", "box border-radius"] },
    { name: "checked", description: "Filled blue box with a white checkmark icon — same color.action.primary.default as Switch's own \"on\" track.", tokens: ["checked background", "checkmark color"] },
    { name: "focus-visible", description: "Outline ring, keyboard-only.", tokens: ["focus ring color", "focus ring width"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Toggles checked — native <button> behavior, no custom handler." },
    ],
    ariaAttributes: [
      { attribute: "role, aria-checked", description: 'role="checkbox" with aria-checked reflecting the controlled `checked` prop.' },
    ],
    focusBehaviors: [
      "Real :focus-visible outline, bound to color.border.focus.",
    ],
  },
  // Built 2026-08-27 in Figma from the "◈ Checkbox - Dark Mode" foreign
  // reference on the Select page (context-only, unbound, same treatment as
  // every other foreign reference this session) — a genuine reusable
  // system component in that file (3 sizes, checked/unchecked), not
  // Select-specific, which is why it's built here as its own standalone
  // atom rather than inlined into SelectOption. Simplified from the
  // reference's own 16/24/32 (with a redundant 2px padding frame around
  // each box) to Icon's existing sizing.icon.sm/md/lg (16/20/24) — reusing
  // an established token scale instead of inventing a new one. Only the
  // md (20px) size was built as a live Figma variant; sm/lg are a code-only
  // extension using the same already-verified token family, not
  // independently checked.
  figmaTokens: {
    "box border-radius": "radius.sm",
    "box border color": "color.border.default",
    "box border width": "sizing.border.default",
    "checked background": "color.action.primary.default",
    "checkmark color": "color.text.on-brand",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.default",
  },
  // Focus ring is a deliberate code-only addition — the foreign reference
  // had no accessibility treatment at all, same reasoning as every other
  // component's focus-ring skip entry this session.
  figmaTokensSkipLiveCheck: ["focus ring color", "focus ring width"],
};
