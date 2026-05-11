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
import { processThinkRoomAI } from "./controllers/aiController.js";



const corsOptions = {
  origin: true,
  credentials: true
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});
const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Disaster Connect backend is running",
  });
});

app.use("/api/messages", messageRoutes);
app.use("/api/resources", resourceRoutes);
app.post("/api/users/sync", syncUser);

const sanitizeMessagePayload = (messageData) => {
  if (!messageData || typeof messageData !== "object" || Array.isArray(messageData)) {
    return null;
  }

  const sanitized = {};

  if (typeof messageData.content === "string") {
    const content = messageData.content.trim();
    if (content) sanitized.content = content;
  }

  if (typeof messageData.text === "string") {
    const text = messageData.text.trim();
    if (text) sanitized.text = text;
  }

  if (typeof messageData.sender === "string") {
    const sender = messageData.sender.trim();
    if (sender) sanitized.sender = sender;
  }

  if (typeof messageData.room === "string") {
    const room = messageData.room.trim();
    if (room) sanitized.room = room;
  }

  if (typeof messageData.id !== "undefined") {
    sanitized.id = messageData.id;
  }

  if (typeof messageData.clientId === "string") {
    sanitized.clientId = messageData.clientId;
  }

  if (typeof messageData.status === "string") {
    sanitized.status = messageData.status;
  }

  if (typeof messageData.timestamp === "string") {
    sanitized.timestamp = messageData.timestamp;
  }

  if (!sanitized.text && !sanitized.content) {
    return null;
  }

  return sanitized;
};

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("send_message", ({ roomId, message }) => {
    io.to(roomId).emit("receive_message", message);

    // Vibe Check: If message starts with @ai, trigger ThinkRoom AI
    const messageText = message.text || message.content;
    if (messageText && messageText.trim().startsWith('@ai')) {
      processThinkRoomAI(roomId, messageText, io);
    }
  });

  socket.on("message-delivered", ({ clientId, senderSocketId }) => {
    if (!clientId || !senderSocketId) {
      return;
    }
    io.to(senderSocketId).emit("message-delivered", { clientId });
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("peer-joined", { roomId });
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { roomId, offer });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { roomId, answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { roomId, candidate });
  });
});

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
