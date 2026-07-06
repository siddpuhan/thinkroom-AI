import { getDB } from "../config/db.js";

export const syncUser = async (req, res) => {
  try {
    const { id, name, email } = req.body;
    const pool = getDB();

    // Use UPSERT logic
    const query = `
      INSERT INTO users (id, name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, email = EXCLUDED.email
      RETURNING *
    `;
    const values = [id, name, email];
    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message,
    });
  }
};
