const NOTE_RULES = [
  { type: 'Reminder', phrases: ['remind me', 'remember', "don't forget", 'dont forget', 'tomorrow', 'next week', 'later', 'schedule'] },
  { type: 'Idea', phrases: ['what if', 'maybe', 'future', 'idea', 'feature', 'could'] },
  { type: 'Risk', phrases: ['issue', 'problem', 'security', 'concern', 'dangerous', 'bug', 'risky'] },
  { type: 'Observation', phrases: ['noticed', 'seems', 'looks', 'observed'] },
  { type: 'Resource', phrases: ['documentation', 'github', 'article', 'tutorial', 'official docs', 'docs'] },
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

    return { shouldAnalyze: matchedTypes.length > 0, matchedTypes, matchedPhrases };
  }
}