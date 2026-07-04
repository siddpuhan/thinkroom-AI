// ConversationBuffer.js — In-memory sliding window of recent messages per room.
// The Shadow AI observes this buffer for decision signals.
// Debounced: only analyzes after a cooldown period following the latest message.

const WINDOW_SIZE = 20;                // Max messages to keep per room
const ANALYSIS_COOLDOWN_MS = 8_000;    // Wait 8 seconds of quiet before analyzing
const DEDUP_COOLDOWN_MS = 20_000;      // Allow re-analysis every 20 seconds

class ConversationBufferClass {
  constructor() {
    // Map<roomId, { messages: Array, lastAnalyzedAt: number, analysisTimer: NodeJS.Timeout | null }>
    this.rooms = new Map();
  }

  /**
   * Push a new message into the room's buffer.
   * Returns the room state for inspection.
   */
  push(roomId, message) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        messages: [],
        lastAnalyzedAt: 0,
        analysisTimer: null,
      });
    }

    const room = this.rooms.get(roomId);

    room.messages.push({
      text: message.text || message.content || '',
      sender_name: message.sender_name || 'Unknown',
      sender_id: message.sender_id || null,
      timestamp: Date.now(),
    });

    // Trim to window size
    if (room.messages.length > WINDOW_SIZE) {
      room.messages = room.messages.slice(-WINDOW_SIZE);
    }

    return room;
  }

  /**
   * Get the current message window for a room.
   */
  getWindow(roomId) {
    const room = this.rooms.get(roomId);
    return room ? [...room.messages] : [];
  }

  /**
   * Schedule a debounced analysis callback.
   * The callback only fires if no new messages arrive within ANALYSIS_COOLDOWN_MS.
   * Also respects DEDUP_COOLDOWN_MS — won't fire too frequently.
   */
  scheduleAnalysis(roomId, callback) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clear any pending timer
    if (room.analysisTimer) {
      clearTimeout(room.analysisTimer);
    }

    // Check dedup cooldown
    const timeSinceLastAnalysis = Date.now() - room.lastAnalyzedAt;
    if (timeSinceLastAnalysis < DEDUP_COOLDOWN_MS) {
      console.log(`[CONV BUFFER] ⏳ Room ${roomId}: Skipping — last analysis ${Math.round(timeSinceLastAnalysis / 1000)}s ago (cooldown: ${DEDUP_COOLDOWN_MS / 1000}s)`);
      return;
    }

    // Schedule the analysis after cooldown
    room.analysisTimer = setTimeout(() => {
      room.lastAnalyzedAt = Date.now();
      room.analysisTimer = null;
      console.log(`[CONV BUFFER] 🔔 Room ${roomId}: Cooldown elapsed — triggering analysis`);
      callback(roomId, [...room.messages]);
    }, ANALYSIS_COOLDOWN_MS);
  }

  /**
   * Immediately trigger analysis and bypass the debounce timer.
   */
  triggerImmediate(roomId, callback) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.analysisTimer) {
      clearTimeout(room.analysisTimer);
      room.analysisTimer = null;
    }

    // Still respect dedup cooldown so we don't spam Groq on every keystroke during an agreement
    const timeSinceLastAnalysis = Date.now() - room.lastAnalyzedAt;
    if (timeSinceLastAnalysis < DEDUP_COOLDOWN_MS) {
      console.log(`[CONV BUFFER] ⏳ Room ${roomId}: Skipping immediate trigger — cooldown active`);
      return;
    }

    room.lastAnalyzedAt = Date.now();
    console.log(`[CONV BUFFER] ⚡ Room ${roomId}: Immediate analysis triggered!`);
    callback(roomId, [...room.messages]);
  }

  /**
   * Clean up a room (e.g. when all clients leave).
   */
  clearRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room?.analysisTimer) {
      clearTimeout(room.analysisTimer);
    }
    this.rooms.delete(roomId);
  }
}

// Singleton
export const ConversationBuffer = new ConversationBufferClass();
