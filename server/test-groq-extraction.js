// test-groq-extraction.js — End-to-end extraction test (bypasses socket)
import dotenv from 'dotenv';
dotenv.config();

import { PrefilterService } from './services/ai/PrefilterService.js';
import { GroqExtraction } from './services/ai/GroqExtraction.js';

const testMsg = "Siddharth prepare the excel sheet";
const roomId = "test-room";
const sender = "TestUser";

console.log("=== Full Extraction Pipeline Test ===\n");
console.log(`Message: "${testMsg}"`);
console.log(`Room: ${roomId}\n`);

// Step 1
const pass = PrefilterService.shouldTriggerExtraction(testMsg);
console.log(`Step 1 - Prefilter: ${pass ? "PASS" : "SKIP"}`);
if (!pass) { console.log("ABORTED at prefilter"); process.exit(0); }

// Step 2
console.log("\nStep 2 - Calling Groq...");
try {
  const tasks = await GroqExtraction.extractTasks(testMsg, roomId, sender);
  console.log(`\nGroq returned ${tasks.length} task(s):`);
  tasks.forEach((t, i) => {
    console.log(`  Task ${i + 1}:`);
    console.log(`    title:       "${t.title}"`);
    console.log(`    assigned_to: "${t.assigned_to}"`);
    console.log(`    priority:    "${t.priority}"`);
    console.log(`    confidence:  ${t.confidence}`);
  });
  if (tasks.length === 0) console.log("  (no tasks extracted)");
} catch (err) {
  console.error("ERROR:", err.message);
}
