import { getDB } from '../../config/db.js';

const pool = getDB();

export class NotesService {
  static async create({ roomId, type, title, content, confidence, createdBy }) {
    const result = await pool.query(
      `INSERT INTO notes (room_id, type, title, content, confidence, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [roomId, type, title, content || title, confidence || 0.7, createdBy || 'AI_SYSTEM']
    );
    return result.rows[0];
  }

  static async getByRoom(roomId) {
    const result = await pool.query(`SELECT * FROM notes WHERE room_id = $1 ORDER BY created_at DESC`, [roomId]);
    return result.rows;
  }

  static async isDuplicate(roomId, type, title) {
    const result = await pool.query(
      `SELECT id FROM notes WHERE room_id = $1 AND type = $2 AND title = $3 AND deleted_at IS NULL AND created_at > NOW() - INTERVAL '10 minutes' LIMIT 1`,
      [roomId, type, title]
    );
    return result.rows.length > 0;
  }

  static async softDelete(noteId) {
    const result = await pool.query(
      `UPDATE notes SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [noteId]
    );
    if (result.rows.length === 0) throw new Error(`Note ${noteId} not found`);
    return result.rows[0];
  }

  static async restore(noteId) {
    const result = await pool.query(
      `UPDATE notes SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [noteId]
    );
    if (result.rows.length === 0) throw new Error(`Note ${noteId} not found`);
    return result.rows[0];
  }

  static async hardDelete(noteId) {
    const result = await pool.query(`DELETE FROM notes WHERE id = $1 RETURNING *`, [noteId]);
    if (result.rows.length === 0) throw new Error(`Note ${noteId} not found`);
    return result.rows[0];
  }

  static async toggleArchive(noteId, isArchived) {
    const result = await pool.query(
      `UPDATE notes SET archived_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [noteId, isArchived ? new Date() : null]
    );
    if (result.rows.length === 0) throw new Error(`Note ${noteId} not found`);
    return result.rows[0];
  }
}