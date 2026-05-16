// DocumentService.js — CRUD for AI-generated documents (decisions, notes, summaries)
import { getDB } from '../../config/db.js';

const pool = getDB();

export class DocumentService {
  /**
   * Create a new AI document.
   */
  static async create({ roomId, title, content, summary, type, participants, sourceMessages, confidence }) {
    console.log(`[DOC SERVICE] 💾 Creating doc: "${title}" | Type: ${type} | Room: ${roomId}`);

    const result = await pool.query(`
      INSERT INTO documents (room_id, title, content, summary, type, participants, source_messages, confidence, created_by_ai)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [
      roomId,
      title,
      content || '',
      summary || '',
      type,
      JSON.stringify(participants || []),
      JSON.stringify(sourceMessages || []),
      confidence || 0.7,
    ]);

    const doc = result.rows[0];
    console.log(`[DOC SERVICE] ✅ Doc created: id=${doc.id}`);
    return doc;
  }

  /**
   * Fetch all documents for a room, newest first.
   */
  static async getByRoom(roomId) {
    console.log(`[DOC SERVICE] 📋 Fetching docs for room: ${roomId}`);
    const result = await pool.query(
      `SELECT * FROM documents WHERE room_id = $1 ORDER BY created_at DESC`,
      [roomId]
    );
    console.log(`[DOC SERVICE] ✅ Found ${result.rows.length} docs`);
    return result.rows;
  }

  /**
   * Fetch documents by type for a room.
   */
  static async getByRoomAndType(roomId, type) {
    const result = await pool.query(
      `SELECT * FROM documents WHERE room_id = $1 AND type = $2 ORDER BY created_at DESC`,
      [roomId, type]
    );
    return result.rows;
  }

  /**
   * Prevent duplicate documents — check if a document with similar title exists in last 10 minutes.
   */
  static async isDuplicate(roomId, title) {
    const result = await pool.query(
      `SELECT id FROM documents WHERE room_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '10 minutes' LIMIT 1`,
      [roomId, title]
    );
    return result.rows.length > 0;
  }
}
