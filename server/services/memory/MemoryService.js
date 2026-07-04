// MemoryService.js — Orchestrator for Room Memory Engine

import { MemoryCache } from './MemoryCache.js';
import { MemoryBuilder } from './MemoryBuilder.js';

export class MemoryService {
  /**
   * Get the current memory context for a room.
   * Uses cache if available, otherwise triggers a rebuild.
   */
  static async getContext(roomId) {
    let cached = MemoryCache.get(roomId);
    if (!cached) {
      console.log(`[MEMORY SERVICE] ⚠️ Cache miss for room ${roomId}. Rebuilding now...`);
      cached = await MemoryBuilder.rebuildMemory(roomId);
    } else {
      console.log(`[MEMORY SERVICE] ⚡ Cache hit for room ${roomId} (${cached.tokenCount} chars)`);
    }
    return cached.contextString;
  }

  /**
   * Get full debug info for the UI.
   */
  static async getDebugInfo(roomId) {
    const cached = MemoryCache.get(roomId) || await MemoryBuilder.rebuildMemory(roomId);
    return {
      contextString: cached.contextString,
      tokenCount: cached.tokenCount,
      updatedAt: cached.updatedAt || Date.now()
    };
  }

  /**
   * Trigger an asynchronous rebuild (e.g. after a socket event).
   * Does not block the caller.
   */
  static triggerBackgroundRebuild(roomId) {
    // Invalidate immediately so next getContext blocks and builds if requested before this finishes
    MemoryCache.invalidate(roomId);
    
    // Fire and forget
    MemoryBuilder.rebuildMemory(roomId).catch(err => {
      console.error(`[MEMORY SERVICE] Background rebuild failed for room ${roomId}:`, err);
    });
  }
}
