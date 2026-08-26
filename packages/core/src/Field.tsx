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
  ({ label, helperText, error, id, className, ...rest }, ref) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    return (
      <div className={["lat-field", className].filter(Boolean).join(" ")}>
        <label className="lat-field__label" htmlFor={fieldId}>{label}</label>
        <TextField ref={ref} id={fieldId} error={error} {...rest} />
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
