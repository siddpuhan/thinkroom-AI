// DecisionPrefilter.js — Lightweight gate for the Shadow AI Note-Taker pipeline.
// Detects basic decision signals in a conversation window, delegating the actual intelligence to Groq.
// Philosophy: Only answer "Should AI analyze this?", not "Was a decision definitely made?".

const DISCUSSION_SIGNALS = [
  "should",
  "think",
  "maybe",
  "better",
  "use",
  "choose",
  "go with",
  "instead",
  "agree",
  "makes sense",
  "what about",
  "moving forward",
  "option",
  "framework",
  "database",
  "frontend",
  "backend"
];

export class DecisionPrefilter {
  /**
   * Analyzes a conversation window (array of {text, sender_name}) for ANY basic decision signal.
   * Returns { shouldAnalyze: boolean, matchedPhrases: string[], reason: string }
   */
  static analyze(messageWindow) {
    if (!messageWindow || messageWindow.length === 0) {
      return { shouldAnalyze: false, matchedPhrases: [], reason: 'empty window' };
    }

    const combinedText = messageWindow
      .map(m => (m.text || '').toLowerCase())
      .join(' ');

    const matchedPhrases = [];
    for (const signal of DISCUSSION_SIGNALS) {
      if (combinedText.includes(signal)) {
        matchedPhrases.push(signal);
      }
    }

    if (matchedPhrases.length > 0) {
      console.log(`[DECISION PREFILTER] ✅ SIGNAL MATCH: "${matchedPhrases.join(', ')}". Delegating to Groq.`);
      return { shouldAnalyze: true, matchedPhrases, reason: 'signal detected' };
    }

    return { shouldAnalyze: false, matchedPhrases: [], reason: 'no decision signals' };
  }
}

