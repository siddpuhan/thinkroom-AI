// GroqExtraction.js — AI Task Extraction Pipeline
// Responsibility: Given a message, extract structured task JSON via Groq LLM.
// IMPORTANT: assigned_to stores a display NAME string (not a user FK id).
// This avoids PostgreSQL foreign key violations entirely.

import Groq from "groq-sdk";
import dotenv from "dotenv";
import { getDB } from "../../config/db.js";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("[GROQ EXTRACTION] ❌ GROQ_API_KEY is not set! Task extraction will fail.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Minimum confidence for a task to be accepted
const CONFIDENCE_THRESHOLD = 0.6;

export class GroqExtraction {
  /**
   * Extract one or more structured tasks from a message.
   * Returns an array of task objects, or empty array if none detected.
   */
  static async extractTasks(messageText, roomId, authorName) {
    console.log(`[GROQ EXTRACTION] 🚀 Starting extraction for message: "${messageText.substring(0, 100)}"`);
    console.log(`[GROQ EXTRACTION] Room: ${roomId}, Author: ${authorName}`);

    const pool = getDB();

    // Fetch recent message authors in this room for name-matching context
    let roomMembers = [];
    try {
      const membersResult = await pool.query(
        `SELECT sender_name FROM messages WHERE room_id = $1 GROUP BY sender_name ORDER BY MAX(created_at) DESC LIMIT 30`,
        [roomId]
      );
      roomMembers = membersResult.rows.map(r => r.sender_name).filter(Boolean);
      console.log(`[GROQ EXTRACTION] Room members for context: ${JSON.stringify(roomMembers)}`);
    } catch (e) {
      console.error("[GROQ EXTRACTION] ⚠️ Could not fetch room members:", e.message);
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

REQUIRED OUTPUT FORMAT (strict JSON, no markdown, no explanations):
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
→ {"tasks": [{"title": "Complete authentication", "description": "", "assigned_to": "Siddharth", "priority": "high", "deadline": "<next friday ISO>", "confidence": 0.95}]}

Message: "We need to attend the meeting, prepare the slides, and buy the new equipment"
→ {"tasks": [{"title": "Attend the meeting", ...}, {"title": "Prepare the slides", ...}, {"title": "Buy the new equipment", ...}]}

Message: "How are you doing today?"
→ {"tasks": []}`;

    try {
      console.log(`[GROQ EXTRACTION] 📡 Calling Groq API (model: llama-3.3-70b-versatile)...`);
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract tasks from this message: "${messageText}"` }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      const rawJson = completion.choices[0]?.message?.content;
      console.log(`[GROQ EXTRACTION] 📨 Raw Groq response: ${rawJson}`);

      if (!rawJson) {
        console.error("[GROQ EXTRACTION] ❌ Empty response from Groq");
        return [];
      }

      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseErr) {
        console.error("[GROQ EXTRACTION] ❌ JSON parse failed:", parseErr.message);
        console.error("[GROQ EXTRACTION] Raw content was:", rawJson);
        return [];
      }

      // Handle both {tasks: [...]} and flat single-task objects
      let tasks = [];
      if (Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks;
      } else if (parsed.title) {
        // Legacy single-task format fallback
        tasks = [parsed];
      } else {
        console.log("[GROQ EXTRACTION] ℹ️ No tasks in response");
        return [];
      }

      // Filter by confidence threshold and validate required fields
      const validTasks = tasks.filter(task => {
        if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
          console.log(`[GROQ EXTRACTION] ⚠️ Skipping task with no title`);
          return false;
        }
        const confidence = parseFloat(task.confidence) || 0;
        if (confidence < CONFIDENCE_THRESHOLD) {
          console.log(`[GROQ EXTRACTION] ⚠️ Skipping task "${task.title}" — confidence ${confidence} below threshold ${CONFIDENCE_THRESHOLD}`);
          return false;
        }
        return true;
      });

      console.log(`[GROQ EXTRACTION] ✅ Extracted ${validTasks.length} valid task(s) from ${tasks.length} detected`);
      
      return validTasks.map(task => ({
        title: task.title.trim(),
        description: task.description || '',
        assigned_to: task.assigned_to || null,    // NAME string, not a DB FK
        priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium',
        deadline: task.deadline || null,
        confidence: parseFloat(task.confidence) || 0.7,
      }));

    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        console.error(`[GROQ EXTRACTION] 🔑 API Key Error (${err.status}): Check GROQ_API_KEY in server/.env`);
      } else if (err.status === 429) {
        console.error(`[GROQ EXTRACTION] ⏱️ Rate limited by Groq API`);
      } else {
        console.error(`[GROQ EXTRACTION] ❌ Groq API call failed:`, err.message || err);
      }
      return [];
    }
  }

  // Legacy single-task adapter for backward compatibility
  static async extractTask(messageText, roomId, authorName) {
    const tasks = await this.extractTasks(messageText, roomId, authorName);
    return tasks.length > 0 ? tasks[0] : null;
  }
}
