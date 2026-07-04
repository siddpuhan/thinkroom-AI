import { groq, withRetry } from "../utils/groqClient.js";
import { getDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import dotenv from "dotenv";
import { MemoryService } from "../services/memory/MemoryService.js";

dotenv.config();

export async function processPersonaStream(roomId, messageId, cleanPrompt, persona, io) {
  const pool = getDB();
  
  try {
    // 1. Fetch Room History (last 15 messages)
    const historyResult = await pool.query(
      `SELECT sender_name, text FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 15`, 
      [roomId]
    );
    
    const chatHistory = historyResult.rows.reverse().map(m => `${m.sender_name}: ${m.text}`).join('\n');

    // 1b. Fetch Room Memory Engine Context
    const memoryContext = await MemoryService.getContext(roomId);

    // 2. Build Prompt Context
    const messages = [
      { 
        role: "system", 
        content: `${persona.role}\n\n${memoryContext}\n\nRecent Conversation History:\n${chatHistory}` 
      },
      { role: "user", content: cleanPrompt }
    ];

    // 3. Inform Frontend that streaming is starting
    io.to(roomId).emit("ai_stream_start", {
      messageId, 
      sender: persona.displayName,
      personaId: persona.id,
      color: persona.color
    });

    // 4. Initialize Stream with retry mechanism
    const stream = await withRetry(() => groq.chat.completions.create({
      messages,
      model: persona.model,
      stream: true,
    }));

    let fullResponse = "";

    // 5. Stream chunks over Socket.IO
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
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
  } catch (error) {
    logger.error("GROQ-SERVICE", `AI Stream Error: ${error.message}`, error);
    io.to(roomId).emit("ai_stream_end", {
      messageId,
      finalDbId: `error-${messageId}`,
      text: "⚠️ AI temporarily unavailable",
      created_at: new Date().toISOString(),
      status: 'failed'
    });
  }
}
