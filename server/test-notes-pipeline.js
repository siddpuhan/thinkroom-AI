import dotenv from 'dotenv';

dotenv.config();

import { NotesPrefilter } from './services/notes/NotesPrefilter.js';
import { GroqNotesExtraction } from './services/notes/GroqNotesExtraction.js';

const cases = [
  { message: 'Remind me tomorrow', expected: 'Reminder' },
  { message: 'What if we add voice support?', expected: 'Idea' },
  { message: 'Authentication may be risky.', expected: 'Risk' },
  { message: 'React docs explain this.', expected: 'Resource' },
  { message: 'I noticed the deployment looks stable.', expected: 'Observation' },
];

console.log('=== Notes Prefilter Test ===\n');

for (const testCase of cases) {
  const result = NotesPrefilter.analyze(testCase.message);
  const matched = result.matchedTypes.includes(testCase.expected);
  console.log(`${matched ? '✅' : '❌'} ${testCase.message}`);
  console.log(`   matchedTypes: ${JSON.stringify(result.matchedTypes)}`);
  console.log(`   matchedPhrases: ${JSON.stringify(result.matchedPhrases)}\n`);
}

console.log('=== Notes Normalization Test ===\n');
const normalized = GroqNotesExtraction.normalizeNote({
  type: 'reminder',
  title: 'Ask Professor',
  content: 'Ask professor tomorrow',
  confidence: 0.94,
});

console.log(normalized ? '✅ normalizeNote accepted reminder payload' : '❌ normalizeNote rejected reminder payload');
console.log(JSON.stringify(normalized, null, 2));