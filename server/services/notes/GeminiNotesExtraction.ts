import { googleAI, withRetry } from '../../utils/geminiClient.js';
import { logger } from '../../utils/logger.js';

const ALLOWED_TYPES = new Set([
  'Reminder', 'Idea', 'Risk', 'Observation', 'Resource',
  'Decision', 'Insight', 'Architecture', 'Action Item', 'Conclusion'
]);
const MIN_CONFIDENCE = 0.65;

function normalizeType(type) {
  if (typeof type !== 'string') return null;
  const trimmed = type.trim().toLowerCase();
  const canonical = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return ALLOWED_TYPES.has(canonical) ? canonical : null;
}

function normalizeNote(note) {
  if (!note || typeof note !== 'object') return null;

  const type = normalizeType(note.type);
  const title = typeof note.title === 'string' ? note.title.trim() : '';
  const content = typeof note.content === 'string' ? note.content.trim() : '';
  const confidence = Number.parseFloat(note.confidence);

  if (!type || !title || Number.isNaN(confidence) || confidence < MIN_CONFIDENCE) {
    return null;
  }

  return { type, title, content: content || title, confidence };
}

export class GeminiNotesExtraction {
  static async extractNotes(messageText, roomId, authorName, matchedTypes = []) {
    if (!googleAI) {
      console.error('[NOTES EXTRACTION] ❌ No Gemini client available.');
      return [];
    }

    const systemPrompt = `You are a staff-level technical coordinator and project manager note-taking engine.
Your job is to identify note-worthy information from a message and categorize it accurately.

SUPPORTED NOTE TYPES:
- Reminder: a future action, follow-up, or time-based reminder (e.g. "remind me to deploy")
- Idea: a recommendation, future proposal, brainstorm, or speculative improvement
- Risk: a problem, potential issue, security concern, bug, or dangerous concern
- Observation: a fact-based observation, learning, or descriptive finding
- Resource: a reference link, documentation, tutorial, or repository URL
- Decision: a finalized choice, architecture decision, or group consensus
- Insight: a technical discovery, performance observation, or coding tip
- Architecture: database layout, component structure, pipeline flow, or design model notes
- Action Item: an explicit todo or task assignment
- Conclusion: a finalized resolution of a bug or problem

EXTRACTION RULES:
1. semantic understanding: Evaluate the message like an experienced project manager. Do not expect rigid command formats; understand natural human context.
2. Return strictly parsed JSON matching the format below. No markdown blocks. No explanations.
3. If not note-worthy, return {"notes": []}

JSON FORMAT:
{
  "notes": [
    {
      "type": "Reminder" | "Idea" | "Risk" | "Observation" | "Resource" | "Decision" | "Insight" | "Architecture" | "Action Item" | "Conclusion",
      "title": "Short title (under 6 words)",
      "content": "Full description of the note with necessary details",
      "confidence": 0.85
    }
  ]
}

EXAMPLES:
Message: "Let's use PostgreSQL for our database schema to get ACID transactions."
→ {"notes":[{"type":"Architecture","title":"PostgreSQL Database Schema","content":"Migrate primary database to PostgreSQL to ensure ACID transactions for data integrity.","confidence":0.95}]}

Message: "Authentication works now, I fixed the cookie middleware."
→ {"notes":[{"type":"Conclusion","title":"Auth Cookie Fix","content":"Fixed the Auth0 cookie middleware to resolve session hydration errors.","confidence":0.93}]}

Message: "Our architecture will use Next.js, Express, PostgreSQL and Socket.IO"
→ {"notes":[{"type":"Architecture","title":"ThinkRoom Tech Stack","content":"Core tech stack agreed on: Next.js frontend, Express backend, PostgreSQL database, and Socket.IO for realtime synchronization.","confidence":0.97}]}

Message: "React docs explain this."
→ {"notes":[{"type":"Resource","title":"React documentation","content":"React docs explain the approach or behavior.","confidence":0.87}]}

Message: "Hello there"
→ {"notes":[]}`;

    try {
      logger.info('NOTES-EXTRACTION', '📡 Calling Gemini API (model: gemini-2.5-flash)...');

      const model = googleAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const response = await withRetry(() => model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nAnalyze this message for durable notes:\n\nMessage: "${messageText}"\nAuthor: ${authorName || 'Unknown'}\nRoom: ${roomId}\nHints: ${matchedTypes.join(', ') || 'none'}` }] }
        ]
      }));

      const raw = response.response.text();
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
      const normalized = notes.map(normalizeNote).filter(Boolean);
      logger.info('NOTES-EXTRACTION', `` + `✅ Extracted ${normalized.length} valid note(s) from ${notes.length} detected`);
      return normalized;
    } catch (err: any) {
      console.error('[NOTES EXTRACTION] ❌ Gemini API failed:', err.message || err);
      return [];
    }
  }

  static normalizeNote(note) {
    return normalizeNote(note);
  }
}
