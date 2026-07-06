// GeminiDecisionExtraction.ts — Gemini-powered decision/document extraction from conversation windows.
// Only called AFTER DecisionPrefilter passes. Analyzes 10-20 messages as a conversation.

import { googleAI, withRetry } from '../../utils/geminiClient.js';
import dotenv from 'dotenv';
import { logger } from '../../utils/logger.js';
dotenv.config();

export class GeminiDecisionExtraction {
  /**
   * Analyze a conversation window and extract decisions/documents.
   * @param {Array<{text: string, sender_name: string}>} messageWindow - Recent messages
   * @param {string} roomId
   * @param {string[]} matchedPhrases - Phrases from the prefilter
   * @param {object|null} currentCandidate - Existing pending candidate, if any
   * @returns {Promise<Array>} - Array of document objects
   */
  static async analyzeConversation(messageWindow, roomId, matchedPhrases = [], currentCandidate = null) {
    if (!googleAI) {
      console.error('[DECISION EXTRACTION] ❌ No Gemini client available.');
      return [];
    }

    console.log(`[DECISION EXTRACTION] 🚀 Analyzing ${messageWindow.length} messages for decisions via Gemini`);
    console.log(`[DECISION EXTRACTION] Prefilter phrases: ${matchedPhrases.join(', ')}`);

    // Format the conversation window for the prompt
    const conversationText = messageWindow
      .map((m, i) => `[${i + 1}] ${m.sender_name}: "${m.text}"`)
      .join('\n');

    const participants = [...new Set(messageWindow.map(m => m.sender_name).filter(Boolean))];

    const existingCandidateBlock = currentCandidate
      ? `\nCURRENT PENDING CANDIDATE:\n${JSON.stringify({
          title: currentCandidate.title,
          decision: currentCandidate.decision,
          reason: currentCandidate.reason,
          participants: currentCandidate.participants,
          alternativesDiscussed: currentCandidate.alternatives_discussed || currentCandidate.alternativesDiscussed || [],
          confidence: currentCandidate.confidence,
          status: currentCandidate.status,
        })}`
      : '';

    const systemPrompt = `You are a production-grade AI meeting assistant that manages decisions over time.

Your job is to analyze a conversation window and detect whether a decision candidate exists, is evolving, or is final.

CRITICAL RULES:
- A decision candidate begins as PENDING. Never treat the first signal as a final decision.
- Require at least 2 participants and one or more confirmation phrases for CONFIRMED status.
- Confirmation phrases include: agreed, confirmed, approved, settled, locked, finalized, let's proceed, done, fine.
- If contradictions still exist, do NOT finalize. Update the candidate instead.
- If the conversation reverses a prior candidate (for example Tomorrow -> Today -> Tomorrow holiday -> Fine tomorrow), preserve the latest stable resolution.
- Only return CONFIRMED when confidence is above 0.85 and the discussion is stable.
- Return REJECTED when the conversation clearly invalidates the candidate.

RESPOND WITH STRICT JSON ONLY (no markdown formatting block):
{
  "decisions": [
    {
      "status": "pending" | "confirmed" | "rejected",
      "title": "Short descriptive title",
      "decision": "What is currently being decided or has been decided",
      "reason": "The main justification or reasoning behind the decision",
      "alternativesDiscussed": ["Option A", "Option B"],
      "participants": ["Name1", "Name2"],
      "confidence": 0.92,
      "discussionSummary": "2-3 sentence summary of the discussion",
      "sourceMessageIndices": [3, 5, 7, 8],
      "confirmationPhrases": ["Agreed", "Confirmed"],
      "contradictionDetected": false,
      "contradictionReason": "",
      "hasConsensus": true,
      "finalizable": false,
      "needsMoreDiscussion": true
    }
  ]
}

If no decision candidate exists, return: {"decisions": []}

EXAMPLES:

Conversation:
[1] Alice: "Should we use PostgreSQL or MongoDB?"
[2] Bob: "PostgreSQL for sure, we need ACID transactions"
[3] Alice: "Agreed, let's go with PostgreSQL"
[4] Bob: "Confirmed, PostgreSQL it is"

→ {"decisions": [{"status": "confirmed", "confidence": 0.95, "title": "Database Selection: PostgreSQL", "discussionSummary": "The team discussed database options and evaluated PostgreSQL vs MongoDB.", "decision": "PostgreSQL selected as the primary database.", "reason": "Requires ACID transactions for data integrity.", "alternativesDiscussed": ["MongoDB"], "participants": ["Alice", "Bob"], "sourceMessageIndices": [1, 2, 3, 4], "confirmationPhrases": ["Agreed", "Confirmed"], "contradictionDetected": false, "contradictionReason": "", "hasConsensus": true, "finalizable": true, "needsMoreDiscussion": false}]}

Conversation:
[1] Dave: "Maybe we should use Tailwind"

→ {"decisions": []}${existingCandidateBlock}`;

    try {
      logger.info("DECISION-EXTRACTION", `📡 Calling Gemini API (model: gemini-2.5-flash)...`);

      const model = googleAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const response = await withRetry(() => model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nAnalyze this conversation for decisions and evolving decision candidates.\n\n${conversationText}\n\nParticipants: ${participants.join(', ')}` }] }
        ]
      }));

      const raw = response.response.text();
      console.log(`[DECISION EXTRACTION] 📨 Raw response: ${raw?.substring(0, 300)}`);

      if (!raw) return [];

      const parsed = JSON.parse(raw);
      const decisions = parsed.decisions || [];

      const normalized = decisions
        .map((decision) => {
          if (!decision || typeof decision !== 'object') return null;
          const confidence = parseFloat(decision.confidence) || 0;
          const participants = Array.isArray(decision.participants) ? decision.participants : [];
          const sourceMessages = (decision.sourceMessageIndices || []).map(i => messageWindow[i - 1]).filter(Boolean);

          return {
            status: ['pending', 'confirmed', 'rejected'].includes(decision.status) ? decision.status : 'pending',
            title: typeof decision.title === 'string' ? decision.title.trim() : '',
            decision: typeof decision.decision === 'string' ? decision.decision.trim() : '',
            reason: typeof decision.reason === 'string' ? decision.reason.trim() : '',
            alternativesDiscussed: Array.isArray(decision.alternativesDiscussed) ? decision.alternativesDiscussed : [],
            participants,
            confidence,
            discussionSummary: typeof decision.discussionSummary === 'string' ? decision.discussionSummary.trim() : '',
            sourceMessages,
            confirmationPhrases: Array.isArray(decision.confirmationPhrases) ? decision.confirmationPhrases : [],
            contradictionDetected: Boolean(decision.contradictionDetected),
            contradictionReason: typeof decision.contradictionReason === 'string' ? decision.contradictionReason.trim() : '',
            hasConsensus: Boolean(decision.hasConsensus),
            finalizable: Boolean(decision.finalizable),
            needsMoreDiscussion: Boolean(decision.needsMoreDiscussion),
          };
        })
        .filter((decision) => decision && decision.title && decision.confidence >= 0.7);

      console.log(`[DECISION EXTRACTION] ✅ Extracted ${normalized.length} decision candidate(s) from ${decisions.length} detected`);

      return normalized.map((decision) => ({
        ...decision,
        participants: decision.participants.length > 0 ? decision.participants : participants,
      }));

    } catch (err: any) {
      console.error(`[DECISION EXTRACTION] ❌ Gemini API failed:`, err.message);
      return [];
    }
  }
}
