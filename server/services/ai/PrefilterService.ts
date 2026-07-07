// PrefilterService.js — Lightweight, zero-cost gate before calling Gemini
// Purpose: Decide if a message MIGHT contain an actionable task.
// Philosophy: High recall (few false negatives), low cost. False positives = just a Gemini call.

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
    if (!message || message.trim().length < 2) return false;
    console.log(`[PREFILTER] ✅ PASS — non-empty message passed to Gemini`);
    return true;
  }
}
