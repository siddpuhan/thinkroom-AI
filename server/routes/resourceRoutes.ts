import express from "express";
import { createResource, getResources } from "../controllers/resourceController.js";

const router = express.Router();

router.post("/", createResource);
router.get("/", getResources);

export default router;
