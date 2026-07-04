import type { Socket } from "socket.io-client";

export interface StreamingMessage {
  id: string;
  text: string;
  sender?: string;
  personaId?: string;
  color?: string;
  isStreaming?: boolean;
}

export interface ChatStoreState {
  streamingMessages: Record<string, StreamingMessage>;
  socket: Socket | null;
  roomId: string;
  setSocket: (_socket: Socket | null) => void;
  setRoomId: (_roomId: string) => void;
  addStreamStart: (_data: {
    messageId: string;
    sender?: string;
    personaId?: string;
    color?: string;
  }) => void;
  appendStreamChunk: (_messageId: string, _chunk: string) => void;
  finalizeStream: (_data: { messageId: string }) => void;
}

export function useChatStore(): ChatStoreState;
export function useChatStore<T>(_selector: (_state: ChatStoreState) => T): T;
