import { ConversationBuffer } from '../ai/ConversationBuffer.js';
import { DecisionPrefilter } from '../ai/DecisionPrefilter.js';
import { GroqDecisionExtraction } from '../ai/GroqDecisionExtraction.js';
import { DecisionService } from '../documents/DecisionService.js';
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
    return DecisionService.getLatestPending(roomId);
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

      const created = await DecisionService.create({
        roomId,
        title: evaluation.title,
        decision: evaluation.decision || '',
        reason: evaluation.reason || '',
        participants: evaluation.participants || [],
        alternativesDiscussed: evaluation.alternativesDiscussed || [],
        sourceMessages: serializeSourceMessages(evaluation.sourceMessages || []),
        discussionSummary: evaluation.discussionSummary || '',
        confidence: evaluation.confidence || 0,
        status: 'pending',
        createdBy: evaluation.participants?.[0] || 'AI_SYSTEM',
      });

      const state = ensureState(roomId);
      state.candidate = { ...created, messagesSinceCandidate: 0 };
      state.messagesSinceCandidate = 0;

      io.to(roomId).emit('decision_candidate_detected', created);
      io.to(roomId).emit('decision_created', created);
      console.log(`[DECISION WORKFLOW] ✅ Pending decision candidate created: ${created.title}`);
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
      const evaluations = await GroqDecisionExtraction.analyzeConversation(
        window,
        roomId,
        filterResult.matchedPhrases,
        candidate
      );

      const evaluation = evaluations[0];
      if (!evaluation) {
        io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
        return;
      }

      if (evaluation.status === 'rejected' || evaluation.contradictionDetected) {
        const rejected = await DecisionService.update(candidate.decision_id, {
          title: evaluation.title || candidate.title,
          decision: evaluation.decision || candidate.decision,
          reason: evaluation.reason || candidate.reason,
          participants: evaluation.participants || candidate.participants,
          alternativesDiscussed: evaluation.alternativesDiscussed || candidate.alternatives_discussed || [],
          sourceMessages: serializeSourceMessages(evaluation.sourceMessages || candidate.source_messages || []),
          discussionSummary: evaluation.discussionSummary || candidate.discussion_summary || '',
          confidence: evaluation.confidence || candidate.confidence || 0,
          status: 'rejected',
          updatedBy: 'AI_SYSTEM',
          isDeleted: true,
          deletedAt: new Date(),
          rejectedAt: new Date(),
        });

        state.candidate = null;
        state.messagesSinceCandidate = 0;
        clearTimer(state);
        io.to(roomId).emit('decision_rejected', rejected);
        io.to(roomId).emit('decision_updated', rejected);
        io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
        return;
      }

      const updated = await DecisionService.update(candidate.decision_id, {
        title: evaluation.title || candidate.title,
        decision: evaluation.decision || candidate.decision,
        reason: evaluation.reason || candidate.reason,
        participants: evaluation.participants || candidate.participants,
        alternativesDiscussed: evaluation.alternativesDiscussed || candidate.alternatives_discussed || [],
        sourceMessages: serializeSourceMessages(evaluation.sourceMessages || candidate.source_messages || []),
        discussionSummary: evaluation.discussionSummary || candidate.discussion_summary || '',
        confidence: evaluation.confidence || candidate.confidence || 0,
        status: 'pending',
        updatedBy: 'AI_SYSTEM',
      });

      state.candidate = { ...updated, messagesSinceCandidate: (state.messagesSinceCandidate || 0) };
      io.to(roomId).emit('decision_candidate_updated', updated);
      io.to(roomId).emit('decision_updated', updated);

      if (this.shouldFinalize({ ...updated, messagesSinceCandidate: state.messagesSinceCandidate }, evaluation, reason)) {
        await this.finalizeCandidate(roomId, io, updated, evaluation);
      }
    } finally {
      io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
    }
  }

  static async finalizeCandidate(roomId, io, candidate, evaluation) {
    const finalizedDecision = await DecisionService.update(candidate.decision_id, {
      title: evaluation.title || candidate.title,
      decision: evaluation.decision || candidate.decision,
      reason: evaluation.reason || candidate.reason,
      participants: evaluation.participants || candidate.participants,
      alternativesDiscussed: evaluation.alternativesDiscussed || candidate.alternatives_discussed || [],
      sourceMessages: serializeSourceMessages(evaluation.sourceMessages || candidate.source_messages || []),
      discussionSummary: evaluation.discussionSummary || candidate.discussion_summary || '',
      confidence: evaluation.confidence || candidate.confidence || 0,
      status: 'confirmed',
      updatedBy: 'AI_SYSTEM',
      finalizedAt: new Date(),
    });

    const finalDocument = await DocumentService.create({
      roomId,
      title: finalizedDecision.title,
      content: JSON.stringify({
        decision: finalizedDecision.decision || '',
        reason: finalizedDecision.reason || '',
        alternativesDiscussed: finalizedDecision.alternatives_discussed || [],
        status: 'confirmed',
        confidence: finalizedDecision.confidence || 0,
      }),
      summary: finalizedDecision.discussion_summary || '',
      type: 'decision',
      participants: finalizedDecision.participants || [],
      sourceMessages: finalizedDecision.source_messages || [],
      confidence: finalizedDecision.confidence || 0,
    });

    const state = ensureState(roomId);
    state.candidate = null;
    state.messagesSinceCandidate = 0;
    clearTimer(state);

    io.to(roomId).emit('decision_finalized', {
      decision: finalizedDecision,
      document: finalDocument,
    });
    io.to(roomId).emit('decision_updated', finalizedDecision);
    io.to(roomId).emit('decision_analysis_status', { status: 'idle' });
  }

  static clearRoom(roomId) {
    const state = roomState.get(roomId);
    if (!state) return;
    clearTimer(state);
    roomState.delete(roomId);
  }
}