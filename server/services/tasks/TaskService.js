// TaskService.js — Database operations for AI-extracted tasks
// IMPORTANT: assigned_to stores a DISPLAY NAME string (TEXT), not a user FK.
// The tasks table must NOT have a FK constraint on assigned_to to avoid
// foreign key violations when AI assigns to names not in the users table.

import { getDB } from '../../config/db.js';

export class TaskService {
  /**
   * Create a new task. assigned_to is a display name string or null.
   */
  static async create(taskData) {
    const pool = getDB();
    const {
      roomId,
      sourceMessageId,
      title,
      description,
      assignedTo,   // Display name string or null — NOT a user FK
      priority,
      status,
      deadline,
      confidence,
      aiGenerated,
      createdBy
    } = taskData;

    console.log(`[TASK SERVICE] 💾 Creating task: "${title}" | Room: ${roomId} | Assigned: ${assignedTo} | Priority: ${priority}`);

    // Validate sourceMessageId — must be a valid UUID or null
    // clientIds (e.g. "test-1234567890") are not UUIDs and cause insert failures
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeSourceMessageId = (sourceMessageId && UUID_REGEX.test(sourceMessageId))
      ? sourceMessageId
      : null;

    // Sanitize deadline: ensure valid ISO string or null
    let sanitizedDeadline = null;
    if (deadline) {
      try {
        const d = new Date(deadline);
        if (!isNaN(d.getTime())) {
          sanitizedDeadline = d.toISOString();
        } else {
          console.log(`[TASK SERVICE] ⚠️ Invalid deadline ignored: "${deadline}"`);
        }
      } catch {
        console.log(`[TASK SERVICE] ⚠️ Deadline parse error, ignoring: "${deadline}"`);
      }
    }

    try {
      const result = await pool.query(`
        INSERT INTO tasks (
          room_id, source_message_id, title, description,
          assigned_to_name, priority, status, deadline, confidence, ai_generated, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        roomId,
        safeSourceMessageId,             // validated UUID or null
        title,
        description || '',
        assignedTo || null,           // stored as plain text name
        priority || 'medium',
        status || 'pending',
        sanitizedDeadline,
        confidence || 0.7,
        aiGenerated !== undefined ? aiGenerated : true,
        createdBy || 'AI_SYSTEM'
      ]);

      const newTask = result.rows[0];
      console.log(`[TASK SERVICE] ✅ Task created: id=${newTask.id}`);

      // Insert activity log (best-effort, don't fail if this errors)
      try {
        await pool.query(`
          INSERT INTO task_activity (task_id, activity_type, actor_id)
          VALUES ($1, $2, $3)
        `, [newTask.id, 'created', createdBy || 'AI_SYSTEM']);
      } catch (actErr) {
        console.warn(`[TASK SERVICE] ⚠️ Activity log insert failed (non-fatal):`, actErr.message);
      }

      return newTask;
    } catch (err) {
      console.error(`[TASK SERVICE] ❌ Failed to insert task:`, err.message);
      console.error(`[TASK SERVICE] Error code: ${err.code}, Detail: ${err.detail}`);
      throw err;
    }
  }

  /**
   * Update a task's status and log the activity.
   */
  static async updateStatus(taskId, newStatus, actorId) {
    const pool = getDB();
    console.log(`[TASK SERVICE] 🔄 Updating task ${taskId} status → ${newStatus}`);
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    try {
      const result = await pool.query(`
        UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 RETURNING *
      `, [newStatus, taskId]);

      if (result.rows.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const updatedTask = result.rows[0];
      console.log(`[TASK SERVICE] ✅ Task ${taskId} updated to ${newStatus}`);

      try {
        await pool.query(`
          INSERT INTO task_activity (task_id, activity_type, actor_id, metadata)
          VALUES ($1, $2, $3, $4)
        `, [taskId, 'status_updated', actorId || 'SYSTEM', JSON.stringify({ newStatus })]);
      } catch (actErr) {
        console.warn(`[TASK SERVICE] ⚠️ Activity log insert failed (non-fatal):`, actErr.message);
      }

      return updatedTask;
    } catch (err) {
      console.error(`[TASK SERVICE] ❌ Failed to update task:`, err.message);
      throw err;
    }
  }

  /**
   * Fetch all tasks for a room, ordered newest first.
   */
  static async getTasksByRoom(roomId) {
    const pool = getDB();
    console.log(`[TASK SERVICE] 📋 Fetching tasks for room: ${roomId}`);
    
    try {
      const result = await pool.query(`
        SELECT * FROM tasks WHERE room_id = $1 ORDER BY created_at DESC
      `, [roomId]);
      
      console.log(`[TASK SERVICE] ✅ Found ${result.rows.length} tasks for room ${roomId}`);
      return result.rows;
    } catch (err) {
      console.error(`[TASK SERVICE] ❌ Failed to fetch tasks:`, err.message);
      throw err;
    }
  }

  /**
   * Mark a task as completed.
   */
  static async complete(taskId, actorId) {
    return this.updateStatus(taskId, 'completed', actorId);
  }
}
