// @ts-nocheck
// taskStore.js — Zustand store for AI-generated tasks
// Includes: task CRUD, notification state, panel visibility, optimistic updates.
// Performance: All selectors are stable functions — no inline object creation.

import { create } from 'zustand';
import { Task, Document, Note, Decision } from '../types/models';


export const useTaskStore = create<any>((set: any, get: any) => ({

  // ─── Data Maps ────────────────────────────────────────────
  // Stored as a map by ID for O(1) upserts and deduplication
  tasks: {} as Record<string, Task>,
  documents: {} as Record<string, Document>,
  notes: {} as Record<string, Note>,

  // ─── UI State ─────────────────────────────────────────────
  // Whether the AI task workspace panel is expanded
  isPanelOpen: false,
  
  // The most recently created items (for the notification chip)
  latestTask: null,
  latestDocument: null,
  latestNote: null,
  
  // Shows the floating notification chip
  showNotification: false,
  notificationType: null, // 'task', 'document', 'note'
  
  // Count of tasks created in current "session" (resets on panel open)
  newTaskCount: 0,
  
  // Async AI pipeline processing loading states
  isGeneratingTask: false,

  // ─── Actions ──────────────────────────────────────────────

  /** Load initial tasks from server */
  setTasks: (taskArray: any) => {
    console.log(`[TASK STORE] setTasks: ${taskArray.length} tasks loaded`);
    set({
      tasks: taskArray.reduce((acc: any, task: any) => ({ ...acc, [task.id]: task }), {})
    });
  },

  /** Insert or update a single task (used for real-time socket events) */
  upsertTask: (task: Task) => {
    const state = get();
    const isNew = !state.tasks[task.id];

    console.log(`[TASK STORE] upsertTask: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} task id=${task.id} title="${task.title}"`);

    set((prev: any) => ({
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
  removeTask: (taskId: string) => {
    console.log(`[TASK STORE] removeTask: ${taskId}`);
    set((state: any) => {
      const newTasks = { ...state.tasks };
      delete newTasks[taskId];
      return { tasks: newTasks };
    });
  },

  // ─── Document Actions ─────────────────────────────────────

  setDocuments: (docArray: any) => {
    console.log(`[TASK STORE] setDocuments: ${docArray.length} docs loaded`);
    set({
      documents: docArray.reduce((acc: any, doc: any) => ({ ...acc, [doc.id]: doc }), {})
    });
  },

  upsertDocument: (doc, options = {}) => {
    const state = get();
    const isNew = !state.documents[doc.id];

    console.log(`[TASK STORE] upsertDocument: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} doc id=${doc.id}`);

    set((prev: any) => ({
      documents: { ...prev.documents, [doc.id]: doc },
      ...(!options.silent && isNew ? {
        latestDocument: doc,
        notificationType: 'document',
        showNotification: true,
        isPanelOpen: false, // Let the chip appear first
      } : {})
    }));
  },

  removeDocument: (docId: string) => {
    set((state: any) => {
      const newDocs = { ...state.documents };
      delete newDocs[docId];
      return { documents: newDocs };
    });
  },

  // ─── Note Actions ────────────────────────────────────────

  setNotes: (noteArray: any) => {
    console.log(`[TASK STORE] setNotes: ${noteArray.length} notes loaded`);
    set({
      notes: noteArray.reduce((acc: any, note: any) => ({ ...acc, [note.id]: note }), {})
    });
  },

  upsertNote: (note: Note) => {
    const state = get();
    const isNew = !state.notes[note.id];

    console.log(`[TASK STORE] upsertNote: ${isNew ? '🆕 NEW' : '🔄 UPDATE'} note id=${note.id} title="${note.title}"`);

    set((prev: any) => ({
      notes: { ...prev.notes, [note.id]: note },
      ...(isNew ? {
        latestNote: note,
        notificationType: 'note',
        showNotification: true,
        isPanelOpen: false,
      } : {})
    }));
  },

  removeNote: (noteId: string) => {
    console.log(`[TASK STORE] removeNote: ${noteId}`);
    set((state: any) => {
      const newNotes = { ...state.notes };
      delete newNotes[noteId];
      return { notes: newNotes };
    });
  },

  /** Optimistic status update — applied immediately, server confirms async */
  optimisticUpdateStatus: (taskId: any, newStatus: any) => {
    console.log(`[TASK STORE] optimisticUpdateStatus: ${taskId} → ${newStatus}`);
    set((state: any) => {
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
    set((state: any) => ({ 
      isPanelOpen: !state.isPanelOpen,
      ...( !state.isPanelOpen ? { showNotification: false, newTaskCount: 0 } : {} )
    }));
  },

  /** Dismiss the notification chip without opening panel */
  dismissNotification: () => {
    set({ showNotification: false, newTaskCount: 0 });
  },

  setGeneratingTask: (isGenerating: any) => set({ isGeneratingTask: isGenerating }),

  // ─── Derived Selectors (stable — use inside components) ────

  getTasksByStatus: (status: any) => {
    const tasks = Object.values(get().tasks);
    return tasks
      .filter(t => t.status === status && !t.is_deleted && !t.is_archived)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  },

  getTotalCount: () => Object.values(get().tasks).filter(t => !t.is_deleted && !t.is_archived).length,
  getPendingCount: () => Object.values(get().tasks).filter(t => t.status === 'pending' && !t.is_deleted && !t.is_archived).length,

  getDocumentsByCategory: (category: any) => {
    const docs = Object.values(get().documents);
    const activeDocs = docs.filter(d => !(d as any).deleted_at && !(d as any).archived);
    if (!category || category === 'all') {
      return activeDocs.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
    }
    return activeDocs
      .filter(d => (d as any).category === category)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  },

  getAllDocuments: () => {
    return Object.values(get().documents)
      .filter(d => !(d as any).deleted_at && !(d as any).archived)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  },

  getTotalDocCount: () => Object.values(get().documents).filter(d => !(d as any).deleted_at && !(d as any).archived).length,

  getActiveNotes: () => {
    return Object.values(get().notes)
      .filter(n => !n.deleted_at || (n as any).deleted_at && !n.archived_at)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  },

  getTotalNoteCount: () => Object.values(get().notes).filter(n => !n.deleted_at || (n as any).deleted_at && !n.archived_at).length,

  // ─── Trash Selectors ──────────────────────────────────────

  getTrashTasks: () => {
    return Object.values(get().tasks)
      .filter(t => t.is_deleted)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTrashDocuments: () => {
    return Object.values(get().documents)
      .filter(d => (d as any).deleted_at)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  getTrashNotes: () => {
    return Object.values(get().notes)
      .filter(n => !!n.deleted_at || (n as any).deleted_at)
      .sort((a, b) => new Date(b.deleted_at || b.updated_at || 0) - new Date(a.deleted_at || a.updated_at || 0));
  },

  // ─── Archived Selectors ───────────────────────────────────

  getArchivedTasks: () => {
    return Object.values(get().tasks)
      .filter(t => t.is_archived && !t.is_deleted)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  },

  getArchivedDocuments: () => {
    return Object.values(get().documents)
      .filter(d => (d as any).archived && !(d as any).deleted_at)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  },

  getArchivedNotes: () => {
    return Object.values(get().notes)
      .filter(n => !n.deleted_at || (n as any).deleted_at && n.archived_at)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() - new Date(a.created_at));
  }
}));
