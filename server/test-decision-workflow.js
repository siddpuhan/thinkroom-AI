import dotenv from 'dotenv';

dotenv.config();

import { DecisionWorkflow } from './services/decisions/DecisionWorkflow.js';
import { GroqDecisionExtraction } from './services/ai/GroqDecisionExtraction.js';

const conversation = [
  { text: 'Tomorrow', sender_name: 'Ava' },
  { text: 'Today', sender_name: 'Ben' },
  { text: 'Tomorrow holiday', sender_name: 'Ava' },
  { text: 'Fine tomorrow', sender_name: 'Ben' },
];

console.log('=== Decision Workflow Gate Test ===\n');

const stableCandidate = {
  confidence: 0.91,
  participants: ['Ava', 'Ben'],
  messagesSinceCandidate: 3,
};

const confirmedEvaluation = {
  status: 'confirmed',
  hasConsensus: true,
  contradictionDetected: false,
  confidence: 0.91,
  participants: ['Ava', 'Ben'],
};

const rejectedEvaluation = {
  status: 'confirmed',
  hasConsensus: true,
  contradictionDetected: true,
  confidence: 0.91,
  participants: ['Ava', 'Ben'],
};

console.log(`Finalizable gate (stable): ${DecisionWorkflow.shouldFinalize(stableCandidate, confirmedEvaluation, 'message') ? 'PASS' : 'FAIL'}`);
console.log(`Finalizable gate (contradiction): ${!DecisionWorkflow.shouldFinalize(stableCandidate, rejectedEvaluation, 'message') ? 'PASS' : 'FAIL'}`);

console.log('\n=== Groq Decision Extraction Test ===\n');
try {
  const decisions = await GroqDecisionExtraction.analyzeConversation(conversation, 'test-room', ['tomorrow', 'fine'], null);
  if (!decisions.length) {
    console.log('❌ No decisions returned for the contradiction scenario');
  } else {
    const primary = decisions[0];
    console.log(`Status: ${primary.status}`);
    console.log(`Title: ${primary.title}`);
    console.log(`Decision: ${primary.decision}`);
    console.log(`Confidence: ${primary.confidence}`);
    console.log(`Contradiction detected: ${primary.contradictionDetected ? 'yes' : 'no'}`);
    console.log(`Participants: ${JSON.stringify(primary.participants)}`);
    console.log(`Alternatives: ${JSON.stringify(primary.alternativesDiscussed)}`);
  }
} catch (error) {
  console.error('❌ Groq extraction test failed:', error.message);
}