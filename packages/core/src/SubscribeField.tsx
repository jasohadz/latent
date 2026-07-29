import React from "react";
import { TextField } from "./TextField";
import { Button } from "./Button";
import "./SubscribeField.css";

export type SubscribeFieldButtonPosition = "side" | "bottom";

export interface SubscribeFieldProps {
  buttonPosition?: SubscribeFieldButtonPosition;
  placeholder?: string;
  buttonLabel?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
}

/**
 * SubscribeField — an email-capture row pairing a real TextField instance
 * with a real Button instance, plus a terms disclaimer below. Styling
 * comes entirely from --lat-* custom properties.
 */
export const SubscribeField = React.forwardRef<HTMLInputElement, SubscribeFieldProps>(
  (
    {
      buttonPosition = "side",
      placeholder = "Enter text",
      buttonLabel = "Subscribe",
      value,
      onChange,
      onSubmit,
      className,
    },
    ref
  ) => {
    return (
      <div className={["lat-subscribe-field", className].filter(Boolean).join(" ")}>
        <div className={`lat-subscribe-field__row lat-subscribe-field__row--${buttonPosition}`}>
          <TextField
            ref={ref}
            appearance="filled"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <Button variant="primary" onClick={onSubmit}>
            {buttonLabel}
          </Button>
        </div>
        <p className="lat-subscribe-field__disclaimer">
          By clicking, you&rsquo;re agreeing to our Terms.
        </p>
      </div>
    );
  }
);

SubscribeField.displayName = "SubscribeField";
