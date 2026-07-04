// MemoryBuilder.js — Compiles workspace state into a text index

import { TaskService } from '../tasks/TaskService.js';
import { DecisionService } from '../documents/DecisionService.js';
import { NotesService } from '../notes/NotesService.js';
import { SummaryService } from '../summary/SummaryService.js';
import { DocumentService } from '../documents/DocumentService.js';
import { MemoryCache } from './MemoryCache.js';

const MAX_MEMORY_CHARS = 8000; // Roughly ~2000 tokens for context injection

export class MemoryBuilder {
  static async rebuildMemory(roomId) {
    console.log(`[MEMORY BUILDER] 🏗️ Rebuilding memory for room ${roomId}...`);
    
    try {
      // Fetch all sources concurrently
      const [allTasks, allDecisions, allNotes, allSummaries, allDocs] = await Promise.all([
        TaskService.getTasksByRoom(roomId),
        DecisionService.getByRoom(roomId),
        NotesService.getByRoom(roomId),
        SummaryService.getByRoom(roomId),
        DocumentService.getByRoom(roomId)
      ]);

      // Filter active items
      const pendingTasks = allTasks.filter(t => t.status === 'pending' && !t.is_deleted && !t.is_archived);
      const activeDecisions = allDecisions.filter(d => !d.is_deleted && !d.is_archived);
      const activeNotes = allNotes.filter(n => !n.deleted_at && !n.archived_at);
      const activeSummaries = allSummaries.filter(s => !s.deleted_at && !s.is_archived);
      const activeDocs = allDocs.filter(d => !d.is_deleted && !d.is_archived);

      let memorySections = [];

      // Build Tasks Section
      if (pendingTasks.length > 0) {
        let section = "### Pending Tasks:\n";
        pendingTasks.slice(0, 15).forEach(t => {
          section += `- [${t.priority.toUpperCase()}] ${t.title} (Assigned to: ${t.assigned_to_name || 'Unassigned'})\n`;
        });
        memorySections.push(section);
      }

      // Build Decisions Section
      if (activeDecisions.length > 0) {
        let section = "### Architecture & Decisions:\n";
        activeDecisions.slice(0, 10).forEach(d => {
          section += `- [${d.status.toUpperCase()}] ${d.title}: ${d.description}\n`;
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

      // Build Summaries Section
      if (activeSummaries.length > 0) {
        let section = "### Recent Summaries:\n";
        activeSummaries.slice(0, 3).forEach(s => {
          section += `- [${s.summary_type}] ${s.title}: ${s.content.substring(0, 200)}...\n`;
        });
        memorySections.push(section);
      }

      // Build Docs Section
      if (activeDocs.length > 0) {
        let section = "### Project Documents:\n";
        activeDocs.slice(0, 5).forEach(d => {
          section += `- ${d.title}\n`;
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
