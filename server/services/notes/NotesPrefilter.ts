const NOTE_RULES = [
  { type: 'Reminder', phrases: ['remind me', 'remember', "don't forget", 'dont forget', 'tomorrow', 'next week', 'later', 'schedule'] },
  { type: 'Idea', phrases: ['what if', 'maybe', 'future', 'idea', 'feature', 'could'] },
  { type: 'Risk', phrases: ['issue', 'problem', 'security', 'concern', 'dangerous', 'bug', 'risky'] },
  { type: 'Observation', phrases: ['noticed', 'seems', 'looks', 'observed'] },
  { type: 'Resource', phrases: ['documentation', 'github', 'article', 'tutorial', 'official docs', 'docs'] },
  { type: 'Decision', phrases: ['decided', 'decision', 'we will', 'agreed', 'chose', 'selected', 'approved', 'finalized', 'finalise', 'finalize'] },
  { type: 'Insight', phrases: ['insight', 'technical', 'performance', 'optimization', 'discovered', 'learned', 'found'] },
  { type: 'Architecture', phrases: ['architecture', 'database', 'design', 'layout', 'structure', 'component', 'pipeline', 'flow'] },
  { type: 'Action Item', phrases: ['todo', 'action item', 'need to', 'must do', 'should do', 'task', 'assign'] },
  { type: 'Conclusion', phrases: ['conclusion', 'conclude', 'finally', 'resolved', 'solved', 'fixed', 'closed'] },
];

export class NotesPrefilter {
  static analyze(messageText) {
    const normalizedText = typeof messageText === 'string'
      ? messageText.toLowerCase().replace(/\s+/g, ' ').trim()
      : '';

    if (!normalizedText) {
      return { shouldAnalyze: false, matchedTypes: [], matchedPhrases: [] };
    }

    const matchedTypes = [];
    const matchedPhrases = [];

    for (const rule of NOTE_RULES) {
      const matches = rule.phrases.filter((phrase) => normalizedText.includes(phrase));
      if (matches.length > 0) {
        matchedTypes.push(rule.type);
        matchedPhrases.push(...matches);
      }
    }

    // Keyword matches are used only as hints for the LLM. We do NOT gate the
    // pipeline on them: any substantive message is forwarded to Gemini, which
    // makes the final call on whether something is note-worthy. This keeps
    // note extraction consistent instead of missing messages that lack an
    // exact trigger word.
    const isSubstantive = normalizedText.split(/\s+/).length >= 2 && normalizedText.length >= 8;

    return {
      shouldAnalyze: matchedTypes.length > 0 || isSubstantive,
      matchedTypes,
      matchedPhrases,
    };
  }
}