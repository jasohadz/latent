import React from "react";
import { ChatInput, type ChatInputProps } from "./ChatInput";
import "./ChatWindow.css";

export interface ChatWindowProps {
  /** Real MessageBubble instances, stacked per conversation. */
  children?: React.ReactNode;
  inputProps: ChatInputProps;
  className?: string;
}

/**
 * ChatWindow — a full AI chat panel. Single component, no variants. A
 * message slot stacked above a real ChatInput instance docked at the
 * bottom. Styling comes entirely from --lat-* custom properties.
 */
export const ChatWindow = React.forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ children, inputProps, className }, ref) => {
    return (
      <div ref={ref} className={["lat-chat-window", className].filter(Boolean).join(" ")}>
        <div className="lat-chat-window__slot">{children}</div>
        <ChatInput {...inputProps} />
      </div>
    );
  }
);

ChatWindow.displayName = "ChatWindow";
