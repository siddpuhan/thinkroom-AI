// @ts-nocheck
import { create } from 'zustand';
import { Message } from '../types/models';

export const useChatStore = create((set) => ({
  streamingMessages: {},
  socket: null,
  roomId: '',
  
  setSocket: (socket: any) => set({ socket }),
  setRoomId: (roomId: any) => set({ roomId }),
  
  addStreamStart: (data: any) => set((state: any) => ({
    streamingMessages: {
      ...state.streamingMessages,
      [data.messageId]: { 
        id: data.messageId, 
        text: "", 
        sender: data.sender, 
        personaId: data.personaId, 
        color: data.color,
        isStreaming: true
      }
    }
  })),

  appendStreamChunk: (messageId, chunk) => set((state: any) => {
    const msg = state.streamingMessages[messageId];
    if (!msg) return state;
    return {
      streamingMessages: {
        ...state.streamingMessages,
        [messageId]: { ...msg, text: msg.text + chunk }
      }
    };
  }),

  finalizeStream: (data: any) => set((state: any) => {
    const { [data.messageId]: _removed, ...rest } = state.streamingMessages;
    return {
      streamingMessages: rest
    };
  })
}));
