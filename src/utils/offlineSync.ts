const getStorageKey = (roomId: string) => `offlineMessages_${roomId || 'global'}`;

export const getOfflineMessages = (roomId: string) => {
  try {
    const raw = (typeof window !== "undefined" ? localStorage.getItem.bind(localStorage) : () => null)(getStorageKey(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read offline messages:', error);
    return [];
  }
};

export const saveOfflineMessages = (roomId: string, messages: any[]) => {
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save offline messages:', error);
  }
};

export const queueOfflineMessage = (roomId: string, message: any) => {
  const currentMessages = getOfflineMessages(roomId);
  currentMessages.push(message);
  saveOfflineMessages(roomId, currentMessages);
};

export const clearOfflineMessages = (roomId: string) => {
  try {
    localStorage.removeItem(getStorageKey(roomId));
  } catch (error) {
    console.error('Failed to clear offline messages:', error);
  }
};
