// MemoryBuilder.js — Compiles workspace state into a text index

import { TaskService } from '../tasks/TaskService.js';
import { NotesService } from '../notes/NotesService.js';
import { DocumentService } from '../documents/DocumentService.js';
import { MemoryCache } from './MemoryCache.js';

const MAX_MEMORY_CHARS = 8000; // Roughly ~2000 tokens for context injection

export class MemoryBuilder {
  static async rebuildMemory(roomId) {
    console.log(`[MEMORY BUILDER] 🏗️ Rebuilding memory for room ${roomId}...`);
    
    try {
      // Fetch all sources concurrently
      const [allTasks, allNotes, allDocs] = await Promise.all([
        TaskService.getTasksByRoom(roomId),
        NotesService.getByRoom(roomId),
        DocumentService.getByRoom(roomId)
      ]);

      // Filter active items
      const pendingTasks = allTasks.filter(t => t.status === 'pending' && !t.is_deleted && !t.is_archived);
      const activeNotes = allNotes.filter(n => !n.deleted_at && !n.archived_at);
      const activeDocs = allDocs.filter(d => !d.deleted_at && !d.archived);

      let memorySections = [];

      // Build Tasks Section
      if (pendingTasks.length > 0) {
        let section = "### Pending Tasks:\n";
        pendingTasks.slice(0, 15).forEach(t => {
          section += `- [${t.priority.toUpperCase()}] ${t.title} (Assigned to: ${t.assigned_to_name || 'Unassigned'})\n`;
        });
        memorySections.push(section);
      }

      // Build Notes Section
      if (activeNotes.length > 0) {
        let section = "### Project Notes & Ideas:\n";
        activeNotes.slice(0, 15).forEach(n => {
          section += `- [${n.type || 'NOTE'}] ${n.title}\n`;
        });
        memorySections.push(section);
      }

      // Build Docs Section
      if (activeDocs.length > 0) {
        let section = "### Project Documents (Decisions, Summaries, Specs):\n";
        activeDocs.slice(0, 10).forEach(d => {
          section += `- [${d.category}] [${d.status}] ${d.title}: ${d.summary}\n`;
        });
        memorySections.push(section);
      }

      let finalContextString = "";
      if (memorySections.length > 0) {
        finalContextString = "--- ROOM MEMORY CONTEXT ---\n" + memorySections.join('\n');
      } else {
        finalContextString = "--- ROOM MEMORY CONTEXT ---\nNo active workspace items yet.";
      }

      // Enforce character limit
      if (finalContextString.length > MAX_MEMORY_CHARS) {
        finalContextString = finalContextString.substring(0, MAX_MEMORY_CHARS) + "\n...[Memory truncated due to length]";
      }

      const tokenCount = finalContextString.length;
      MemoryCache.set(roomId, finalContextString, tokenCount);

      return { contextString: finalContextString, tokenCount };
    } catch (err) {
      console.error(`[MEMORY BUILDER] ❌ Failed to rebuild memory:`, err.message);
      throw err;
    }
  }
}
