// GroqDecisionExtraction.js — Groq-powered decision/document extraction from conversation windows.
// Only called AFTER DecisionPrefilter passes. Analyzes 10-20 messages as a conversation.

import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn('[DECISION EXTRACTION] ⚠️ GROQ_API_KEY not set. Decision extraction disabled.');
}

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export class GroqDecisionExtraction {
  /**
   * Analyze a conversation window and extract decisions/documents.
   * @param {Array<{text: string, sender_name: string}>} messageWindow - Recent messages
   * @param {string} roomId
   * @param {string[]} matchedPhrases - Phrases from the prefilter
   * @returns {Promise<Array>} - Array of document objects
   */
  static async analyzeConversation(messageWindow, roomId, matchedPhrases = []) {
    if (!groq) {
      console.error('[DECISION EXTRACTION] ❌ No Groq client available.');
      return [];
    }

    console.log(`[DECISION EXTRACTION] 🚀 Analyzing ${messageWindow.length} messages for decisions`);
    console.log(`[DECISION EXTRACTION] Prefilter phrases: ${matchedPhrases.join(', ')}`);

    // Format the conversation window for the prompt
    const conversationText = messageWindow
      .map((m, i) => `[${i + 1}] ${m.sender_name}: "${m.text}"`)
      .join('\n');

    const participants = [...new Set(messageWindow.map(m => m.sender_name).filter(Boolean))];

    const systemPrompt = `You are an intelligent AI note-taker embedded in a team collaboration workspace.

Your job is to analyze a conversation window and detect if any of the following occurred:
1. A **decision** was finalized (team agreed on something)
2. An **architecture decision** was made (technology, framework, pattern choice)
3. A **meeting conclusion** was reached (summary of discussion outcomes)
4. An **important agreement** was established

CRITICAL RULES:
- A decision requires MULTIPLE people discussing AND agreeing. One person stating a preference is NOT a decision.
- Look for proposal → discussion → agreement → finalization patterns.
- The confidence must reflect how certain the decision is. Speculation or "maybe" = low confidence.
- Only return documents with confidence >= 0.7
- Return EMPTY array if no clear decision/agreement was reached.

RESPOND WITH STRICT JSON ONLY:
{
  "documents": [
    {
      "decisionDetected": true,
      "confidence": 0.92,
      "type": "decision" | "architecture" | "meeting_notes" | "summary",
      "title": "Short descriptive title",
      "summary": "2-3 sentence summary of the discussion",
      "decision": "What was ultimately decided or agreed upon in 1 sentence",
      "reason": "The main justification or reasoning behind the decision",
      "tags": ["#react", "#architecture"],
      "participants": ["Name1", "Name2"],
      "sourceMessageIndices": [3, 5, 7, 8]
    }
  ]
}

If no decision/agreement detected, return: {"documents": []}

EXAMPLES:

Conversation:
[1] Alice: "Should we use PostgreSQL or MongoDB?"
[2] Bob: "PostgreSQL for sure, we need ACID transactions"
[3] Alice: "Agreed, let's go with PostgreSQL"
[4] Bob: "Confirmed, PostgreSQL it is"

→ {"documents": [{"decisionDetected": true, "confidence": 0.95, "type": "architecture", "title": "Database Selection: PostgreSQL", "summary": "The team discussed database options and evaluated PostgreSQL vs MongoDB.", "decision": "PostgreSQL selected as the primary database.", "reason": "Requires ACID transactions for data integrity.", "tags": ["#database", "#postgresql", "#architecture"], "participants": ["Alice", "Bob"], "sourceMessageIndices": [1, 2, 3, 4]}]}

Conversation:
[1] Dave: "Maybe we should use Tailwind"

→ {"documents": []}  (Single message, no discussion/agreement)`;

    try {
      console.log(`[DECISION EXTRACTION] 📡 Calling Groq API...`);

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this conversation for decisions and important agreements:\n\n${conversationText}\n\nParticipants: ${participants.join(', ')}` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const raw = completion.choices?.[0]?.message?.content;
      console.log(`[DECISION EXTRACTION] 📨 Raw response: ${raw?.substring(0, 300)}`);

      if (!raw) return [];

      const parsed = JSON.parse(raw);
      const documents = parsed.documents || [];

      // Filter by confidence threshold
      const validDocs = documents.filter(d => d.confidence >= 0.7 && d.decisionDetected);
      console.log(`[DECISION EXTRACTION] ✅ Extracted ${validDocs.length} valid document(s) from ${documents.length} detected`);

      // Attach source messages
      return validDocs.map(doc => ({
        ...doc,
        participants: doc.participants || participants,
        sourceMessages: (doc.sourceMessageIndices || []).map(i => messageWindow[i - 1]).filter(Boolean),
      }));

    } catch (err) {
      console.error(`[DECISION EXTRACTION] ❌ Groq API failed:`, err.message);
      return [];
    }
  }
}
