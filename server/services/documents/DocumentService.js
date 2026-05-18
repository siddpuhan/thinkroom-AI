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

  /**
   * Soft delete a document.
   */
  static async softDelete(docId) {
    console.log(`[DOC SERVICE] 🗑️ Soft deleting doc ${docId}`);
    const result = await pool.query(`
      UPDATE documents SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [docId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${docId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Restore a soft-deleted document.
   */
  static async restore(docId) {
    console.log(`[DOC SERVICE] ♻️ Restoring doc ${docId}`);
    const result = await pool.query(`
      UPDATE documents SET is_deleted = false, deleted_at = null, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [docId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${docId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Hard delete a document permanently from the database.
   */
  static async hardDelete(docId) {
    console.log(`[DOC SERVICE] 🔥 Hard deleting doc ${docId}`);
    const result = await pool.query(`
      DELETE FROM documents WHERE id = $1 RETURNING *
    `, [docId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${docId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Toggle archived status of a document.
   */
  static async toggleArchive(docId, isArchived) {
    console.log(`[DOC SERVICE] 📦 Toggling archive doc ${docId} → ${isArchived}`);
    const result = await pool.query(`
      UPDATE documents SET is_archived = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [isArchived, docId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${docId} not found`);
    }

    return result.rows[0];
  }
}
