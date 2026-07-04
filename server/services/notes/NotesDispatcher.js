import { NotesPrefilter } from './NotesPrefilter.js';
import { GroqNotesExtraction } from './GroqNotesExtraction.js';
import { NotesService } from './NotesService.js';

export class NotesDispatcher {
  static async process({ messageText, roomId, senderName, io }) {
    const pipelineId = `[NOTES:${Date.now().toString(36)}]`;

    console.log(`${pipelineId} ─────────────────────────────────────`);
    console.log(`${pipelineId} 📥 MESSAGE RECEIVED for notes extraction`);
    console.log(`${pipelineId} Text: "${messageText.substring(0, 120)}"`);
    console.log(`${pipelineId} Room: ${roomId} | Sender: ${senderName}`);

    const prefilter = NotesPrefilter.analyze(messageText);
    if (!prefilter.shouldAnalyze) {
      console.log(`${pipelineId} ⛔ PRE-FILTER: No note signal detected. Skipping Groq.`);
      return;
    }

    console.log(`${pipelineId} ✅ PRE-FILTER: ${prefilter.matchedTypes.join(', ')} (${prefilter.matchedPhrases.join(', ')})`);

    let notes = [];
    try {
      notes = await GroqNotesExtraction.extractNotes(messageText, roomId, senderName, prefilter.matchedTypes);
    } catch (err) {
      console.error(`${pipelineId} ❌ Groq call failed:`, err.message);
      return;
    }

    if (notes.length === 0) {
      console.log(`${pipelineId} ℹ️ No notes detected by Groq.`);
      return;
    }

    for (const noteData of notes) {
      try {
        const isDup = await NotesService.isDuplicate(roomId, noteData.type, noteData.title);
        if (isDup) {
          console.log(`${pipelineId} ⚠️ DUPLICATE: "${noteData.title}" — skipping`);
          continue;
        }

        const newNote = await NotesService.create({
          roomId,
          type: noteData.type,
          title: noteData.title,
          content: noteData.content,
          confidence: noteData.confidence,
          createdBy: senderName || 'AI_SYSTEM',
        });

        console.log(`${pipelineId} ✅ NOTE CREATED: id=${newNote.id} type=${newNote.type} title="${newNote.title}"`);
        io.to(roomId).emit('note_created', newNote);
      } catch (err) {
        console.error(`${pipelineId} ❌ NOTE INSERT FAILED for "${noteData.title}":`, err.message);
      }
    }

    console.log(`${pipelineId} 🏁 PIPELINE COMPLETE`);
    console.log(`${pipelineId} ─────────────────────────────────────`);
  }
}