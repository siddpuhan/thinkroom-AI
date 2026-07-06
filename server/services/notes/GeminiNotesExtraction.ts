import { googleAI, withRetry } from '../../utils/geminiClient.js';
import { logger } from '../../utils/logger.js';

const ALLOWED_TYPES = new Set(['Reminder', 'Idea', 'Risk', 'Observation', 'Resource']);
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

    const systemPrompt = `You are a production-grade AI notes engine embedded in a collaboration workspace.

Your job is to extract concise, durable knowledge from a single message.

SUPPORTED NOTE TYPES:
- Reminder: a future action, follow-up, or time-based prompt
- Idea: a suggestion, feature, or speculative improvement
- Risk: a problem, issue, concern, security risk, or bug
- Observation: a useful factual observation or inference
- Resource: a helpful link, article, docs reference, tutorial, or repository

RULES:
1. Return ONLY strict JSON.
2. Return an empty array if the message is not note-worthy.
3. Create one note per distinct idea when appropriate.
4. Use the matched types as hints, but do not force notes that are not supported by the message.
5. Keep titles short and specific.
6. Keep content useful and slightly more descriptive than the title.
7. Confidence must be between 0.0 and 1.0.

REQUIRED OUTPUT FORMAT (strict JSON, no markdown formatting block):
{
  "notes": [
    {
      "type": "Reminder",
      "title": "Ask Professor",
      "content": "Ask professor tomorrow",
      "confidence": 0.94
    }
  ]
}

EXAMPLES:
Message: "Remind me tomorrow to call the clinic"
→ {"notes":[{"type":"Reminder","title":"Call the clinic","content":"Call the clinic tomorrow","confidence":0.96}]}

Message: "What if we add voice support?"
→ {"notes":[{"type":"Idea","title":"Add voice support","content":"Consider adding voice input and voice UX support.","confidence":0.91}]}

Message: "Authentication may be risky."
→ {"notes":[{"type":"Risk","title":"Authentication risk","content":"Authentication may introduce implementation or security risk.","confidence":0.93}]}

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
