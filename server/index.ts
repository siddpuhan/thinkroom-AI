import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import messageRoutes from "./routes/messageRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import { syncUser } from "./controllers/userController.js";
import { detectPersona } from "./ai/router.js";
import { processPersonaStream } from "./ai/geminiService.js";
import { PrefilterService } from "./services/ai/PrefilterService.js";
import { GeminiExtraction } from "./services/ai/GeminiExtraction.js";
import { TaskService } from "./services/tasks/TaskService.js";
import { DecisionPrefilter } from "./services/ai/DecisionPrefilter.js";
import { GeminiDecisionExtraction } from "./services/ai/GeminiDecisionExtraction.js";
import { DocumentService } from "./services/documents/DocumentService.js";
import { ConversationBuffer } from "./services/ai/ConversationBuffer.js";
import { NotesDispatcher } from "./services/notes/NotesDispatcher.js";
import { NotesService } from "./services/notes/NotesService.js";
import { DecisionWorkflow } from "./services/decisions/DecisionWorkflow.js";
import { SummaryBuilder } from "./services/summary/SummaryBuilder.js";
import { MemoryService } from "./services/memory/MemoryService.js";

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

app.use(cors(corsOptions));
app.use(securityMiddleware);
app.use(httpLogger);
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

app.get("/api/memory/:roomId", async (req, res) => {
  try {
    const info = await MemoryService.getDebugInfo(req.params.roomId);
    res.json({ success: true, ...info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

import { setupSocket } from "./controllers/socketController.js";
import { securityMiddleware } from "./middleware/security.js";
import { httpLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  await connectDB();

  httpServer.on('error', (err) => {
    if ((err as any).code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run this to fix it: Get-Process -Name node | Stop-Process -Force`);
      console.error(`   Or close the other terminal running npm run dev\n`);
      process.exit(1);
    }
    throw err;
  });

  setupSocket(io);
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 ThinkRoom AI Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🧠 Task extraction pipeline active`);
    console.log(`👻 Shadow AI decision pipeline active`);
    console.log(`─────────────────────────────────────\n`);
  });
};

startServer();
app.use(errorHandler);
