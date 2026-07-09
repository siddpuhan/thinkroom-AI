// GeminiExtraction.ts — AI Task Extraction Pipeline
// Responsibility: Given a message and conversation history, extract tasks.

import { googleAI, withRetry } from "../../utils/geminiClient.js";
import dotenv from "dotenv";
import { getDB } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

dotenv.config();

// Low bar: we WANT the model to surface actionable intent from natural,
// conversational language. False positives only cost one extra Gemini call;
// false negatives (missed tasks) are the real failure mode.
const CONFIDENCE_THRESHOLD = 0.4;

export class GeminiExtraction {
  /**
   * Extract one or more structured tasks from a message, leveraging rolling conversation context.
   */
  static async extractTasks(messageText, roomId, authorName, history = []) {
    console.log(`[GEMINI EXTRACTION] 🚀 Starting semantic task extraction for message: "${messageText.substring(0, 100)}"`);
    console.log(`[GEMINI EXTRACTION] Room: ${roomId}, Author: ${authorName}, Context history length: ${history.length}`);

    if (!googleAI) {
      console.error("[GEMINI EXTRACTION] ❌ Gemini API is not configured.");
      return [];
    }

    const pool = getDB();

    // Fetch recent message authors for name matching
    let roomMembers = [];
    try {
      const membersResult = await pool.query(
        `SELECT sender_name FROM messages WHERE room_id = $1 GROUP BY sender_name ORDER BY MAX(created_at) DESC LIMIT 30`,
        [roomId]
      );
      roomMembers = membersResult.rows.map(r => r.sender_name).filter(Boolean);
    } catch (e: any) {
      console.error("[GEMINI EXTRACTION] ⚠️ Could not fetch room members:", e.message);
    }

    const conversationContext = history
      .map((msg, i) => `[${i + 1}] ${msg.sender_name || 'Unknown'}: "${msg.text || ''}"`)
      .join('\n');

    const systemPrompt = `You are a staff-level technical project manager and coordinator.
Your objective is to analyze a conversation window and identify tasks, assignments, commitments, promises, deadlines, follow-ups, and requests.

CONVERSATION CONTEXT (Last 20 messages):
${conversationContext}

LATEST MESSAGE TO EVALUATE:
Author: ${authorName}
Message: "${messageText}"

ROOM MEMBERS (known names):
${JSON.stringify(roomMembers)}

EXTRACTION GUIDELINES:
1. Natural language first: Understand the message the way a human project manager would. People rarely use rigid commands. Recognize implied action items from casual phrasing such as "Anshika prepare DSA notes", "Rahul deploy backend today", "Finish landing page before Monday", "Review my PR", "Call the client tomorrow", or "Push today's work to GitHub". If the message conveys that someone should do something, create a task.
2. Never rely on keywords alone. Judge intent from meaning and context, not from the presence of specific verbs.
3. Context matching: Use the conversation context to resolve who tasks are assigned to, or what the task refers to. For example, if User A says "We should redesign the landing page" and User B says "Anshika can you handle it?", you should resolve this to a task "Redesign landing page" assigned to "Anshika".
4. Assignee name: Match the assignee name against the Room Members list if possible. If not found, use the name as written. Pay attention to "Name <verb>" patterns (e.g. "Anshika prepare..."). If no one is assigned, use null.
5. Priority: Must be exactly one of: "low", "medium", "high", or "urgent".
6. Deadline: Estimate the ISO8601 datetime if a timeline is mentioned (e.g. "tomorrow", "Friday"). Today is ${new Date().toISOString().split('T')[0]}.
7. Confidence: A float between 0.0 and 1.0. Set at least 0.7 for any clear action item, and never below 0.4 for anything you choose to include.

RETURN ONLY STRICT JSON IN THIS FORMAT (no markdown code blocks, no trailing comments, no explanation):
{
  "tasks": [
    {
      "title": "Clear action title",
      "description": "Any additional context, requirements, or conversation snippet",
      "assigned_to": "Exact string name of assignee or null",
      "priority": "low" | "medium" | "high" | "urgent",
      "deadline": "ISO8601 string or null",
      "confidence": 0.85
    }
  ]
}

If no task or action item exists, return: {"tasks": []}`;

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
          { role: "user", parts: [{ text: systemPrompt }] }
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
        return [];
      }

      let tasks = [];
      if (Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks;
      } else if (parsed.title) {
        tasks = [parsed];
      } else {
        return [];
      }

      const validTasks = tasks.filter(task => {
        if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
          return false;
        }
        const confidence = parseFloat(task.confidence) || 0;
        if (confidence < CONFIDENCE_THRESHOLD) {
          console.log(`[GEMINI EXTRACTION] ⚠️ Skipping task "${task.title}" — confidence ${confidence} below threshold ${CONFIDENCE_THRESHOLD}`);
          return false;
        }
        return true;
      });

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
    const tasks = await this.extractTasks(messageText, roomId, authorName, []);
    return tasks.length > 0 ? tasks[0] : null;
  }
}
