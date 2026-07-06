// GroqExtraction.js — AI Task Extraction Pipeline (Migrated to Gemini)
// Responsibility: Given a message, extract structured task JSON via Gemini LLM.
// IMPORTANT: assigned_to stores a display NAME string (not a user FK id).
// This avoids PostgreSQL foreign key violations entirely.

import { googleAI, withRetry } from "../../utils/geminiClient.js";
import dotenv from "dotenv";
import { getDB } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

dotenv.config();

// Minimum confidence for a task to be accepted
const CONFIDENCE_THRESHOLD = 0.6;

export class GroqExtraction {
  /**
   * Extract one or more structured tasks from a message.
   * Returns an array of task objects, or empty array if none detected.
   */
  static async extractTasks(messageText, roomId, authorName) {
    console.log(`[GEMINI EXTRACTION] 🚀 Starting task extraction for message: "${messageText.substring(0, 100)}"`);
    console.log(`[GEMINI EXTRACTION] Room: ${roomId}, Author: ${authorName}`);

    if (!googleAI) {
      console.error("[GEMINI EXTRACTION] ❌ Gemini API is not configured.");
      return [];
    }

    const pool = getDB();

    // Fetch recent message authors in this room for name-matching context
    let roomMembers = [];
    try {
      const membersResult = await pool.query(
        `SELECT sender_name FROM messages WHERE room_id = $1 GROUP BY sender_name ORDER BY MAX(created_at) DESC LIMIT 30`,
        [roomId]
      );
      roomMembers = membersResult.rows.map(r => r.sender_name).filter(Boolean);
      console.log(`[GEMINI EXTRACTION] Room members for context: ${JSON.stringify(roomMembers)}`);
    } catch (e: any) {
      console.error("[GEMINI EXTRACTION] ⚠️ Could not fetch room members:", e.message);
    }

    const systemPrompt = `You are an expert project management AI assistant specialized in extracting actionable tasks from conversational messages.

Your role is to analyze messages and identify tasks, assignments, and action items.

CONTEXT:
- Current Time: ${new Date().toISOString()}
- Room Members (people who have sent messages): ${JSON.stringify(roomMembers)}
- Message Author: ${authorName}

EXTRACTION RULES:
1. Extract ALL distinct tasks mentioned in the message, even if multiple exist.
2. For "assigned_to": Match names mentioned in the message against Room Members. Use the EXACT display name string from Room Members if it matches. If no match found, use the name as written in the message. If unclear, use null.
3. Priority MUST be exactly one of: "low", "medium", "high", or "urgent".
4. If a deadline is mentioned (e.g., "by Friday", "by tomorrow"), estimate the ISO8601 datetime. Today is ${new Date().toISOString().split('T')[0]}.
5. "confidence" is a float 0.0–1.0. 0.9+ = very clear task. 0.7 = likely task. 0.5 = possible task.
6. If the message contains NO actionable tasks, return: {"tasks": []}

REQUIRED OUTPUT FORMAT (strict JSON, no markdown formatting block, no explanations):
{
  "tasks": [
    {
      "title": "Short, clear action title",
      "description": "Additional context from the message, or empty string",
      "assigned_to": "Display name string or null",
      "priority": "medium",
      "deadline": "ISO8601 string or null",
      "confidence": 0.85
    }
  ]
}

EXAMPLES:
Message: "Siddharth prepare the excel sheet"
→ {"tasks": [{"title": "Prepare the excel sheet", "description": "", "assigned_to": "Siddharth", "priority": "medium", "deadline": null, "confidence": 0.88}]}

Message: "Assign Siddharth to complete authentication by Friday"
→ {"tasks": [{"title": "Complete authentication", "description": "", "assigned_to": "Siddharth", "priority": "high", "deadline": "2026-07-10T12:00:00Z", "confidence": 0.95}]}

Message: "We need to attend the meeting, prepare the slides, and buy the new equipment"
→ {"tasks": [{"title": "Attend the meeting", ...}, {"title": "Prepare the slides", ...}, {"title": "Buy the new equipment", ...}]}

Message: "How are you doing today?"
→ {"tasks": []}`;

    try {
      logger.info("GEMINI-EXTRACTION", `📡 Calling Gemini API (model: gemini-2.5-flash)...`);
      
      const model = googleAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const response = await withRetry(() => model.generateContent({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nExtract tasks from this message: "${messageText}"` }] }
        ]
      }));

      const rawJson = response.response.text();
      console.log(`[GEMINI EXTRACTION] 📨 Raw Gemini response: ${rawJson}`);

      if (!rawJson) {
        console.error("[GEMINI EXTRACTION] ❌ Empty response from Gemini");
        return [];
      }

      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseErr: any) {
        console.error("[GEMINI EXTRACTION] ❌ JSON parse failed:", parseErr.message);
        console.error("[GEMINI EXTRACTION] Raw content was:", rawJson);
        return [];
      }

      let tasks = [];
      if (Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks;
      } else if (parsed.title) {
        tasks = [parsed];
      } else {
        console.log("[GEMINI EXTRACTION] ℹ️ No tasks in response");
        return [];
      }

      const validTasks = tasks.filter(task => {
        if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
          console.log(`[GEMINI EXTRACTION] ⚠️ Skipping task with no title`);
          return false;
        }
        const confidence = parseFloat(task.confidence) || 0;
        if (confidence < CONFIDENCE_THRESHOLD) {
          console.log(`[GEMINI EXTRACTION] ⚠️ Skipping task "${task.title}" — confidence ${confidence} below threshold ${CONFIDENCE_THRESHOLD}`);
          return false;
        }
        return true;
      });

      console.log(`[GEMINI EXTRACTION] ✅ Extracted ${validTasks.length} valid task(s) from ${tasks.length} detected`);
      
      return validTasks.map(task => ({
        title: task.title.trim(),
        description: task.description || '',
        assigned_to: task.assigned_to || null,
        priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium',
        deadline: task.deadline || null,
        confidence: parseFloat(task.confidence) || 0.7,
      }));

    } catch (err: any) {
      console.error(`[GEMINI EXTRACTION] ❌ Gemini API call failed:`, err.message || err);
      return [];
    }
  }

  static async extractTask(messageText, roomId, authorName) {
    const tasks = await this.extractTasks(messageText, roomId, authorName);
    return tasks.length > 0 ? tasks[0] : null;
  }
}

