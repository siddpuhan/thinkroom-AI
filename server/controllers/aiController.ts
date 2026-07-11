import { groq } from "../utils/groqClient.js";
import { getDB } from "../config/db.js";

export const processThinkRoomAI = async (roomId, userQuestion, io) => {
  const pool = getDB();
  
  try {
    if (!groq) {
      console.error("Groq API client is not configured.");
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

    const userText = userQuestion.replace('@ai', '').trim();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `You are ThinkRoom AI, a helpful teammate in this chat. Use the following history to answer questions concisely.\nHistory:\n${chatHistory}` },
        { role: "user", content: userText }
      ],
      temperature: 0.7
    });

    const aiReply = completion.choices[0]?.message?.content || "";

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
