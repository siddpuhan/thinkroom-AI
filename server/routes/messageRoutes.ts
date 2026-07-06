import { AuthService } from '../services/auth/auth.service.js';
import express from "express";
import { createMessage, getMessages } from "../controllers/messageController.js";

const router = express.Router();
router.use(AuthService.requireAuth as any);

router.post("/", createMessage);
router.get("/", getMessages);

export default router;
