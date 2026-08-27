import React from "react";
import { Icon } from "./Icon";
import { SelectOption } from "./SelectOption";
import "./Select.css";

export interface SelectItem {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  placeholder?: string;
  items: SelectItem[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Select — a labeled single-value dropdown: a bordered trigger showing the
 * chosen value (or a placeholder) + chevron, opening a floating panel of
 * real SelectOption rows. Closes on selection, outside click, or Escape.
 */
export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
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

    const selectedItem = items.find((i) => i.value === value);

    return (
      <div ref={containerRef} className={["lat-select", className].filter(Boolean).join(" ")} onKeyDown={handleKeyDown}>
        <label className="lat-select__label" id={labelId}>
          {label}
        </label>
        <button
          ref={(el) => {
            triggerRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          type="button"
          className={["lat-select__trigger", open ? "lat-select__trigger--active" : ""].filter(Boolean).join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={["lat-select__value", selectedItem ? "" : "lat-select__value--placeholder"].filter(Boolean).join(" ")}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <Icon name="chevron-down" size="sm" className="lat-select__chevron" />
        </button>
        {open ? (
          <div className="lat-select__panel" role="listbox" aria-labelledby={labelId}>
            {items.map((item, i) => (
              <SelectOption
                key={item.value}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                label={item.label}
                selected={item.value === value}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
