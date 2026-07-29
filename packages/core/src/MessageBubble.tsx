import React from "react";
import "./MessageBubble.css";

export type MessageBubbleSender = "user" | "assistant";

export interface MessageBubbleProps {
  sender: MessageBubbleSender;
  children: React.ReactNode;
  className?: string;
}

/**
 * MessageBubble — a single chat message. Meant to populate ChatWindow's
 * message slot (one or more instances stacked per conversation). Styling
 * comes entirely from --lat-* custom properties.
 */
export const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ sender, children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={["lat-message-bubble-row", `lat-message-bubble-row--${sender}`, className]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={`lat-message-bubble lat-message-bubble--${sender}`}>{children}</div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";
