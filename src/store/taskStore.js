// taskStore.js — Zustand store for AI-generated tasks
// Includes: task CRUD, notification state, panel visibility, optimistic updates.
// Performance: All selectors are stable functions — no inline object creation.

import { create } from 'zustand';

export const useTaskStore = create((set, get) => ({
  // ─── Task Data ────────────────────────────────────────────
  // Stored as a map by ID for O(1) upserts and deduplication
  tasks: {},
  
  // ─── Document & Decision Data ───────────────────────────────
  documents: {},
  decisions: {},
  notes: {},
  summaries: {},

  // ─── UI State ─────────────────────────────────────────────
  // Whether the AI task workspace panel is expanded
  isPanelOpen: false,
  // The most recently created task (for the notification chip)
  latestTask: null,
  // The most recently created document or decision
  latestDocument: null,
  // The most recently detected decision candidate
  latestDecisionCandidate: null,
  // The most recently finalized decision
  latestDecisionFinal: null,
  // The most recently created note
  latestNote: null,
  // The most recently created summary
  latestSummary: null,
  // Shows the floating notification chip
  showNotification: false,
  // Count of tasks created in current "session" (resets on panel open)
  newTaskCount: 0,
  // Async AI pipeline processing loading states
  isGeneratingTask: false,
  isAnalyzingDecisions: false,

  // ─── Actions ──────────────────────────────────────────────

  /** Load initial tasks from server */
  setTasks: (taskArray) => {
    console.log(`[TASK STORE] setTasks: ${taskArray.length} tasks loaded`);
    set({
      tasks: taskArray.reduce((acc, task) => ({ ...acc, [task.id]: task }), {})
    });
  },

  /** Insert or update a single task (used for real-time socket events) */
  upsertTask: (task) => {
    const state = get();
    const isNew = !state.tasks[task.id];

    console.log(`[TASK STORE] upsertTask: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} task id=${task.id} title="${task.title}"`);

    set((prev) => ({
      tasks: { ...prev.tasks, [task.id]: task },
      // Only trigger notification for genuinely new tasks
      ...(isNew ? {
        latestTask: task,
        notificationType: 'task',
        showNotification: true,
        newTaskCount: prev.newTaskCount + 1,
        isPanelOpen: false, // Let the chip appear first
      } : {})
    }));
  },

  /** Remove a task */
  removeTask: (taskId) => {
    console.log(`[TASK STORE] removeTask: ${taskId}`);
    set((state) => {
      const newTasks = { ...state.tasks };
      delete newTasks[taskId];
      return { tasks: newTasks };
    });
  },

  // ─── Document Actions ─────────────────────────────────────

  setDocuments: (docArray) => {
    console.log(`[TASK STORE] setDocuments: ${docArray.length} docs loaded`);
    set({
      documents: docArray.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {})
    });
  },

  upsertDocument: (doc, options = {}) => {
    const state = get();
    const isNew = !state.documents[doc.id];

    console.log(`[TASK STORE] upsertDocument: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} doc id=${doc.id}`);

    set((prev) => ({
      documents: { ...prev.documents, [doc.id]: doc },
      ...(!options.silent && isNew ? {
        latestDocument: doc,
        notificationType: 'document',
        showNotification: true,
        isPanelOpen: false, // Let the chip appear first
      } : {})
    }));
  },

  // ─── Note Actions ────────────────────────────────────────

  setNotes: (noteArray) => {
    console.log(`[TASK STORE] setNotes: ${noteArray.length} notes loaded`);
    set({
      notes: noteArray.reduce((acc, note) => ({ ...acc, [note.id]: note }), {})
    });
  },

  upsertNote: (note) => {
    const state = get();
    const isNew = !state.notes[note.id];

    console.log(`[TASK STORE] upsertNote: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} note id=${note.id} title="${note.title}"`);

    set((prev) => ({
      notes: { ...prev.notes, [note.id]: note },
      ...(isNew ? {
        latestNote: note,
        notificationType: 'note',
        showNotification: true,
        isPanelOpen: false,
      } : {})
    }));
  },

  removeNote: (noteId) => {
    console.log(`[TASK STORE] removeNote: ${noteId}`);
    set((state) => {
      const newNotes = { ...state.notes };
      delete newNotes[noteId];
      return { notes: newNotes };
    });
  },

  removeDocument: (docId) => {
    set((state) => {
      const newDocs = { ...state.documents };
      delete newDocs[docId];
      return { documents: newDocs };
    });
  },

  // ─── Summary Actions ──────────────────────────────────────

  setSummaries: (summaryArray) => {
    console.log(`[TASK STORE] setSummaries: ${summaryArray.length} summaries loaded`);
    set({
      summaries: summaryArray.reduce((acc, summary) => ({ ...acc, [summary.id]: summary }), {})
    });
  },

  upsertSummary: (summary) => {
    const state = get();
    const isNew = !state.summaries[summary.id];

    console.log(`[TASK STORE] upsertSummary: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} summary id=${summary.id} title="${summary.title}"`);

    set((prev) => ({
      summaries: { ...prev.summaries, [summary.id]: summary },
      ...(isNew ? {
        latestSummary: summary,
        notificationType: 'summary',
        showNotification: true,
        isPanelOpen: false,
      } : {})
    }));
  },

  removeSummary: (summaryId) => {
    console.log(`[TASK STORE] removeSummary: ${summaryId}`);
    set((state) => {
      const newSummaries = { ...state.summaries };
      delete newSummaries[summaryId];
      return { summaries: newSummaries };
    });
  },

  // ─── Decision Actions ─────────────────────────────────────

  setDecisions: (decArray) => {
    console.log(`[TASK STORE] setDecisions: ${decArray.length} decisions loaded`);
    set({
      decisions: decArray.reduce((acc, dec) => ({ ...acc, [dec.decision_id]: dec }), {})
    });
  },

  upsertDecision: (dec) => {
    const state = get();
    const isNew = !state.decisions[dec.decision_id];
    const previous = state.decisions[dec.decision_id];
    const status = dec.status || previous?.status || 'pending';
    const previousStatus = previous?.status || null;

    console.log(`[TASK STORE] upsertDecision: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} decision id=${dec.decision_id} status=${status}`);

    set((prev) => ({
      decisions: { ...prev.decisions, [dec.decision_id]: dec }

      ...(isNew && status === 'pending' ? {
        latestDecisionCandidate: dec,
        notificationType: 'decision_candidate',
        showNotification: true,
        isPanelOpen: false,
      } : {}),

      ...(!isNew && previousStatus !== 'confirmed' && status === 'confirmed' ? {
        latestDecisionFinal: dec,
        notificationType: 'decision_final',
        showNotification: true,
        isPanelOpen: false,
      } : {}),
    }));
  },

  removeDecision: (decisionId) => {
    set((state) => {
      const newDecs = { ...state.decisions };
      delete newDecs[decisionId];
      return { decisions: newDecs };
    });
  },

  /** Optimistic status update — applied immediately, server confirms async */
  optimisticUpdateStatus: (taskId, newStatus) => {
    console.log(`[TASK STORE] optimisticUpdateStatus: ${taskId} → ${newStatus}`);
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [taskId]: { ...task, status: newStatus }
        }
      };
    });
  },

  /** Open the task panel and clear the notification */
  openPanel: () => {
    console.log(`[TASK STORE] openPanel`);
    set({ isPanelOpen: true, showNotification: false, newTaskCount: 0 });
  },

  /** Close the task panel */
  closePanel: () => {
    console.log(`[TASK STORE] closePanel`);
    set({ isPanelOpen: false });
  },

  /** Toggle the task panel */
  togglePanel: () => {
    console.log(`[TASK STORE] togglePanel`);
    set((state) => ({ 
      isPanelOpen: !state.isPanelOpen,
      ...( !state.isPanelOpen ? { showNotification: false, newTaskCount: 0 } : {} )
    }));
  },

  /** Dismiss the notification chip without opening panel */
  dismissNotification: () => {
    set({ showNotification: false, newTaskCount: 0 });
  },

  setGeneratingTask: (isGenerating) => set({ isGeneratingTask: isGenerating }),
  setAnalyzingDecisions: (isAnalyzing) => set({ isAnalyzingDecisions: isAnalyzing }),

  // ─── Derived Selectors (stable — use inside components) ────

  getTasksByStatus: (status) => {
    const tasks = Object.values(get().tasks);
    return tasks
      .filter(t => t.status === status && !t.is_deleted && !t.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getTotalCount: () => Object.values(get().tasks).filter(t => !t.is_deleted && !t.is_archived).length,
  getPendingCount: () => Object.values(get().tasks).filter(t => t.status === 'pending' && !t.is_deleted && !t.is_archived).length,

  getDocumentsByType: (type) => {
    const docs = Object.values(get().documents);
    const activeDocs = docs.filter(d => !d.is_deleted && !d.is_archived);
    if (!type || type === 'all') {
      return activeDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return activeDocs
      .filter(d => d.type === type)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getAllDecisions: () => {
    return Object.values(get().decisions)
      .filter(d => !d.is_deleted && !d.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getPendingDecisions: () => {
    return Object.values(get().decisions)
      .filter(d => d.status === 'pending' && !d.is_deleted && !d.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getConfirmedDecisions: () => {
    return Object.values(get().decisions)
      .filter(d => d.status === 'confirmed' && !d.is_deleted && !d.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getRejectedDecisions: () => {
    return Object.values(get().decisions)
      .filter(d => d.status === 'rejected' || d.is_deleted)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTotalDocCount: () => Object.values(get().documents).filter(d => !d.is_deleted && !d.is_archived).length,

  // ─── Trash Selectors ──────────────────────────────────────

  getTrashTasks: () => {
    return Object.values(get().tasks)
      .filter(t => t.is_deleted)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTrashDocuments: () => {
    return Object.values(get().documents)
      .filter(d => d.is_deleted)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTrashDecisions: () => {
    return Object.values(get().decisions)
      .filter(d => d.is_deleted)
      .sort((a, b) => new Date(b.deleted_at || b.created_at || 0) - new Date(a.deleted_at || a.created_at || 0));
  },

  // ─── Archived Selectors ───────────────────────────────────

  getArchivedTasks: () => {
    return Object.values(get().tasks)
      .filter(t => t.is_archived && !t.is_deleted)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getArchivedDocuments: () => {
    return Object.values(get().documents)
      .filter(d => d.is_archived && !d.is_deleted)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getArchivedDecisions: () => {
    return Object.values(get().decisions)
      .filter(d => d.is_archived && !d.is_deleted)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getActiveNotes: () => {
    return Object.values(get().notes)
      .filter(n => !n.deleted_at && !n.archived_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getArchivedNotes: () => {
    return Object.values(get().notes)
      .filter(n => !n.deleted_at && n.archived_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getTrashNotes: () => {
    return Object.values(get().notes)
      .filter(n => !!n.deleted_at)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTotalNoteCount: () => Object.values(get().notes).filter(n => !n.deleted_at && !n.archived_at).length,

  // ─── Summary Selectors ────────────────────────────────────

  getActiveSummaries: () => {
    return Object.values(get().summaries)
      .filter(s => !s.deleted_at && !s.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getArchivedSummaries: () => {
    return Object.values(get().summaries)
      .filter(s => !s.deleted_at && s.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getTrashSummaries: () => {
    return Object.values(get().summaries)
      .filter(s => !!s.deleted_at)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTotalSummaryCount: () => Object.values(get().summaries).filter(s => !s.deleted_at && !s.is_archived).length,
}));
