import { NotesPrefilter } from './NotesPrefilter.js';
import { GeminiNotesExtraction } from './GeminiNotesExtraction.js';
import { NotesService } from './NotesService.js';

export class NotesDispatcher {
  static async process({ messageText, roomId, senderName, io }) {
    console.log(`[PIPELINE:LOG] NOTES_EXTRACTION_STARTED | Room: ${roomId}`);

    const prefilter = NotesPrefilter.analyze(messageText);
    if (!prefilter.shouldAnalyze) {
      console.log(`[PIPELINE:LOG] NOTES_EXTRACTION_COMPLETED | Room: ${roomId} | Status: Skipped (pre-filter)`);
      return;
    }

    let notes = [];
    try {
      notes = await GeminiNotesExtraction.extractNotes(messageText, roomId, senderName, prefilter.matchedTypes);
    } catch (err: any) {
      console.error(`[PIPELINE:LOG] NOTES_EXTRACTION_FAILED | Room: ${roomId} | Error: ${err.message}`);
      return;
    }

    if (notes.length === 0) {
      console.log(`[PIPELINE:LOG] NOTES_EXTRACTION_COMPLETED | Room: ${roomId} | Status: No notes found`);
      return;
    }

    for (const noteData of notes) {
      try {
        const isDup = await NotesService.isDuplicate(roomId, noteData.type, noteData.title);
        if (isDup) {
          console.log(`[PIPELINE:LOG] NOTES_EXTRACTION_COMPLETED | Room: ${roomId} | Status: Duplicate skipped ("${noteData.title}")`);
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

        console.log(`[PIPELINE:LOG] NOTE_SAVED | ID: ${newNote.id} | Room: ${roomId} | Title: "${newNote.title}"`);
        io.to(roomId).emit('note_created', newNote);
        console.log(`[PIPELINE:LOG] NOTE_EMITTED | ID: ${newNote.id} | Room: ${roomId}`);
      } catch (err: any) {
        console.error(`[PIPELINE:LOG] NOTE_SAVE_FAILED | Room: ${roomId} | Error: ${err.message}`);
      }
    }
  }
}