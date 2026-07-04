import { getDB } from '../../config/db.js';

const pool = getDB();

export class DecisionService {
  /**
   * Create a new decision record.
   */
  static async create({
    roomId,
    title,
    decision,
    reason,
    participants,
    alternativesDiscussed = [],
    sourceMessages = [],
    discussionSummary = '',
    confidence = 0,
    status = 'pending',
    createdBy = null,
  }) {
    console.log(`[DECISION DB SERVICE] 💾 Creating decision: "${title}" | Room: ${roomId}`);

    const result = await pool.query(`
      INSERT INTO decisions (room_id, title, decision, reason, participants, alternatives_discussed, source_messages, discussion_summary, confidence, status, created_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      roomId,
      title,
      decision || '',
      reason || '',
      JSON.stringify(participants || []),
      JSON.stringify(alternativesDiscussed || []),
      JSON.stringify(sourceMessages || []),
      discussionSummary || '',
      confidence || 0,
      status,
      createdBy,
    ]);

    const dec = result.rows[0];
    console.log(`[DECISION DB SERVICE] ✅ Decision created: id=${dec.decision_id}`);
    return dec;
  }

  /**
   * Fetch all decisions for a room, newest first.
   */
  static async getByRoom(roomId) {
    console.log(`[DECISION DB SERVICE] 📋 Fetching decisions for room: ${roomId}`);
    const result = await pool.query(
      `SELECT * FROM decisions WHERE room_id = $1 ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC`,
      [roomId]
    );
    console.log(`[DECISION DB SERVICE] ✅ Found ${result.rows.length} decisions`);
    return result.rows;
  }

  static async getLatestPending(roomId) {
    const result = await pool.query(
      `
        SELECT *
        FROM decisions
        WHERE room_id = $1
          AND status = 'pending'
          AND is_deleted = false
        ORDER BY COALESCE(updated_at, created_at) DESC
        LIMIT 1
      `,
      [roomId]
    );
    return result.rows[0] || null;
  }

  /**
   * Prevent duplicate decisions — check if a decision with similar title exists in last 10 minutes.
   */
  static async isDuplicate(roomId, title) {
    const result = await pool.query(
      `SELECT decision_id FROM decisions WHERE room_id = $1 AND title = $2 AND is_deleted = false AND created_at > NOW() - INTERVAL '10 minutes' LIMIT 1`,
      [roomId, title]
    );
    return result.rows.length > 0;
  }

  static async update(decisionId, {
    title,
    decision,
    reason,
    participants,
    alternativesDiscussed,
    sourceMessages,
    discussionSummary,
    confidence,
    status,
    updatedBy,
    isDeleted,
    deletedAt,
    isArchived,
    archivedAt,
    finalizedAt,
    rejectedAt,
  }) {
    const result = await pool.query(`
      UPDATE decisions
      SET title = COALESCE($2, title),
          decision = COALESCE($3, decision),
          reason = COALESCE($4, reason),
          participants = COALESCE($5, participants),
          alternatives_discussed = COALESCE($6, alternatives_discussed),
          source_messages = COALESCE($7, source_messages),
          discussion_summary = COALESCE($8, discussion_summary),
          confidence = COALESCE($9, confidence),
          status = COALESCE($10, status),
          updated_by = COALESCE($11, updated_by),
          is_deleted = COALESCE($12, is_deleted),
          deleted_at = COALESCE($13, deleted_at),
          is_archived = COALESCE($14, is_archived),
          archived_at = COALESCE($15, archived_at),
          finalized_at = COALESCE($16, finalized_at),
          rejected_at = COALESCE($17, rejected_at),
          updated_at = CURRENT_TIMESTAMP
      WHERE decision_id = $1
      RETURNING *
    `, [
      decisionId,
      title ?? null,
      decision ?? null,
      reason ?? null,
      participants ? JSON.stringify(participants) : null,
      alternativesDiscussed ? JSON.stringify(alternativesDiscussed) : null,
      sourceMessages ? JSON.stringify(sourceMessages) : null,
      discussionSummary ?? null,
      confidence ?? null,
      status ?? null,
      updatedBy ?? null,
      isDeleted ?? null,
      deletedAt ?? null,
      isArchived ?? null,
      archivedAt ?? null,
      finalizedAt ?? null,
      rejectedAt ?? null,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Soft delete a decision.
   */
  static async softDelete(decisionId) {
    console.log(`[DECISION DB SERVICE] 🗑️ Soft deleting decision ${decisionId}`);
    const result = await pool.query(`
      UPDATE decisions SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, status = 'rejected', rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE decision_id = $1 RETURNING *
    `, [decisionId]);

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Restore a soft-deleted decision.
   */
  static async restore(decisionId) {
    console.log(`[DECISION DB SERVICE] ♻️ Restoring decision ${decisionId}`);
    const result = await pool.query(`
      UPDATE decisions SET is_deleted = false, deleted_at = null, status = 'pending', rejected_at = null, updated_at = CURRENT_TIMESTAMP
      WHERE decision_id = $1 RETURNING *
    `, [decisionId]);

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Hard delete a decision permanently from the database.
   */
  static async hardDelete(decisionId) {
    console.log(`[DECISION DB SERVICE] 🔥 Hard deleting decision ${decisionId}`);
    const result = await pool.query(`
      DELETE FROM decisions WHERE decision_id = $1 RETURNING *
    `, [decisionId]);

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Toggle archived status of a decision.
   */
  static async toggleArchive(decisionId, isArchived) {
    console.log(`[DECISION DB SERVICE] 📦 Toggling archive decision ${decisionId} → ${isArchived}`);
    const result = await pool.query(`
      UPDATE decisions SET is_archived = $1, archived_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE null END, updated_at = CURRENT_TIMESTAMP
      WHERE decision_id = $2 RETURNING *
    `, [isArchived, decisionId]);

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    return result.rows[0];
  }
}
