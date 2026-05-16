import { getDB } from '../../config/db.js';

const pool = getDB();

export class DecisionService {
  /**
   * Create a new lightweight decision record.
   */
  static async create({ roomId, title, decision, reason, participants }) {
    console.log(`[DECISION DB SERVICE] 💾 Creating decision: "${title}" | Room: ${roomId}`);

    const result = await pool.query(`
      INSERT INTO decisions (room_id, title, decision, reason, participants)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      roomId,
      title,
      decision || '',
      reason || '',
      JSON.stringify(participants || []),
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
      `SELECT * FROM decisions WHERE room_id = $1 ORDER BY created_at DESC`,
      [roomId]
    );
    console.log(`[DECISION DB SERVICE] ✅ Found ${result.rows.length} decisions`);
    return result.rows;
  }

  /**
   * Prevent duplicate decisions — check if a decision with similar title exists in last 10 minutes.
   */
  static async isDuplicate(roomId, title) {
    const result = await pool.query(
      `SELECT decision_id FROM decisions WHERE room_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '10 minutes' LIMIT 1`,
      [roomId, title]
    );
    return result.rows.length > 0;
  }
}
