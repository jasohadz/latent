import React from "react";
import { Icon } from "./Icon";
import { SelectOption } from "./SelectOption";
import "./ComboBox.css";

export interface ComboBoxItem {
  value: string;
  label: string;
}

export interface ComboBoxProps {
  label: string;
  placeholder?: string;
  items: ComboBoxItem[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ComboBox — an editable, searchable dropdown: Select's labeled trigger
 * with a leading search icon and a text input, filtering a floating panel
 * of real SelectOption rows as you type. Focus stays in the input; the
 * arrow keys move a highlighted row (aria-activedescendant), Enter picks it.
 *
 * @import import { ComboBox } from "@latent/core/ComboBox";
 */
export const ComboBox = React.forwardRef<HTMLInputElement, ComboBoxProps>(
  ({ label, placeholder = "Search...", items, value, onChange, disabled = false, className }, ref) => {
    const selectedItem = items.find((i) => i.value === value);
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState(selectedItem?.label ?? "");
    const [activeIndex, setActiveIndex] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const labelId = React.useId();
    const listId = React.useId();
    const optionId = (i: number) => `${listId}-option-${i}`;

    // While closed, the input mirrors the chosen item (or stays empty for
    // the placeholder) — so a controlled value change from outside shows up.
    React.useEffect(() => {
      if (!open) setQuery(selectedItem?.label ?? "");
    }, [open, selectedItem?.label]);

    // Typing the chosen label back in shouldn't filter the list down to it,
    // so the full list shows until the text actually differs.
    const filtering = query !== (selectedItem?.label ?? "");
    const needle = query.trim().toLowerCase();
    const matches = filtering && needle ? items.filter((i) => i.label.toLowerCase().includes(needle)) : items;

    React.useEffect(() => {
      if (!open) return;
      function handlePointerDown(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open]);

    function choose(item: ComboBoxItem) {
      onChange(item.value);
      setQuery(item.label);
      setOpen(false);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(0);
          return;
        }
        if (matches.length === 0) return;
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((i) => (i + step + matches.length) % matches.length);
      } else if (e.key === "Enter" && open && matches[activeIndex]) {
        e.preventDefault();
        choose(matches[activeIndex]);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }

    const showPanel = open && matches.length > 0;

    return (
      <div ref={containerRef} className={["lat-combo-box", className].filter(Boolean).join(" ")}>
        <label className="lat-combo-box__label" id={labelId}>
          {label}
        </label>
        <div
          className={[
            "lat-combo-box__trigger",
            open ? "lat-combo-box__trigger--active" : "",
            disabled ? "lat-combo-box__trigger--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon name="search" size="xs" className="lat-combo-box__search-icon" aria-hidden />
          <input
            ref={ref}
            className="lat-combo-box__input"
            type="text"
            role="combobox"
            aria-labelledby={labelId}
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && matches[activeIndex] ? optionId(activeIndex) : undefined}
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <Icon name="chevron-down" size="sm" className="lat-combo-box__chevron" aria-hidden />
        </div>
        {showPanel ? (
          <div className="lat-combo-box__panel" role="listbox" id={listId} aria-labelledby={labelId}>
            {matches.map((item, i) => (
              <SelectOption
                key={item.value}
                id={optionId(i)}
                label={item.label}
                selected={item.value === value}
                // Options aren't focus stops: focus stays in the input, and
                // aria-activedescendant points at the highlighted row.
                tabIndex={-1}
                className={i === activeIndex ? "lat-combo-box__option--active" : undefined}
                // mousedown would blur the input before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(item)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

ComboBox.displayName = "ComboBox";
