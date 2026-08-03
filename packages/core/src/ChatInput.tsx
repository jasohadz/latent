import React from "react";
import { Icon } from "./Icon";
import "./ChatInput.css";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onAttach?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * ChatInput — a message composer bar for AI chat interfaces. Used as the
 * input row inside ChatWindow. Styling comes entirely from --lat-*
 * custom properties.
 */
export const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, onAttach, placeholder = "Message Latent...", className }, ref) => {
    return (
      <div className={["lat-chat-input", className].filter(Boolean).join(" ")}>
        <button type="button" className="lat-chat-input__attach" aria-label="Attach" onClick={onAttach}>
          <Icon name="plus" size="md" />
        </button>
        <input
          ref={ref}
          type="text"
          className="lat-chat-input__field"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
        />
        <button
          type="button"
          className={["lat-chat-input__send", value.trim() ? "lat-chat-input__send--active" : ""]
            .filter(Boolean)
            .join(" ")}
          aria-label="Send message"
          onClick={onSubmit}
        >
          <Icon name="arrow-up" size="md" />
        </button>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
