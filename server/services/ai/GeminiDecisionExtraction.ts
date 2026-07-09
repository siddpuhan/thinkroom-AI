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

    const systemPrompt = `You are a staff-level technical coordinator and project manager AI document engine.
Your job is to analyze a conversation window and determine if a document, decision, or architectural record candidate should be created, updated, or finalized.

SUPPORTED DOCUMENT TYPES & CATEGORIES:
- "Decision Record": Finalized choices or agreements made by the team. (Map to "Decision Record")
- "Architecture Document": High-level descriptions of software layout, component design, databases, etc. (Map to "Architecture Document")
- "Requirements Document": Feature roadmaps, functional requirements, scope definitions, or project parameters. (Map to "Requirements Document")
- "Technical Design": Code designs, deployment strategies, and technical integration specifications. (Map to "Technical Design")
- "Meeting Summary": Structured summaries of team meetings or workspace catch-ups. (Map to "Meeting Summary")

CRITICAL WORKFLOW RULES:
1. semantic understanding: Analyze the conversation history context and detect if discussions are reaching agreements (status: "confirmed"), are in brainstorming/drafting stages (status: "pending"), or are rejected (status: "rejected").
2. Explicit request: If the user says "@ai generate document" or similar, create the appropriate document type immediately.
3. Keep titles descriptive and content highly detailed.

RESPOND WITH STRICT JSON ONLY (no markdown formatting block, no explanations):
{
  "decisions": [
    {
      "status": "pending" | "confirmed" | "rejected",
      "category": "Decision Record" | "Architecture Document" | "Requirements Document" | "Technical Design" | "Meeting Summary",
      "title": "Document Title",
      "decision": "Detailed contents of what is decided, planned, or designed",
      "reason": "Justification, context, or rationale",
      "alternativesDiscussed": ["Alternative A", "Alternative B"],
      "participants": ["Name1", "Name2"],
      "confidence": 0.85,
      "discussionSummary": "2-3 sentences summarizing the discussion flow",
      "sourceMessageIndices": [1, 2, 3],
      "confirmationPhrases": ["Agreed", "Confirmed"],
      "contradictionDetected": false,
      "contradictionReason": "",
      "hasConsensus": true,
      "finalizable": false,
      "needsMoreDiscussion": true
    }
  ]
}

If no document or decision is found in the conversation window, return: {"decisions": []}`;

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
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nAnalyze this conversation context:\n\n${conversationText}\n\nParticipants: ${participants.join(', ')}` }] }
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

          let dbCategory = 'Decision';
          const incomingCat = decision.category || 'Decision Record';
          if (incomingCat === 'Decision Record') dbCategory = 'Decision';
          else if (incomingCat === 'Architecture Document' || incomingCat === 'Technical Design') dbCategory = 'Architecture';
          else if (incomingCat === 'Requirements Document') dbCategory = 'Requirements';
          else if (incomingCat === 'Meeting Summary') dbCategory = 'Meeting Summary';
          else if (['Decision', 'Requirements', 'Architecture', 'Meeting Summary'].includes(incomingCat)) dbCategory = incomingCat;

          return {
            status: ['pending', 'confirmed', 'rejected'].includes(decision.status) ? decision.status : 'pending',
            category: dbCategory,
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
        .filter((decision) => decision && decision.title && decision.confidence >= 0.5);

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
