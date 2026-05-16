// test-prefilter.js — Quick diagnostic test
import dotenv from 'dotenv';
dotenv.config();

import { PrefilterService } from './services/ai/PrefilterService.js';

const testMessages = [
  // Previously passing
  "Siddharth prepare the excel sheet.",
  "Assign Siddharth to complete authentication.",
  "siddharth please prepare excel for todays meeting",
  "Siddharth prepare the excel sheet",
  // False positive check
  "How are you today?",
  // The exact messages that FAILED in production logs
  "siddharth take meeting on 2pm",
  "od prepare a excel sheet",
  "od prepare excel sheet",
  // Extra edge cases
  "take meeting at 3pm",
  "siddharth submit report by eod",
  "OD build the dashboard",
];

console.log("=== PrefilterService Test ===\n");
testMessages.forEach(msg => {
  const result = PrefilterService.shouldTriggerExtraction(msg);
  const icon = result ? "✅ PASS" : "❌ SKIP";
  console.log(`${icon}  "${msg}"\n`);
});
