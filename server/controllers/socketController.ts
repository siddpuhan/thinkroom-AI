import { Server, Socket } from "socket.io";
import { getDB } from "../config/db.js";
import { AuthService } from "../services/auth/auth.service.js";
import { detectPersona } from "../ai/router.js";
import { processPersonaStream } from "../ai/groqService.js";
import { AIWorker } from "../services/ai/AIWorker.js";
import { TaskService } from "../services/tasks/TaskService.js";
import { DocumentService } from "../services/documents/DocumentService.js";
import { ConversationBuffer } from "../services/ai/ConversationBuffer.js";
import { NotesService } from "../services/notes/NotesService.js";
import { SummaryBuilder } from "../services/summary/SummaryBuilder.js";
import { MemoryService } from "../services/memory/MemoryService.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────
// Structured pipeline logging. Every stage of the AI orchestration emits a
// single structured log line so a full message lifecycle can be traced.
// ─────────────────────────────────────────────────────────────────────────
function logStage(stage: string, meta: Record<string, unknown> = {}) {
  logger.info("PIPELINE", JSON.stringify({ stage, ...meta }));
}

export const setupSocket = (io: Server) => {
// ============================================================
// TASK EXTRACTION PIPELINE
// Completely isolated from persona routing and chat rendering.
// Architecture:
//   Message
//   ├── Chat Renderer (immediate broadcast)
//   ├── Persona Router (if @mention)
//   └── Task Detection Pipeline (independent, async)
// ============================================================

// Task extraction is now handled asynchronously by the background AIWorker burst queue.


// ============================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }
    const decoded = await AuthService.verifySocketToken(token);
    (socket as any).user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on("connection", (socket) => {
  console.log(`[SOCKET] 🔌 Client connected: ${socket.id}`);

  // ─── Room Management ───────────────────────────────────────
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`[SOCKET] 🚪 Client ${socket.id} joined room: ${roomId}`);
    socket.to(roomId).emit("peer-joined", { roomId });
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`[SOCKET] 🚶 Client ${socket.id} left room: ${roomId}`);
  });

  // ─── Message Handling ──────────────────────────────────────
  socket.on("send_message", ({ roomId, message }) => {
    logStage("MESSAGE_RECEIVED", { id: message?.id, roomId, sender: message?.sender_name });

    // 1. Immediately broadcast to room (chat rendering)
    io.to(roomId).emit("receive_message", message);
    logStage("MESSAGE_BROADCAST", { id: message?.id, roomId });

    const messageText = (message.text || message.content || '').trim();
    if (!messageText) return;

    const senderName = message.sender_name || 'Unknown';

    // 2. Persona routing (if message starts with @persona)
    const match = detectPersona(messageText);
    if (match) {
      logStage("PERSONA_ROUTED", { roomId, persona: match.persona?.id });
      processPersonaStream(roomId, message.id || Date.now().toString(), match.cleanPrompt, match.persona, io);
      // NOTE: Persona messages do NOT go through task extraction pipeline
      return;
    }

    // 3. Unified Background AI Worker (debounced, non-blocking, asynchronous)
    ConversationBuffer.push(roomId, message);
    AIWorker.enqueueMessage(roomId, {
      id: message.id || Date.now().toString(),
      text: messageText,
      sender_name: senderName,
      user_id: (socket as any).user?.id
    }, io);
  });

  // ─── Task Socket Events ────────────────────────────────────

  // Fetch existing tasks for a room
  socket.on("get_tasks", async ({ roomId }, callback) => {
    console.log(`[SOCKET] 📋 get_tasks requested for room: ${roomId}`);
    try {
      const tasks = await TaskService.getTasksByRoom(roomId);
      // Normalize field names
      const normalized = tasks.map(t => ({
        ...t,
        assignedToName: t.assigned_to_name || null,
      }));
      console.log(`[SOCKET] ✅ Returning ${normalized.length} tasks`);
      if (typeof callback === 'function') callback(normalized);
    } catch (err) {
      console.error(`[SOCKET] ❌ get_tasks error:`, err.message);
      if (typeof callback === 'function') callback([]);
    }
  });

  // Update task status (from UI drag/click)
  socket.on("update_task_status", async ({ taskId, status, roomId, actorId }) => {
    console.log(`[SOCKET] 🔄 update_task_status: task=${taskId} → ${status}`);
    try {
      const updatedTask = await TaskService.updateStatus(taskId, status, actorId);
      io.to(roomId).emit("task_updated", {
        ...updatedTask,
        assignedToName: updatedTask.assigned_to_name || null,
      });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ task_updated emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ update_task_status error:`, err.message);
    }
  });

  // Update task details (title and description)
  socket.on("update_task", async ({ taskId, title, description, roomId }) => {
    console.log(`[SOCKET] 📝 update_task: task=${taskId}`);
    try {
      const updatedTask = await TaskService.update(taskId, { title, description });
      io.to(roomId).emit("task_updated", {
        ...updatedTask,
        assignedToName: updatedTask.assigned_to_name || null,
      });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ task_updated (details) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ update_task error:`, err.message);
    }
  });


  // Soft delete task (move to Trash)
  socket.on("soft_delete_task", async ({ taskId, roomId, actorId }) => {
    console.log(`[SOCKET] 🗑️ soft_delete_task: task=${taskId} in room=${roomId}`);
    try {
      const updatedTask = await TaskService.softDelete(taskId, actorId);
      io.to(roomId).emit("task_updated", {
        ...updatedTask,
        assignedToName: updatedTask.assigned_to_name || null,
      });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ task_updated (soft deleted) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ soft_delete_task error:`, err.message);
    }
  });

  // Restore task from Trash
  socket.on("restore_task", async ({ taskId, roomId, actorId }) => {
    console.log(`[SOCKET] ♻️ restore_task: task=${taskId} in room=${roomId}`);
    try {
      const updatedTask = await TaskService.restore(taskId, actorId);
      io.to(roomId).emit("task_updated", {
        ...updatedTask,
        assignedToName: updatedTask.assigned_to_name || null,
      });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ task_updated (restored) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ restore_task error:`, err.message);
    }
  });

  // Hard delete task permanently
  socket.on("hard_delete_task", async ({ taskId, roomId }) => {
    console.log(`[SOCKET] 🔥 hard_delete_task: task=${taskId} in room=${roomId}`);
    try {
      await TaskService.hardDelete(taskId);
      io.to(roomId).emit("task_deleted", { taskId });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ task_deleted emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ hard_delete_task error:`, err.message);
    }
  });

  // Toggle task archive
  socket.on("toggle_archive_task", async ({ taskId, isArchived, roomId, actorId }) => {
    console.log(`[SOCKET] 📦 toggle_archive_task: task=${taskId} → archived=${isArchived}`);
    try {
      const updatedTask = await TaskService.toggleArchive(taskId, isArchived, actorId);
      io.to(roomId).emit("task_updated", {
        ...updatedTask,
        assignedToName: updatedTask.assigned_to_name || null,
      });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ task_updated (archive toggled) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ toggle_archive_task error:`, err.message);
    }
  });

  // ─── Document Socket Events ─────────────────────────────

  socket.on("get_documents", async ({ roomId }, callback) => {
    console.log(`[SOCKET] 📄 get_documents requested for room: ${roomId}`);
    try {
      const docs = await DocumentService.getByRoom(roomId);
      console.log(`[SOCKET] ✅ Returning ${docs.length} documents`);
      if (typeof callback === 'function') callback(docs);
    } catch (err) {
      console.error(`[SOCKET] ❌ get_documents error:`, err.message);
      if (typeof callback === 'function') callback([]);
    }
  });

  // Soft delete document
  socket.on("soft_delete_document", async ({ docId, roomId }) => {
    console.log(`[SOCKET] 🗑️ soft_delete_document: doc=${docId} in room=${roomId}`);
    try {
      const updatedDoc = await DocumentService.softDelete(docId);
      io.to(roomId).emit("document_updated", updatedDoc);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ document_updated (soft deleted) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ soft_delete_document error:`, err.message);
    }
  });

  // Restore document from Trash
  socket.on("restore_document", async ({ docId, roomId }) => {
    console.log(`[SOCKET] ♻️ restore_document: doc=${docId} in room=${roomId}`);
    try {
      const updatedDoc = await (DocumentService as any).restore(docId);
      io.to(roomId).emit("document_updated", updatedDoc);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ document_updated (restored) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ restore_document error:`, err.message);
    }
  });

  // Hard delete document permanently
  socket.on("hard_delete_document", async ({ docId, roomId }) => {
    console.log(`[SOCKET] 🔥 hard_delete_document: doc=${docId} in room=${roomId}`);
    try {
      await (DocumentService as any).hardDelete(docId);
      io.to(roomId).emit("document_deleted", { docId });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ document_deleted emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ hard_delete_document error:`, err.message);
    }
  });

  // Toggle document archive
  socket.on("toggle_archive_document", async ({ docId, isArchived, roomId }) => {
    console.log(`[SOCKET] 📦 toggle_archive_document: doc=${docId} → archived=${isArchived}`);
    try {
      const updatedDoc = await DocumentService.toggleArchive(docId, isArchived);
      io.to(roomId).emit("document_updated", updatedDoc);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ document_updated (archive toggled) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ toggle_archive_document error:`, err.message);
    }
  });

  // ─── Notes Socket Events ─────────────────────────────────

  socket.on("get_notes", async ({ roomId }, callback) => {
    console.log(`[SOCKET] 📝 get_notes requested for room: ${roomId}`);
    try {
      const notes = await NotesService.getByRoom(roomId);
      console.log(`[SOCKET] ✅ Returning ${notes.length} notes`);
      if (typeof callback === 'function') callback(notes);
    } catch (err) {
      console.error(`[SOCKET] ❌ get_notes error:`, err.message);
      if (typeof callback === 'function') callback([]);
    }
  });

  socket.on("soft_delete_note", async ({ noteId, roomId }) => {
    console.log(`[SOCKET] 🗑️ soft_delete_note: note=${noteId} in room=${roomId}`);
    try {
      const updatedNote = await NotesService.softDelete(noteId);
      io.to(roomId).emit("note_updated", updatedNote);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ note_updated (soft deleted) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ soft_delete_note error:`, err.message);
    }
  });

  socket.on("restore_note", async ({ noteId, roomId }) => {
    console.log(`[SOCKET] ♻️ restore_note: note=${noteId} in room=${roomId}`);
    try {
      const updatedNote = await NotesService.restore(noteId);
      io.to(roomId).emit("note_updated", updatedNote);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ note_updated (restored) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ restore_note error:`, err.message);
    }
  });

  socket.on("hard_delete_note", async ({ noteId, roomId }) => {
    console.log(`[SOCKET] 🔥 hard_delete_note: note=${noteId} in room=${roomId}`);
    try {
      await NotesService.hardDelete(noteId);
      io.to(roomId).emit("note_deleted", { noteId });
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ note_deleted emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ hard_delete_note error:`, err.message);
    }
  });

  socket.on("toggle_archive_note", async ({ noteId, isArchived, roomId }) => {
    console.log(`[SOCKET] 📦 toggle_archive_note: note=${noteId} → archived=${isArchived}`);
    try {
      const updatedNote = await NotesService.toggleArchive(noteId, isArchived);
      io.to(roomId).emit("note_updated", updatedNote);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ note_updated (archive toggled) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ toggle_archive_note error:`, err.message);
    }
  });

  // ─── Summaries Socket Events ─────────────────────────────

  socket.on("request_summary", async ({ roomId, summaryType, requestorName }) => {
    console.log(`[SOCKET] ✨ request_summary: type=${summaryType} in room=${roomId}`);
    try {
      io.to(roomId).emit("summary_generation_status", { status: 'generating', type: summaryType });
      
      const newSummary = await SummaryBuilder.generateSummary(roomId, summaryType, requestorName);
      
      io.to(roomId).emit("document_created", newSummary);
      MemoryService.triggerBackgroundRebuild(roomId);
      console.log(`[SOCKET] ✅ document_created (from summary) emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ request_summary error:`, err.message);
    } finally {
      io.to(roomId).emit("summary_generation_status", { status: 'idle', type: summaryType });
    }
  });

  // ─── Delivery Acknowledgements ─────────────────────────────
  socket.on("message-delivered", ({ clientId, senderSocketId }) => {
    if (!clientId || !senderSocketId) return;
    io.to(senderSocketId).emit("message-delivered", { clientId });
  });

  // ─── WebRTC Signaling ──────────────────────────────────────
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { roomId, offer });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { roomId, answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { roomId, candidate });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] 🔌 Client disconnected: ${socket.id} (${reason})`);
  });
});

};
