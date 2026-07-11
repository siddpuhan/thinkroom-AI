import { getDB } from "../../config/db.js";
import { groq, withGroqRetry } from "../../utils/groqClient.js";
import { GroqPromptManager } from "./GroqPromptManager.js";
import { GroqJsonParser, GroqPayload } from "./GroqJsonParser.js";
import { TaskService } from "../tasks/TaskService.js";
import { NotesService } from "../notes/NotesService.js";
import { DocumentService } from "../documents/DocumentService.js";
import { logger } from "../../utils/logger.js";
import { Server } from "socket.io";

export class AIWorker {
  // Configurable debounce window in milliseconds (10 seconds)
  private static readonly DEBOUNCE_MS = 10000;
  
  // Track active timers per room
  private static timers = new Map<string, ReturnType<typeof setTimeout>>();
  
  // Track active AbortControllers per room to cancel in-flight requests
  private static abortControllers = new Map<string, AbortController>();

  /**
   * Structured logging helper.
   */
  private static logStage(stage: string, meta: Record<string, unknown> = {}) {
    logger.info("PIPELINE", JSON.stringify({ stage, ...meta }));
  }

  /**
   * Enqueues a message for processing in a specific room.
   * Debounces execution and cancels any in-flight requests.
   */
  static enqueueMessage(
    roomId: string,
    message: { id: string; text: string; sender_name: string; user_id?: string },
    io: Server
  ) {
    this.logStage("MESSAGE_QUEUED", { roomId, messageId: message.id });

    // 1. Cancel existing debounce timer for this room
    if (this.timers.has(roomId)) {
      clearTimeout(this.timers.get(roomId)!);
      this.timers.delete(roomId);
    }

    // 2. Cancel in-flight Groq request for this room
    if (this.abortControllers.has(roomId)) {
      this.logStage("REQUEST_CANCELLED", { roomId });
      this.abortControllers.get(roomId)!.abort();
      this.abortControllers.delete(roomId);
    }

    // 3. Create a new AbortController for the next run
    const abortController = new AbortController();
    this.abortControllers.set(roomId, abortController);

    // 4. Schedule the next burst extraction
    const timer = setTimeout(async () => {
      this.timers.delete(roomId);
      try {
        await this.processBurst(roomId, message.id, message.user_id || null, io, abortController.signal);
      } catch (err: any) {
        if (err.name === "AbortError" || err.message?.includes("aborted")) {
          this.logStage("PIPELINE_ABORTED", { roomId });
        } else {
          this.logStage("PIPELINE_FAILED", { roomId, error: err.message });
        }
      } finally {
        if (this.abortControllers.get(roomId) === abortController) {
          this.abortControllers.delete(roomId);
        }
      }
    }, this.DEBOUNCE_MS);

    this.timers.set(roomId, timer);
  }

  /**
   * Runs the unified Groq AI extraction burst on a conversation window.
   */
  private static async processBurst(
    roomId: string,
    sourceMessageId: string,
    userId: string | null,
    io: Server,
    signal: AbortSignal
  ) {
    if (!groq) {
      logger.warn("AI-WORKER", "Groq client is not configured. Skipping background analysis.");
      return;
    }

    this.logStage("AI_GROQ_STARTED", { roomId, messageId: sourceMessageId });
    io.to(roomId).emit("task_generation_status", { status: "generating" });

    try {
      const pool = getDB();

      // 1. Fetch the last 20 messages for context
      const historyResult = await pool.query(
        `SELECT text, sender_name, created_at FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [roomId]
      );
      const messagesWindow = historyResult.rows.reverse();

      if (messagesWindow.length === 0) {
        this.logStage("AI_GROQ_SKIPPED", { roomId, reason: "empty_window" });
        return;
      }

      // 2. Fetch the rolling summary from the database
      const summaryResult = await pool.query(
        `SELECT content FROM summaries WHERE room_id = $1 LIMIT 1`,
        [roomId]
      );
      const rollingSummary = summaryResult.rows[0]?.content || "";

      // 3. Compile prompt
      const systemPrompt = GroqPromptManager.getSystemPrompt(rollingSummary);
      const userPrompt = GroqPromptManager.formatUserPrompt(messagesWindow);

      // 4. Call Groq with abort signal support
      const completion = await withGroqRetry((retrySignal) => {
        // Blend enqueued abort controller signal with exponential backoff signal if needed
        const activeSignal = signal || retrySignal;
        return groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
          max_tokens: 1500
        }, { signal: activeSignal });
      });

      const rawJson = completion.choices[0]?.message?.content || "";
      this.logStage("AI_GROQ_FINISHED", { roomId, responseLength: rawJson.length });

      if (!rawJson.trim()) {
        throw new Error("Received empty response payload from Groq.");
      }

      // 5. Parse JSON
      const payload: GroqPayload = GroqJsonParser.parse(rawJson);
      this.logStage("PARSER_COMPLETE", { 
        roomId, 
        tasks: payload.tasks?.length || 0, 
        notes: payload.notes?.length || 0, 
        documents: payload.documents?.length || 0,
        hasSummary: !!payload.summary,
        confidence: payload.confidence
      });

      const timestamp = new Date().toISOString();

      // 6. Persist Rolling Summary & emit update event
      if (payload.summary) {
        await pool.query(
          `INSERT INTO summaries (room_id, content, confidence, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (room_id)
           DO UPDATE SET content = EXCLUDED.content, confidence = EXCLUDED.confidence, updated_at = NOW()`,
          [roomId, payload.summary, payload.confidence]
        );
        this.logStage("SUMMARY_SAVED", { roomId });
        io.to(roomId).emit("summary_updated", {
          roomId,
          summary: payload.summary,
          messageId: sourceMessageId,
          timestamp,
          userId
        });
      }

      // 7. Process extracted Tasks (Deduplication + Save + Socket)
      if (payload.tasks && payload.tasks.length > 0) {
        this.logStage("TASKS_FOUND", { count: payload.tasks.length });
        for (const task of payload.tasks) {
          // Lower confidence threshold for conversational tasks
          if (task.confidence < 0.6) continue;

          // Deduplicate: check if a pending task with similar title already exists
          const dupResult = await pool.query(
            `SELECT id FROM tasks WHERE room_id = $1 AND title = $2 AND status = 'pending' AND is_deleted = false LIMIT 1`,
            [roomId, task.title]
          );
          if (dupResult.rows.length > 0) {
            logger.info("AI-WORKER", `Skipped duplicate task: "${task.title}"`);
            continue;
          }

          const newTask = await TaskService.create({
            roomId,
            sourceMessageId: sourceMessageId,
            title: task.title,
            description: "",
            assignedTo: task.assigned_to,
            priority: task.priority,
            status: "pending",
            deadline: task.deadline,
            confidence: task.confidence,
            aiGenerated: true,
            createdBy: "AI_SYSTEM"
          });

          this.logStage("TASK_SAVED", { id: newTask.id, roomId, title: newTask.title });
          
          // Emit socket event ONLY after successful DB insert
          io.to(roomId).emit("task_created", {
            id: newTask.id,
            roomId,
            sourceMessageId,
            title: newTask.title,
            description: newTask.description,
            assignedToName: newTask.assigned_to_name,
            priority: newTask.priority,
            status: newTask.status,
            deadline: newTask.deadline,
            confidence: newTask.confidence,
            aiGenerated: true,
            createdBy: "AI_SYSTEM",
            timestamp,
            userId
          });
        }
      }

      // 8. Process extracted Notes (Deduplication + Save + Socket)
      if (payload.notes && payload.notes.length > 0) {
        this.logStage("NOTES_FOUND", { count: payload.notes.length });
        for (const note of payload.notes) {
          if (note.confidence < 0.6) continue;

          const isDuplicate = await NotesService.isDuplicate(roomId, note.type, note.content);
          if (isDuplicate) {
            logger.info("AI-WORKER", `Skipped duplicate note: "${note.content.substring(0, 30)}..."`);
            continue;
          }

          const newNote = await NotesService.create({
            roomId,
            type: note.type,
            title: note.content.substring(0, 80),
            content: note.content,
            confidence: note.confidence,
            createdBy: "AI_SYSTEM"
          });

          this.logStage("NOTE_SAVED", { id: newNote.id, roomId, type: newNote.type });
          
          // Emit socket event ONLY after successful DB insert
          io.to(roomId).emit("note_created", {
            id: newNote.id,
            roomId,
            sourceMessageId,
            type: newNote.type,
            title: newNote.title,
            content: newNote.content,
            confidence: newNote.confidence,
            timestamp,
            userId
          });
        }
      }

      // 9. Process extracted Documents (Deduplication + Save + Socket)
      if (payload.documents && payload.documents.length > 0) {
        this.logStage("DOCUMENTS_FOUND", { count: payload.documents.length });
        for (const doc of payload.documents) {
          // Lower confidence threshold for documents - generate for meaningful discussions
          if (doc.confidence < 0.65) continue;

          const isDuplicate = await DocumentService.isDuplicate(roomId, doc.title);
          if (isDuplicate) {
            logger.info("AI-WORKER", `Skipped duplicate document: "${doc.title}"`);
            continue;
          }

          const newDoc = await DocumentService.create({
            roomId,
            category: doc.type,
            title: doc.title,
            status: "draft",
            summary: doc.content.substring(0, 200) + "...",
            content: doc.content,
            participants: [],
            sourceMessages: [],
            confidence: doc.confidence
          });

          this.logStage("DOCUMENT_SAVED", { id: newDoc.id, roomId, title: newDoc.title });
          
          // Emit socket event ONLY after successful DB insert
          io.to(roomId).emit("document_created", {
            id: newDoc.id,
            roomId,
            sourceMessageId,
            category: newDoc.category,
            title: newDoc.title,
            status: newDoc.status,
            summary: newDoc.summary,
            content: newDoc.content,
            timestamp,
            userId
          });
        }
      }

      this.logStage("PIPELINE_COMPLETED", { roomId, messageId: sourceMessageId });

    } finally {
      io.to(roomId).emit("task_generation_status", { status: "idle" });
    }
  }
}
