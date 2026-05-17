import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import messageRoutes from "./routes/messageRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import { syncUser } from "./controllers/userController.js";
import { detectPersona } from "./ai/router.js";
import { processPersonaStream } from "./ai/groqService.js";
import { PrefilterService } from "./services/ai/PrefilterService.js";
import { GroqExtraction } from "./services/ai/GroqExtraction.js";
import { TaskService } from "./services/tasks/TaskService.js";
import { DecisionPrefilter } from "./services/ai/DecisionPrefilter.js";
import { GroqDecisionExtraction } from "./services/ai/GroqDecisionExtraction.js";
import { DocumentService } from "./services/documents/DocumentService.js";
import { DecisionService } from "./services/documents/DecisionService.js";
import { ConversationBuffer } from "./services/ai/ConversationBuffer.js";

// ============================================================
// SERVER SETUP
// ============================================================

const corsOptions = {
  origin: true,
  credentials: true
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});
const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ThinkRoom AI backend is running",
  });
});

app.use("/api/messages", messageRoutes);
app.use("/api/resources", resourceRoutes);
app.post("/api/users/sync", syncUser);

// ============================================================
// TASK EXTRACTION PIPELINE
// Completely isolated from persona routing and chat rendering.
// Architecture:
//   Message
//   ├── Chat Renderer (immediate broadcast)
//   ├── Persona Router (if @mention)
//   └── Task Detection Pipeline (independent, async)
// ============================================================

async function runTaskExtractionPipeline(messageText, roomId, senderName, sourceMessageId) {
  const pipelineId = `[PIPELINE:${Date.now().toString(36)}]`;
  
  console.log(`${pipelineId} ─────────────────────────────────────`);
  console.log(`${pipelineId} 📥 MESSAGE RECEIVED for extraction`);
  console.log(`${pipelineId} Text: "${messageText.substring(0, 120)}"`);
  console.log(`${pipelineId} Room: ${roomId} | Sender: ${senderName}`);

  // STEP 1: Pre-filter gate (no Groq call yet)
  const shouldExtract = PrefilterService.shouldTriggerExtraction(messageText);
  if (!shouldExtract) {
    console.log(`${pipelineId} ⛔ PRE-FILTER: No task signal detected. Skipping Groq.`);
    return;
  }
  console.log(`${pipelineId} ✅ PRE-FILTER: Task signal detected. Proceeding to Groq.`);

  // STEP 2: Groq extraction
  console.log(`${pipelineId} 🧠 EXTRACTION: Calling Groq API...`);
  let extractedTasks = [];
  try {
    extractedTasks = await GroqExtraction.extractTasks(messageText, roomId, senderName);
  } catch (err) {
    console.error(`${pipelineId} ❌ EXTRACTION: Groq call failed:`, err.message);
    return;
  }

  console.log(`${pipelineId} 📋 EXTRACTION: Got ${extractedTasks.length} task(s) from Groq`);

  if (extractedTasks.length === 0) {
    console.log(`${pipelineId} ℹ️ EXTRACTION: No actionable tasks found. Done.`);
    return;
  }

  // STEP 3: Persist each task and emit socket events
  for (const taskData of extractedTasks) {
    console.log(`${pipelineId} 💾 DB INSERT: "${taskData.title}" | assigned: ${taskData.assigned_to} | priority: ${taskData.priority} | confidence: ${taskData.confidence}`);
    
    try {
      const newTask = await TaskService.create({
        roomId,
        sourceMessageId: sourceMessageId || null,
        title: taskData.title,
        description: taskData.description || '',
        assignedTo: taskData.assigned_to || null,
        priority: taskData.priority || 'medium',
        status: 'pending',
        deadline: taskData.deadline || null,
        confidence: taskData.confidence || 0.7,
        aiGenerated: true,
        createdBy: 'AI_SYSTEM'
      });

      console.log(`${pipelineId} ✅ DB INSERT SUCCESS: Task id=${newTask.id}`);

      // STEP 4: Emit task_created to all room members
      console.log(`${pipelineId} 📡 SOCKET EMIT: task_created → room "${roomId}"`);
      io.to(roomId).emit("task_created", {
        ...newTask,
        // Normalize field names for frontend compatibility
        assignedToName: newTask.assigned_to_name || null,
      });
      console.log(`${pipelineId} ✅ SOCKET EMIT: task_created sent successfully`);

    } catch (dbErr) {
      console.error(`${pipelineId} ❌ DB INSERT FAILED for task "${taskData.title}":`, dbErr.message);
      if (dbErr.code) console.error(`${pipelineId} Error code: ${dbErr.code}`);
      if (dbErr.detail) console.error(`${pipelineId} Error detail: ${dbErr.detail}`);
    }
  }

  console.log(`${pipelineId} 🏁 PIPELINE COMPLETE`);
  console.log(`${pipelineId} ─────────────────────────────────────`);
}

// ============================================================
// SHADOW AI DECISION PIPELINE
// Analyzes conversation windows for decisions, agreements, and notes.
// Runs DEBOUNCED — only fires after 8 seconds of quiet.
// ============================================================

async function runDecisionPipeline(roomId, messageWindow) {
  const pipelineId = `[DECISION:${Date.now().toString(36)}]`;

  console.log(`${pipelineId} ─────────────────────────────────────`);
  console.log(`${pipelineId} 🧠 SHADOW AI analyzing ${messageWindow.length} messages in room "${roomId}"`);

  // STEP 1: Decision prefilter
  const filterResult = DecisionPrefilter.analyze(messageWindow);
  if (!filterResult.shouldAnalyze) {
    console.log(`${pipelineId} ⛔ PREFILTER: ${filterResult.reason}`);
    console.log(`${pipelineId} ─────────────────────────────────────`);
    return;
  }
  console.log(`${pipelineId} ✅ PREFILTER: ${filterResult.reason} (${filterResult.matchedPhrases.join(', ')})`);

  // STEP 2: Groq analysis
  let documents = [];
  try {
    documents = await GroqDecisionExtraction.analyzeConversation(
      messageWindow, roomId, filterResult.matchedPhrases
    );
  } catch (err) {
    console.error(`${pipelineId} ❌ Groq analysis failed:`, err.message);
    console.log(`${pipelineId} ─────────────────────────────────────`);
    return;
  }

  if (documents.length === 0) {
    console.log(`${pipelineId} ℹ️ No decisions detected by Groq.`);
    console.log(`${pipelineId} ─────────────────────────────────────`);
    return;
  }

  // STEP 3: Persist and emit
  for (const doc of documents) {
    try {
      const isDup = await DocumentService.isDuplicate(roomId, doc.title);
      if (isDup) {
        console.log(`${pipelineId} ⚠️ DUPLICATE: "${doc.title}" — skipping`);
        continue;
      }

      const structuredContent = JSON.stringify({
        decision: doc.decision || '',
        reason: doc.reason || '',
        tags: doc.tags || []
      });

      const newDoc = await DocumentService.create({
        roomId,
        title: doc.title,
        content: structuredContent,
        summary: doc.summary || '',
        type: doc.type || 'decision',
        participants: doc.participants || [],
        sourceMessages: doc.sourceMessages || [],
        confidence: doc.confidence || 0.7,
      });

      console.log(`${pipelineId} ✅ DOC CREATED: id=${newDoc.id} type=${newDoc.type} title="${newDoc.title}"`);
      io.to(roomId).emit('document_created', newDoc);
      console.log(`${pipelineId} 📡 SOCKET EMIT: document_created → room "${roomId}"`);

      // 3.b Create lightweight decision timeline record
      const newDecision = await DecisionService.create({
        roomId,
        title: doc.title,
        decision: doc.decision || doc.summary || '',
        reason: doc.reason || '',
        participants: doc.participants || [],
      });
      io.to(roomId).emit('decision_created', newDecision);
      console.log(`${pipelineId} 📡 SOCKET EMIT: decision_created → room "${roomId}"`);

    } catch (dbErr) {
      console.error(`${pipelineId} ❌ DB INSERT FAILED: "${doc.title}":`, dbErr.message);
    }
  }

  console.log(`${pipelineId} 🏁 DECISION PIPELINE COMPLETE`);
  console.log(`${pipelineId} ─────────────────────────────────────`);
}

// ============================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================

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
    console.log(`[SOCKET] 💬 Message received in room "${roomId}" from ${message?.sender_name}`);
    
    // 1. Immediately broadcast to room (chat rendering)
    io.to(roomId).emit("receive_message", message);
    console.log(`[SOCKET] 📤 Message broadcast to room`);

    const messageText = (message.text || message.content || '').trim();
    if (!messageText) return;

    const senderName = message.sender_name || 'Unknown';

    // 2. Persona routing (if message starts with @persona)
    const match = detectPersona(messageText);
    if (match) {
      console.log(`[SOCKET] 🎭 Persona match: ${match.persona?.id} — routing to persona handler`);
      processPersonaStream(roomId, message.id || Date.now().toString(), match.cleanPrompt, match.persona, io);
      // NOTE: Persona messages do NOT go through task extraction pipeline
      return;
    }

    // 3. Task extraction pipeline (async, non-blocking, completely isolated)
    // Runs ONLY on non-persona messages
    console.log(`[SOCKET] 🔍 Routing to task extraction pipeline...`);
    setImmediate(() => {
      runTaskExtractionPipeline(messageText, roomId, senderName, message.id || null)
        .catch(err => console.error(`[SOCKET] ❌ Task pipeline unhandled error:`, err));
    });

    // 4. Shadow AI — push to conversation buffer + schedule decision analysis
    ConversationBuffer.push(roomId, message);
    
    // We always use scheduleAnalysis (8-second debounce). 
    // This allows users to finish typing their thoughts before we send the window to Groq.
    ConversationBuffer.scheduleAnalysis(roomId, (rid, window) => {
      runDecisionPipeline(rid, window)
        .catch(err => console.error(`[SOCKET] ❌ Decision pipeline error:`, err));
    });
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
      console.log(`[SOCKET] ✅ task_updated emitted to room ${roomId}`);
    } catch (err) {
      console.error(`[SOCKET] ❌ update_task_status error:`, err.message);
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

  socket.on("get_decisions", async ({ roomId }, callback) => {
    console.log(`[SOCKET] ⚡ get_decisions requested for room: ${roomId}`);
    try {
      const decisions = await DecisionService.getByRoom(roomId);
      console.log(`[SOCKET] ✅ Returning ${decisions.length} decisions`);
      if (typeof callback === 'function') callback(decisions);
    } catch (err) {
      console.error(`[SOCKET] ❌ get_decisions error:`, err.message);
      if (typeof callback === 'function') callback([]);
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

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  await connectDB();

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run this to fix it: Get-Process -Name node | Stop-Process -Force`);
      console.error(`   Or close the other terminal running npm run dev\n`);
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 ThinkRoom AI Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🧠 Task extraction pipeline active`);
    console.log(`👻 Shadow AI decision pipeline active`);
    console.log(`─────────────────────────────────────\n`);
  });
};

startServer();
