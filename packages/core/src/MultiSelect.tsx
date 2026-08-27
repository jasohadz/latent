import React from "react";
import { Icon } from "./Icon";
import { Badge } from "./Badge";
import { SelectOption } from "./SelectOption";
import "./MultiSelect.css";

export interface MultiSelectItem {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label: string;
  placeholder?: string;
  items: MultiSelectItem[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * MultiSelect — a labeled multi-value dropdown: a bordered trigger showing
 * a "N selected" summary + chevron, opening a floating panel of real
 * SelectOption rows (each with a leading Checkbox). Selected values also
 * render as a wrapped row of real, dismissible Badge chips below the
 * trigger — reusing Badge rather than a bespoke chip component. Stays open
 * across selections (typical multi-select UX); closes on outside click or
 * Escape.
 */
export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ label, placeholder = "Select...", items, value, onChange, disabled = false, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const optionRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const labelId = React.useId();

    React.useEffect(() => {
      if (!open) return;
      function handlePointerDown(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (!open || items.length === 0) return;
      const count = items.length;
      const current = optionRefs.current.findIndex((el) => el === document.activeElement);
      let next: number;
      if (e.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % count;
      else if (e.key === "ArrowUp") next = current < 0 ? count - 1 : (current - 1 + count) % count;
      else return;
      e.preventDefault();
      optionRefs.current[next]?.focus();
    }

    function toggle(itemValue: string) {
      if (value.includes(itemValue)) onChange(value.filter((v) => v !== itemValue));
      else onChange([...value, itemValue]);
    }

    const selectedItems = items.filter((i) => value.includes(i.value));
    const summary = selectedItems.length === 0 ? placeholder : `${selectedItems.length} selected`;

    return (
      <div ref={containerRef} className={["lat-multi-select", className].filter(Boolean).join(" ")} onKeyDown={handleKeyDown}>
        <label className="lat-multi-select__label" id={labelId}>
          {label}
        </label>
        <button
          ref={(el) => {
            triggerRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          type="button"
          className={["lat-multi-select__trigger", open ? "lat-multi-select__trigger--active" : ""].filter(Boolean).join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        >
          <span
            className={["lat-multi-select__value", selectedItems.length === 0 ? "lat-multi-select__value--placeholder" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {summary}
          </span>
          <Icon name="chevron-down" size="sm" className="lat-multi-select__chevron" />
        </button>
        {selectedItems.length > 0 ? (
          <div className="lat-multi-select__chips">
            {selectedItems.map((item) => (
              <Badge key={item.value} variant="brand" size="small" onDismiss={() => toggle(item.value)}>
                {item.label}
              </Badge>
            ))}
          </div>
        ) : null}
        {open ? (
          <div className="lat-multi-select__panel" role="listbox" aria-multiselectable="true" aria-labelledby={labelId}>
            {items.map((item, i) => (
              <SelectOption
                key={item.value}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                label={item.label}
                selected={value.includes(item.value)}
                showCheckbox
                onClick={() => toggle(item.value)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
