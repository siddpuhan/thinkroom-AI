import { getDB } from '../../config/db.js';

const pool = getDB();

export class SummaryService {
  static async create({ roomId, summaryType, title, content, highlights, participants, createdBy }) {
    const result = await pool.query(
      `INSERT INTO summaries (room_id, summary_type, title, content, highlights, participants, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        roomId,
        summaryType,
        title,
        content,
        JSON.stringify(highlights || []),
        JSON.stringify(participants || []),
        createdBy || 'AI_SYSTEM'
      ]
    );
    return result.rows[0];
  }

  static async getByRoom(roomId) {
    const result = await pool.query(`SELECT * FROM summaries WHERE room_id = $1 ORDER BY created_at DESC`, [roomId]);
    return result.rows;
  }

  static async softDelete(summaryId) {
    const result = await pool.query(
      `UPDATE summaries SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [summaryId]
    );
    if (result.rows.length === 0) throw new Error(`Summary ${summaryId} not found`);
    return result.rows[0];
  }

  static async restore(summaryId) {
    const result = await pool.query(
      `UPDATE summaries SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [summaryId]
    );
    if (result.rows.length === 0) throw new Error(`Summary ${summaryId} not found`);
    return result.rows[0];
  }

  static async hardDelete(summaryId) {
    const result = await pool.query(`DELETE FROM summaries WHERE id = $1 RETURNING *`, [summaryId]);
    if (result.rows.length === 0) throw new Error(`Summary ${summaryId} not found`);
    return result.rows[0];
  }

  static async toggleArchive(summaryId, isArchived) {
    const result = await pool.query(
      `UPDATE summaries SET is_archived = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [summaryId, isArchived]
    );
    if (result.rows.length === 0) throw new Error(`Summary ${summaryId} not found`);
    return result.rows[0];
  }
}
