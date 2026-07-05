import { ConversationBuffer } from '../ai/ConversationBuffer.js';
import { DecisionPrefilter } from '../ai/DecisionPrefilter.js';
import { GroqDecisionExtraction } from '../ai/GroqDecisionExtraction.js';
import { DocumentService } from '../documents/DocumentService.js';

const FINALIZATION_WINDOW_MS = 18_000;
const MIN_CONFIDENCE = 0.85;
const MIN_PARTICIPANTS = 2;
const MIN_MESSAGES_AFTER_CANDIDATE = 3;

const roomState = new Map();

function ensureState(roomId) {
  if (!roomState.has(roomId)) {
    roomState.set(roomId, {
      candidate: null,
      messagesSinceCandidate: 0,
      timer: null,
      lastActivityAt: 0,
    });
  }

  return roomState.get(roomId);
}

function clearTimer(state) {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

function serializeSourceMessages(messages) {
  return Array.isArray(messages)
    ? messages.map((msg) => ({
        text: msg.text || '',
        sender_name: msg.sender_name || 'Unknown',
        sender_id: msg.sender_id || null,
        timestamp: msg.timestamp || Date.now(),
      }))
    : [];
}

export class DecisionWorkflow {
  static shouldFinalize(candidate, evaluation, reason = 'message') {
    const participants = Array.isArray(evaluation.participants) ? evaluation.participants.filter(Boolean) : [];
    const hasConsensus = Boolean(evaluation.hasConsensus ?? true);
    const noContradiction = !Boolean(evaluation.contradictionDetected);
    const confidence = Number.parseFloat(evaluation.confidence || candidate?.confidence || 0) || 0;
    const enoughMessages = reason === 'inactivity' || (candidate?.messagesSinceCandidate || 0) >= MIN_MESSAGES_AFTER_CANDIDATE;

    return (
      evaluation.status === 'confirmed' &&
      hasConsensus &&
      noContradiction &&
      confidence >= MIN_CONFIDENCE &&
      participants.length >= MIN_PARTICIPANTS &&
      enoughMessages
    );
  }

  static async loadActiveCandidate(roomId) {
    // We match the topic by finding the latest draft Decision
    return DocumentService.findDraftForTopic(roomId, 'Decision');
  }

  static async observeMessage({ roomId, message, io }) {
    const state = ensureState(roomId);
    state.lastActivityAt = Date.now();

    clearTimer(state);
    state.timer = setTimeout(() => {
      this.reviewCandidate({ roomId, io, reason: 'inactivity' }).catch((err) => {
        console.error(`[DECISION WORKFLOW] ❌ inactivity review failed:`, err.message);
      });
    }, FINALIZATION_WINDOW_MS);

    const window = ConversationBuffer.getWindow(roomId);
    const activeCandidate = state.candidate || await this.loadActiveCandidate(roomId);

    if (!activeCandidate) {
      const filterResult = DecisionPrefilter.analyze(window);
      if (!filterResult.shouldAnalyze) {
        return;
      }

      await this.createCandidate(roomId, io, window, filterResult.matchedPhrases);
      return;
    }

    state.candidate = activeCandidate;
    state.messagesSinceCandidate += 1;

    await this.reviewCandidate({ roomId, io, reason: 'message' });
  }

  static async createCandidate(roomId, io, window, matchedPhrases = []) {
    io.to(roomId).emit('decision_analysis_status', { status: 'analyzing' });

    try {
      const evaluations = await GroqDecisionExtraction.analyzeConversation(window, roomId, matchedPhrases, null);
      const evaluation = evaluations[0];

      if (!evaluation || evaluation.status === 'rejected') {
        io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
        return;
      }

      // Convert evaluation details into document content/summary
      const contentObj = {
        decision: evaluation.decision || '',
        reason: evaluation.reason || '',
        alternativesDiscussed: evaluation.alternativesDiscussed || [],
      };

      const created = await DocumentService.create({
        roomId,
        category: 'Decision',
        title: evaluation.title,
        status: 'draft',
        summary: evaluation.discussionSummary || '',
        content: JSON.stringify(contentObj),
        participants: evaluation.participants || [],
        sourceMessages: serializeSourceMessages(evaluation.sourceMessages || []),
        confidence: evaluation.confidence || 0,
      });

      const state = ensureState(roomId);
      state.candidate = { ...created, messagesSinceCandidate: 0 };
      state.messagesSinceCandidate = 0;

      io.to(roomId).emit('document_created', created);
      console.log(`[DECISION WORKFLOW] ✅ Draft Decision created: ${created.title}`);
    } finally {
      io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
    }
  }

  static async reviewCandidate({ roomId, io, reason = 'message' }) {
    const state = ensureState(roomId);
    const candidate = state.candidate || await this.loadActiveCandidate(roomId);

    if (!candidate) {
      return;
    }

    state.candidate = candidate;

    const window = ConversationBuffer.getWindow(roomId);
    const filterResult = DecisionPrefilter.analyze(window);

    io.to(roomId).emit('decision_analysis_status', { status: 'analyzing' });

    try {
      // Decode content for candidate comparison
      let candidateContent = {};
      try {
        candidateContent = JSON.parse(candidate.content || '{}');
      } catch (e) {}

      const legacyCandidate = {
        title: candidate.title,
        decision: candidateContent.decision || '',
        reason: candidateContent.reason || '',
        participants: candidate.participants,
        alternatives_discussed: candidateContent.alternativesDiscussed || [],
        source_messages: candidate.source_messages,
        discussion_summary: candidate.summary,
        confidence: candidate.confidence
      };

      const evaluations = await GroqDecisionExtraction.analyzeConversation(
        window,
        roomId,
        filterResult.matchedPhrases,
        legacyCandidate
      );

      const evaluation = evaluations[0];
      if (!evaluation) {
        io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
        return;
      }

      const updatedContent = JSON.stringify({
        decision: evaluation.decision || legacyCandidate.decision,
        reason: evaluation.reason || legacyCandidate.reason,
        alternativesDiscussed: evaluation.alternativesDiscussed || legacyCandidate.alternatives_discussed || [],
      });

      if (evaluation.status === 'rejected' || evaluation.contradictionDetected) {
        // Soft delete the draft document since it was rejected
        const rejected = await DocumentService.softDelete(candidate.id);

        state.candidate = null;
        state.messagesSinceCandidate = 0;
        clearTimer(state);
        io.to(roomId).emit('document_deleted', { id: candidate.id });
        io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
        return;
      }

      const updated = await DocumentService.update(candidate.id, {
        title: evaluation.title || candidate.title,
        status: 'updating',
        summary: evaluation.discussionSummary || candidate.summary || '',
        content: updatedContent,
        participants: evaluation.participants || candidate.participants,
        source_messages: serializeSourceMessages(evaluation.sourceMessages || candidate.source_messages || []),
        confidence: evaluation.confidence || candidate.confidence || 0,
      });

      state.candidate = { ...updated, messagesSinceCandidate: (state.messagesSinceCandidate || 0) };
      io.to(roomId).emit('document_updated', updated);

      if (this.shouldFinalize({ ...updated, messagesSinceCandidate: state.messagesSinceCandidate }, evaluation, reason)) {
        await this.finalizeCandidate(roomId, io, updated, evaluation);
      }
    } finally {
      io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
    }
  }

  static async finalizeCandidate(roomId, io, candidate, evaluation) {
    const updatedContent = JSON.stringify({
      decision: evaluation.decision || '',
      reason: evaluation.reason || '',
      alternativesDiscussed: evaluation.alternativesDiscussed || [],
    });

    const finalizedDocument = await DocumentService.update(candidate.id, {
      title: evaluation.title || candidate.title,
      status: 'final',
      summary: evaluation.discussionSummary || candidate.summary || '',
      content: updatedContent,
      participants: evaluation.participants || candidate.participants,
      source_messages: serializeSourceMessages(evaluation.sourceMessages || candidate.source_messages || []),
      confidence: evaluation.confidence || candidate.confidence || 0,
    });

    const state = ensureState(roomId);
    state.candidate = null;
    state.messagesSinceCandidate = 0;
    clearTimer(state);

    io.to(roomId).emit('document_updated', finalizedDocument);
    io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
  }

  static clearRoom(roomId) {
    const state = roomState.get(roomId);
    if (!state) return;
    clearTimer(state);
    roomState.delete(roomId);
  }
}