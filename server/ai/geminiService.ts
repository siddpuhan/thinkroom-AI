import { googleAI, withRetry } from "../utils/geminiClient.js";
import { getDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { MemoryService } from "../services/memory/MemoryService.js";

export async function processPersonaStream(roomId, messageId, cleanPrompt, persona, io) {
  const pool = getDB();
  
  try {
    if (!googleAI) {
      throw new Error("Gemini API client is not configured.");
    }

    // 1. Fetch Room History (last 15 messages)
    const historyResult = await pool.query(
      `SELECT sender_name, text FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 15`, 
      [roomId]
    );
    
    const chatHistory = historyResult.rows.reverse().map(m => `${m.sender_name}: ${m.text}`).join('\n');

    // 1b. Fetch Room Memory Engine Context
    const memoryContext = await MemoryService.getContext(roomId);

    // 3. Inform Frontend that streaming is starting
    io.to(roomId).emit("ai_stream_start", {
      messageId, 
      sender: persona.displayName,
      personaId: persona.id,
      color: persona.color
    });

    const model = googleAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 4. Initialize Stream with retry mechanism
    const resultStream = await withRetry(() => model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: `${persona.role}\n\n${memoryContext}\n\nRecent Conversation History:\n${chatHistory}\n\nUser input: ${cleanPrompt}` }]
        }
      ]
    }));

    let fullResponse = "";

    // 5. Stream chunks over Socket.IO
    for await (const chunk of resultStream.stream) {
      const content = chunk.text() || "";
      fullResponse += content;
      
      io.to(roomId).emit("ai_stream_chunk", {
        messageId,
        chunk: content
      });
    }

    // 6. Finalize: Save to DB & emit completion
    const insertResult = await pool.query(`
      INSERT INTO messages (text, sender_name, room_id) 
      VALUES ($1, $2, $3) RETURNING id, created_at
    `, [fullResponse, persona.displayName, roomId]);

    io.to(roomId).emit("ai_stream_end", {
      messageId,
      finalDbId: insertResult.rows[0].id,
      text: fullResponse,
      created_at: insertResult.rows[0].created_at
    });
  } catch (error: any) {
    logger.error("GEMINI-SERVICE", `AI Stream Error: ${error.message}`, error);
    io.to(roomId).emit("ai_stream_end", {
      messageId,
      finalDbId: `error-${messageId}`,
      text: "⚠️ AI temporarily unavailable",
      created_at: new Date().toISOString(),
      status: 'failed'
    });
  }
}
