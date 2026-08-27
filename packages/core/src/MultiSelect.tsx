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
 * MultiSelect — a labeled multi-value dropdown. Selected values render as
 * real, dismissible Badge chips wrapping *inside* the bordered trigger
 * itself (not below it, not a "N selected" summary) — matching the Style 1
 * Figma reference exactly. Stays open across selections (typical
 * multi-select UX); closes on outside click or Escape.
 */
export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ label, placeholder = "Select...", items, value, onChange, disabled = false, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLDivElement>(null);
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

    return (
      <div ref={containerRef} className={["lat-multi-select", className].filter(Boolean).join(" ")} onKeyDown={handleKeyDown}>
        <label className="lat-multi-select__label" id={labelId}>
          {label}
        </label>
        {/* A <div role="button">, not a real <button> — it needs to contain
            Badge's own dismiss <button>s, and a <button> can't be a
            descendant of another <button> (invalid HTML). Same class of
            fix as SelectOption's own <div role="option">. */}
        <div
          ref={(el) => {
            triggerRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-disabled={disabled}
          className={[
            "lat-multi-select__trigger",
            open ? "lat-multi-select__trigger--active" : "",
            disabled ? "lat-multi-select__trigger--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => {
            if (!disabled) setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
        >
          {selectedItems.length === 0 ? (
            <span className="lat-multi-select__placeholder">{placeholder}</span>
          ) : (
            // stopPropagation so clicking a chip (its label or its dismiss
            // button) never also toggles the trigger's own open state.
            <div className="lat-multi-select__chips" onClick={(e) => e.stopPropagation()}>
              {selectedItems.map((item) => (
                <Badge key={item.value} variant="brand" size="small" onDismiss={() => toggle(item.value)}>
                  {item.label}
                </Badge>
              ))}
            </div>
          )}
          <Icon name="chevron-down" size="sm" className="lat-multi-select__chevron" />
        </div>
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
