// PrefilterService.js — Lightweight, zero-cost gate before calling Groq
// Purpose: Decide if a message MIGHT contain an actionable task.
// Philosophy: High recall (few false negatives), low cost. False positives = just a Groq call.

const ACTION_VERBS = new Set([
  // Core assignment verbs
  'assign', 'assigned',
  // Meeting / coordination
  'take', 'lead', 'host', 'chair', 'attend', 'join', 'meet',
  'coordinate', 'organize', 'organise', 'manage',
  'present', 'demonstrate', 'conduct',
  // Completion/action verbs
  'todo', 'finish', 'complete', 'completed',
  'fix', 'fixed', 'implement', 'implemented',
  'update', 'updated', 'review', 'reviewed',
  'create', 'created', 'prepare', 'prepared',
  'submit', 'submitted', 'send', 'sent',
  'handle', 'handled', 'check', 'checked',
  'write', 'written', 'build', 'built',
  'deploy', 'deployed', 'test', 'tested',
  'schedule', 'scheduled', 'book', 'booked',
  'follow', 'upload', 'download', 'make',
  'call', 'contact', 'ping', 'reach',
  'approve', 'verify', 'confirm', 'track',
  'buy', 'purchase', 'order', 'collect',
  'report', 'document', 'share', 'add',
  'remove', 'delete', 'move', 'migrate',
]);

// Match deadline-bound phrases OR time-of-day (2pm, 3:30am, 10 am, etc.)
const TIME_INDICATORS = new RegExp(
  '(by tomorrow|by friday|by monday|by tuesday|by wednesday|by thursday|by saturday|by sunday|by today' +
  '|eod|end of day|asap|next week|before \\w+day|this week|tonight|due date|due by|deadline' +
  '|\\b\\d{1,2}(:\\d{2})?\\s*(am|pm)\\b' +   // 2pm, 3:30am, 10 am
  '|\\bon\\s+\\d{1,2}(:\\d{2})?\\s*(am|pm)\\b' + // on 2pm
  '|\\bat\\s+\\d{1,2}(:\\d{2})?\\s*(am|pm)\\b)',  // at 3pm
  'i'
);

const MENTION_REGEX = /@\w+/;

// Matches: "Siddharth prepare..." / "siddharth prepare..." / "od prepare..."
// Case-insensitive, names as short as 2 chars (od, bo, etc.)
const NAME_ASSIGNMENT_REGEX = /^([A-Za-z]{2,})[,\s]+(?:please\s+)?(\w+)/i;

const EXPLICIT_ASSIGNMENT = /(need to|must|should|can you|could you|please|would you|will you|has to|have to|make sure|ensure|don't forget|remember to)/i;

export class PrefilterService {
  static shouldTriggerExtraction(message) {
    if (!message || message.length < 5) return false;

    const normalized = message.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    // Rule 1: @Mention + any action verb
    if (MENTION_REGEX.test(normalized)) {
      if (words.some(w => ACTION_VERBS.has(w))) {
        console.log(`[PREFILTER] ✅ PASS — @mention + action verb`);
        return true;
      }
    }

    // Rule 2: Time-bounded language (includes time-of-day like 2pm)
    if (TIME_INDICATORS.test(normalized)) {
      console.log(`[PREFILTER] ✅ PASS — time indicator detected`);
      return true;
    }

    // Rule 3: Explicit obligation/request language + action verb
    if (EXPLICIT_ASSIGNMENT.test(normalized)) {
      if (words.some(w => ACTION_VERBS.has(w))) {
        console.log(`[PREFILTER] ✅ PASS — explicit assignment language`);
        return true;
      }
    }

    // Rule 4: Direct verb-first imperatives — "Prepare the excel", "Submit the report"
    if (ACTION_VERBS.has(words[0])) {
      console.log(`[PREFILTER] ✅ PASS — imperative verb-first sentence`);
      return true;
    }

    // Rule 5: Name-assignment pattern (case-insensitive, short names ok)
    // "Siddharth prepare...", "od prepare...", "siddharth take..."
    if (NAME_ASSIGNMENT_REGEX.test(message)) {
      const match = NAME_ASSIGNMENT_REGEX.exec(message);
      if (match) {
        const verbCandidate = match[2].toLowerCase();
        if (ACTION_VERBS.has(verbCandidate) || normalized.startsWith('assign')) {
          console.log(`[PREFILTER] ✅ PASS — name-assignment: "${match[1]} ${match[2]}"`);
          return true;
        }
      }
    }

    // Rule 6: Any action verb appears anywhere in a short message (<= 12 words)
    // Catches: "od prepare excel", "take the meeting", etc.
    if (words.length <= 12 && words.some(w => ACTION_VERBS.has(w))) {
      // Require at least one "noun-like" word (not just verbs alone)
      const nonVerbWords = words.filter(w => !ACTION_VERBS.has(w) && w.length > 2);
      if (nonVerbWords.length >= 1) {
        console.log(`[PREFILTER] ✅ PASS — action verb in short message: "${words.find(w => ACTION_VERBS.has(w))}"`);
        return true;
      }
    }

    // Rule 7: Explicit "assign X to Y" pattern
    if (/assign\s+\w+\s+to/i.test(normalized)) {
      console.log(`[PREFILTER] ✅ PASS — "assign X to Y" pattern`);
      return true;
    }

    console.log(`[PREFILTER] ❌ SKIP — no task signal in: "${message.substring(0, 60)}"`);
    return false;
  }
}
