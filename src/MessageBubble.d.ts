import type { ComponentType } from "react";

declare const MessageBubble: ComponentType<{
  message: any;
  isOwnMessage: boolean;
}>;

export default MessageBubble;
