// DecisionPrefilter.js — Lightweight gate for the Shadow AI Note-Taker pipeline.
// Detects basic decision, requirements, and design signals in a conversation window.



export class DecisionPrefilter {
  /**
   * Analyzes a conversation window (array of {text, sender_name}) for ANY basic decision signal.
   * Returns { shouldAnalyze: boolean, matchedPhrases: string[], reason: string, category: string }
   */
  static analyze(messageWindow) {
    if (!messageWindow || messageWindow.length === 0) {
      return { shouldAnalyze: false, matchedPhrases: [], reason: 'empty window', category: 'Decision' };
    }

    const combinedText = messageWindow
      .map(m => (m.text || '').toLowerCase())
      .join(' ');

    // Determine category based on quick semantic hints (fallback if Gemini fails)
    let category = 'Decision';
    if (combinedText.includes('architecture') || combinedText.includes('design') || combinedText.includes('database')) {
      category = 'Architecture';
    } else if (combinedText.includes('feature') || combinedText.includes('requirements') || combinedText.includes('scope')) {
      category = 'Requirements';
    }

    console.log(`[DECISION PREFILTER] ✅ PASS — rolling message window passed to Gemini. Preliminary category: ${category}`);
    return { shouldAnalyze: true, matchedPhrases: ['rolling_window'], reason: 'rolling conversation analysis active', category };
  }
}


