// MemoryCache.js — In-memory singleton cache for Room Memory

class MemoryCacheClass {
  constructor() {
    // Map<roomId, { contextString: string, tokenCount: number, updatedAt: number }>
    this.cache = new Map();
  }

  get(roomId) {
    return this.cache.get(roomId) || null;
  }

  set(roomId, contextString, tokenCount) {
    this.cache.set(roomId, {
      contextString,
      tokenCount,
      updatedAt: Date.now()
    });
    console.log(`[MEMORY CACHE] ✅ Set memory for room ${roomId} (${tokenCount} chars)`);
  }

  invalidate(roomId) {
    if (this.cache.has(roomId)) {
      this.cache.delete(roomId);
      console.log(`[MEMORY CACHE] 🗑️ Invalidated memory for room ${roomId}`);
    }
  }

  clearAll() {
    this.cache.clear();
  }
}

export const MemoryCache = new MemoryCacheClass();
