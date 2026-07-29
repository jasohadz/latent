import React from "react";
import { TextField, type TextFieldProps } from "./TextField";
import { Icon } from "./Icon";
import "./Field.css";

export interface FieldProps extends TextFieldProps {
  label: string;
  /** Shown below the input. Rendered with a leading alert icon and danger color when `error` is true. */
  helperText?: string;
}

/**
 * Field — a labeled form-field wrapper around a real TextField instance.
 * No value axis of its own — the nested TextField carries its own value/
 * state. Styling comes entirely from --lat-* custom properties.
 */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, helperText, error, className, ...rest }, ref) => {
    return (
      <div className={["lat-field", className].filter(Boolean).join(" ")}>
        <label className="lat-field__label">{label}</label>
        <TextField ref={ref} error={error} {...rest} />
        {helperText ? (
          <span className={["lat-field__helper", error ? "lat-field__helper--error" : ""].filter(Boolean).join(" ")}>
            {error ? <Icon name="circle-alert" size="xs" className="lat-field__helper-icon" /> : null}
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Field.displayName = "Field";
