import { PERSONA_REGISTRY } from './personas.js';

export function detectPersona(messageText) {
  for (const key in PERSONA_REGISTRY) {
    const persona = PERSONA_REGISTRY[key];
    const regex = new RegExp(persona.tag, 'i');
    if (regex.test(messageText)) {
      const cleanPrompt = messageText.replace(regex, '').trim();
      return { persona, cleanPrompt };
    }
  }
  return null;
}
