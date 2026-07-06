import { getDB } from "../config/db.js";

export const createMessage = async (req, res) => {
  try {
    console.log('Incoming message payload:', req.body);
    const { id, text, sender_id, sender_name, room_id } = req.body;
    const userId = req.auth?.userId || sender_id;

    const trimmedText = typeof text === 'string' ? text.trim() : '';
    if (!trimmedText) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }

    const trimmedSenderName = typeof sender_name === 'string' ? sender_name.trim() : null;
    const fallbackSenderName = trimmedSenderName || 'Unknown User';
    const finalRoomId = typeof room_id === 'string' ? room_id.trim() : null;

    const pool = getDB();
    let query, values;

    if (id) {
      query = `
        INSERT INTO messages (id, text, sender_id, sender_name, room_id) 
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT (id) DO NOTHING
        RETURNING id, text, sender_id, sender_name, room_id, created_at
      `;
      values = [id, trimmedText, userId || null, fallbackSenderName, finalRoomId];
    } else {
      query = `
        INSERT INTO messages (text, sender_id, sender_name, room_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, text, sender_id, sender_name, room_id, created_at
      `;
      values = [trimmedText, userId || null, fallbackSenderName, finalRoomId];
    }
    
    const result = await pool.query(query, values);
    let newMessage = result.rows[0];

    if (!newMessage && id) {
      const fetchQuery = `SELECT id, text, sender_id, sender_name, room_id, created_at FROM messages WHERE id = $1`;
      const fetchResult = await pool.query(fetchQuery, [id]);
      newMessage = fetchResult.rows[0];
      return res.status(200).json({ success: true, data: newMessage });
    }

    return res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.query;
    const pool = getDB();
    
    if (!roomId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const query = `
      SELECT id, text, sender_id, sender_name, room_id, created_at 
      FROM messages 
      WHERE room_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [roomId]);
    const messages = result.rows;

    return res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};
