import { AuthService } from '../services/auth/auth.service.js';
import express from "express";
import { createResource, getResources } from "../controllers/resourceController.js";

const router = express.Router();
router.use(AuthService.requireAuth as any);

router.post("/", createResource);
router.get("/", getResources);

export default router;
