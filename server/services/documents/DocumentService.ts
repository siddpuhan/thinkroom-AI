// DocumentService.js — CRUD for AI-generated documents
import { getDB } from '../../config/db.js';

const pool = getDB();

export class DocumentService {
  /**
   * Create a new AI document.
   */
  static async create({ roomId, category, title, status = 'draft', summary, content, participants, sourceMessages, confidence }) {
    console.log(`[DOC SERVICE] 💾 Creating doc: "${title}" | Category: ${category} | Room: ${roomId}`);

    const result = await pool.query(`
      INSERT INTO documents (room_id, category, title, status, summary, content, participants, source_messages, confidence)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      roomId,
      category,
      title,
      status,
      summary || '',
      content || '',
      JSON.stringify(participants || []),
      JSON.stringify(sourceMessages || []),
      confidence || 0.7,
    ]);

    const doc = result.rows[0];
    console.log(`[DOC SERVICE] ✅ Doc created: id=${doc.id}`);
    return doc;
  }

  /**
   * Update an existing AI document.
   */
  static async update(docId, updates) {
    console.log(`[DOC SERVICE] 💾 Updating doc: ${docId}`);
    
    // Dynamic update builder
    const fields = [];
    const values = [];
    let queryIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['category', 'title', 'status', 'summary', 'content', 'participants', 'source_messages', 'confidence', 'archived'].includes(key)) {
        fields.push(`${key} = $${queryIndex}`);
        values.push(key === 'participants' || key === 'source_messages' ? JSON.stringify(value) : value);
        queryIndex++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(docId);

    const result = await pool.query(`
      UPDATE documents SET ${fields.join(', ')}
      WHERE id = $${queryIndex}
      RETURNING *
    `, values);

    const doc = result.rows[0];
    if (doc) console.log(`[DOC SERVICE] ✅ Doc updated: id=${doc.id}`);
    return doc;
  }

  /**
   * Fetch all active documents for a room, newest first.
   */
  static async getByRoom(roomId) {
    console.log(`[DOC SERVICE] 📋 Fetching docs for room: ${roomId}`);
    const result = await pool.query(
      `SELECT * FROM documents WHERE room_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [roomId]
    );
    console.log(`[DOC SERVICE] ✅ Found ${result.rows.length} docs`);
    return result.rows;
  }

  /**
   * Fetch active documents by category for a room.
   */
  static async getByRoomAndCategory(roomId, category) {
    const result = await pool.query(
      `SELECT * FROM documents WHERE room_id = $1 AND category = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [roomId, category]
    );
    return result.rows;
  }

  /**
   * Find an existing draft document of the same category that might match this topic.
   */
  static async findDraftForTopic(roomId, category) {
    // Basic topic matching: look for recent drafts in the same category
    const result = await pool.query(
      `SELECT * FROM documents 
       WHERE room_id = $1 AND category = $2 AND status IN ('draft', 'updating', 'waiting') AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`,
      [roomId, category]
    );
    return result.rows[0];
  }

  /**
   * Prevent duplicate documents — check if a document with similar title exists in last 10 minutes.
   */
  static async isDuplicate(roomId, title) {
    const result = await pool.query(
      `SELECT id FROM documents WHERE room_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '10 minutes' AND deleted_at IS NULL LIMIT 1`,
      [roomId, title]
    );
    return result.rows.length > 0;
  }

  /**
   * Get a recent document of a specific category in the last 15 minutes.
   */
  static async getRecentDocument(roomId, category) {
    const result = await pool.query(
      `SELECT id FROM documents WHERE room_id = $1 AND category = $2 AND created_at > NOW() - INTERVAL '15 minutes' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [roomId, category]
    );
    return result.rows[0];
  }

  /**
   * Soft delete a document.
   */
  static async softDelete(docId) {
    console.log(`[DOC SERVICE] 🗑️ Soft deleting doc ${docId}`);
    const result = await pool.query(`
      UPDATE documents SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [docId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${docId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Toggle archived status of a document.
   */
  static async toggleArchive(docId, archived) {
    console.log(`[DOC SERVICE] 📦 Toggling archive doc ${docId} → ${archived}`);
    const result = await pool.query(`
      UPDATE documents SET archived = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [archived, docId]);

    if (result.rows.length === 0) {
      throw new Error(`Document ${docId} not found`);
    }

    return result.rows[0];
  }
}
