import { googleAI } from "../utils/geminiClient.js";
import { getDB } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

export const processThinkRoomAI = async (roomId, userQuestion, io) => {
  const pool = getDB();
  
  try {
    if (!googleAI) {
      console.error("Gemini API is not configured.");
      return;
    }

    // 1. Look Back: Get the last 10 messages so the AI isn't "clueless"
    const historyResult = await pool.query(`
      SELECT sender_name, text 
      FROM messages 
      WHERE room_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [roomId]);

    const history = historyResult.rows;

    // 2. Think: Format them for the AI to read like a script
    const chatHistory = history.reverse().map(m => `${m.sender_name || 'User'}: ${m.text}`).join('\n');

    const model = googleAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `System context: You are ThinkRoom AI, a helpful teammate in this chat. Use the following history to answer questions concisely.\nHistory:\n${chatHistory}` }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will use the history context to assist the team as ThinkRoom AI." }]
        }
      ]
    });

    const userText = userQuestion.replace('@ai', '').trim();
    const result = await chat.sendMessage(userText);
    const aiReply = result.response.text();

    // 3. Speak: Save the AI's answer back to PostgreSQL
    const insertResult = await pool.query(`
      INSERT INTO messages (text, sender_name, room_id) 
      VALUES ($1, $2, $3) 
      RETURNING id, text, sender_name, room_id, created_at
    `, [aiReply, 'ThinkRoom AI', roomId]);

    const aiMessage = insertResult.rows[0];

    // 4. Emit to the room via Socket.IO so users see it in real-time
    if (io) {
      io.to(roomId).emit("receive_message", {
        ...aiMessage,
        sender: 'ThinkRoom AI', // compatibility with frontend expectations
      });
    }

    return aiMessage;
  } catch (error) {
    console.error("ThinkRoom AI Error:", error);
  }
};

