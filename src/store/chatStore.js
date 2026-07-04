import { create } from 'zustand';

export const useChatStore = create((set) => ({
  streamingMessages: {},
  socket: null,
  roomId: '',
  
  setSocket: (socket) => set({ socket }),
  setRoomId: (roomId) => set({ roomId }),
  
  addStreamStart: (data) => set((state) => ({
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

  appendStreamChunk: (messageId, chunk) => set((state) => {
    const msg = state.streamingMessages[messageId];
    if (!msg) return state;
    return {
      streamingMessages: {
        ...state.streamingMessages,
        [messageId]: { ...msg, text: msg.text + chunk }
      }
    };
  }),

  finalizeStream: (data) => set((state) => {
    const { [data.messageId]: _removed, ...rest } = state.streamingMessages;
    return {
      streamingMessages: rest
    };
  })
}));
