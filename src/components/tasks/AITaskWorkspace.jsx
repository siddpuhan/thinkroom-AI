"use client";
// AITaskWorkspace.jsx — The complete AI-native dynamic task and document workspace
// Architecture:
//   - AITaskWorkspace: root container, manages socket bindings
//   - AINotificationChip: floating pill that appears when AI detects a task or document
//   - AITaskPanel: slide-in panel with tabs for Tasks, Notes, Docs, Decisions, Meeting Notes, Summaries, Archive, Trash
//   - AITaskCard / AIDocumentCard / AIDecisionCard: individual items

import React, { useEffect, useCallback, useMemo, useRef, useState, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import { NotesSection } from './NotesSection';
import './AITaskWorkspace.css';

// ─────────────────────────────────────────────────────────────────────────
// AIConfirmDeleteModal — Modal to confirm permanent hard delete
// ─────────────────────────────────────────────────────────────────────────

const AIConfirmDeleteModal = memo(({ item, onClose, onConfirm }) => {
  if (!item) return null;

  const listItems = {
    task: ['Task record details', 'Related task activity history', 'Assignment links'],
    document: ['AI document contents', 'Source chat message references', 'Metadata'],
    decision: ['Decision details', 'Decision timeline record']
  };

  const warnings = listItems[item.type] || ['Item data', 'All related associations'];

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="ai-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="ai-modal-title">⚠️ Delete {item.type === 'task' ? 'Task' : item.type === 'document' ? 'Document' : 'Decision'}?</h3>
        <p className="ai-modal-description">
          Are you sure you want to permanently delete <strong>"{item.title}"</strong>?
        </p>
        <div className="ai-modal-warning-list">
          <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5' }}>
            This action will permanently remove:
          </p>
          {warnings.map((w, idx) => (
            <span key={idx} className="ai-modal-warning-item">{w}</span>
          ))}
        </div>
        <div className="ai-modal-actions">
          <button className="ai-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="ai-modal-btn confirm-delete" onClick={onConfirm}>
            Delete Permanently
          </button>
        </div>
      </motion.div>
    </div>
  );
});
AIConfirmDeleteModal.displayName = 'AIConfirmDeleteModal';

// ─────────────────────────────────────────────────────────────────────────
// AITaskCard — Individual task with status actions and delete menu
// ─────────────────────────────────────────────────────────────────────────

const AITaskCard = memo(({ taskId, socket, roomId }) => {
  const task = useTaskStore(useCallback(state => state.tasks[taskId], [taskId]));
  const optimisticUpdateStatus = useTaskStore(state => state.optimisticUpdateStatus);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
    }
  }, [task]);

  if (!task) return null;

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    try {
      const d = new Date(deadline);
      const now = new Date();
      const diffMs = d - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return `⚠ Overdue`;
      if (diffDays === 0) return `⏰ Today`;
      if (diffDays === 1) return `⏰ Tomorrow`;
      return `📅 ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } catch {
      return null;
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!socket || !roomId) return;
    optimisticUpdateStatus(task.id, newStatus);
    socket.emit('update_task_status', {
      taskId: task.id,
      status: newStatus,
      roomId,
      actorId: 'user'
    });
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (!socket || !roomId || !editTitle.trim()) return;
    socket.emit('update_task', {
      taskId: task.id,
      title: editTitle.trim(),
      description: editDescription.trim(),
      roomId
    });
    setIsEditing(false);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('toggle_archive_task', {
      taskId: task.id,
      isArchived: !task.is_archived,
      roomId,
      actorId: 'user'
    });
    setShowDropdown(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('soft_delete_task', {
      taskId: task.id,
      roomId,
      actorId: 'user'
    });
    setShowDropdown(false);
  };

  const assignedName = task.assignedToName || task.assigned_to_name || task.assigned_to || null;
  const priorityClass = task.priority || 'medium';
  const isCompleted = task.status === 'completed';
  const deadlineLabel = formatDeadline(task.deadline);

  if (isEditing) {
    return (
      <div className="ai-edit-form" onClick={(e) => e.stopPropagation()}>
        <input
          className="ai-edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Task Title"
        />
        <textarea
          className="ai-edit-textarea"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Task Description"
        />
        <div className="ai-edit-actions">
          <button className="ai-edit-btn cancel" onClick={() => setIsEditing(false)}>Cancel</button>
          <button className="ai-edit-btn save" onClick={handleSaveEdit}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`ai-task-card priority-${priorityClass} ${isCompleted ? 'completed' : ''}`}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button
        className="ai-card-options-trigger"
        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
        title="Actions"
      >
        ⋮
      </button>

      {showDropdown && (
        <div className="ai-card-dropdown" onClick={(e) => e.stopPropagation()}>
          <button className="ai-dropdown-item" onClick={() => { setIsEditing(true); setShowDropdown(false); }}>
            ✏️ Edit
          </button>
          <button className="ai-dropdown-item" onClick={handleArchive}>
            📦 {task.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="ai-dropdown-item delete" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      )}

      <div className="ai-task-card-top">
        <p className="ai-task-card-title">{task.title}</p>
        {task.ai_generated && <span className="ai-task-ai-badge">AI ✨</span>}
      </div>

      {task.description && <p className="ai-task-card-description">{task.description}</p>}

      <div className="ai-task-card-meta">
        {assignedName && (
          <span className="ai-task-assignee"><span>👤</span>{assignedName}</span>
        )}
        <span className={`ai-task-priority priority-${priorityClass}`}>{priorityClass}</span>
        {deadlineLabel && <span className="ai-task-deadline">{deadlineLabel}</span>}
      </div>

      {!isCompleted && (
        <div className="ai-task-actions">
          {task.status === 'pending' && (
            <button className="ai-task-action-btn start" onClick={() => handleStatusChange('in_progress')}>
              ▶ Start
            </button>
          )}
          {(task.status === 'pending' || task.status === 'in_progress') && (
            <button className="ai-task-action-btn complete" onClick={() => handleStatusChange('completed')}>
              ✓ Done
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
});
AITaskCard.displayName = 'AITaskCard';

// ─────────────────────────────────────────────────────────────────────────
// AITaskSection
// ─────────────────────────────────────────────────────────────────────────

const SECTION_CONFIG = {
  pending:     { label: '🔵 Pending',     color: '#60a5fa' },
  in_progress: { label: '🟡 In Progress', color: '#fbbf24' },
  completed:   { label: '✅ Completed',   color: '#4ade80' },
};

const AITaskSection = memo(({ status, socket, roomId }) => {
  const taskIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.tasks)
        .filter(t => t.status === status && !t.is_deleted && !t.is_archived)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .map(t => t.id)
        .join(','),
      [status]
    )
  );

  const taskIds = useMemo(() => (taskIdsStr ? taskIdsStr.split(',') : []), [taskIdsStr]);

  const config = SECTION_CONFIG[status] || { label: status, color: '#a78bfa' };

  if (taskIds.length === 0) return null;

  return (
    <div>
      <div className="ai-task-section-label">
        {config.label}
        <span className="ai-section-count">{taskIds.length}</span>
      </div>
      <AnimatePresence initial={false}>
        {taskIds.map(id => (
          <AITaskCard key={id} taskId={id} socket={socket} roomId={roomId} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AITaskSection.displayName = 'AITaskSection';

// ─────────────────────────────────────────────────────────────────────────
// AIDocumentCard & AIDocumentSection
// ─────────────────────────────────────────────────────────────────────────

const AIDocumentCard = memo(({ docId, socket, roomId }) => {
  const doc = useTaskStore(useCallback(state => state.documents[docId], [docId]));
  const [expandedContent, setExpandedContent] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (!doc) return null;

  const participants = Array.isArray(doc.participants) ? doc.participants : [];
  let details = {};
  try {
    details = JSON.parse(doc.content || '{}');
  } catch (_e) {
    details = { content: doc.content };
  }

  const category = doc.category || 'General Documentation';
  const status = doc.status || 'draft';
  const isFinal = status === 'final';
  
  const formattedTime = new Date(doc.updated_at || doc.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleArchive = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('toggle_archive_document', {
      docId: doc.id,
      isArchived: !doc.is_archived,
      roomId
    });
    setShowDropdown(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('soft_delete_document', {
      docId: doc.id,
      roomId
    });
    setShowDropdown(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="ai-doc-card"
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button
        className="ai-card-options-trigger"
        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
        title="Actions"
      >
        ⋮
      </button>

      {showDropdown && (
        <div className="ai-card-dropdown" onClick={(e) => e.stopPropagation()}>
          <button className="ai-dropdown-item" onClick={handleArchive}>
            📦 {doc.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="ai-dropdown-item delete" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      )}

      <div className="ai-doc-header">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="ai-doc-badge category-badge">{category}</span>
          <span className={`ai-doc-badge status-badge ${isFinal ? 'final' : 'draft'}`}>
            {isFinal ? 'Final' : 'Draft'}
          </span>
        </div>
        <span className="ai-doc-time">{formattedTime}</span>
      </div>

      <div className="ai-doc-title-block">
        <h3 className="ai-doc-title">{doc.title}</h3>
      </div>

      {doc.summary && (
        <div className="ai-doc-section">
          <p className="ai-doc-text" style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{doc.summary}</p>
        </div>
      )}

      <div className="ai-doc-collapsible">
        <button 
          className="ai-doc-collapsible-btn" 
          onClick={(e) => { e.stopPropagation(); setExpandedContent(!expandedContent); }}
        >
          {expandedContent ? '▼ Hide Details' : '▶ Show Details'}
        </button>
        <AnimatePresence>
          {expandedContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ai-doc-collapsible-content"
            >
              {details.details && (
                <div className="ai-doc-section" style={{ marginTop: '8px' }}>
                  <p className="ai-doc-text">{details.details}</p>
                </div>
              )}
              {details.highlights && details.highlights.length > 0 && (
                <div className="ai-doc-section" style={{ marginTop: '12px' }}>
                  <div className="ai-doc-label">Highlights</div>
                  <ul style={{ paddingLeft: '20px', margin: '4px 0', color: '#f8fafc', fontSize: '0.85rem' }}>
                    {details.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              {participants.length > 0 && (
                <div className="ai-doc-section" style={{ marginTop: '12px' }}>
                  <div className="ai-doc-label">Participants</div>
                  <div className="ai-doc-participants">
                    {participants.map((p, i) => (
                      <span key={i} className="ai-doc-participant">👤 {p}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
AIDocumentCard.displayName = 'AIDocumentCard';

const AIDocumentSection = memo(({ type, socket, roomId }) => {
  const docIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.documents)
        .filter(d => !d.is_deleted && !d.is_archived)
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
        .map(d => d.id)
        .join(','),
      []
    )
  );

  const docIds = useMemo(() => (docIdsStr ? docIdsStr.split(',') : []), [docIdsStr]);

  if (docIds.length === 0) return (
    <div className="ai-panel-empty">
      <div className="ai-panel-empty-icon">📄</div>
      <p>AI will generate documents here as decisions are made or meetings conclude.</p>
    </div>
  );

  return (
    <div className="ai-card-list">
      <AnimatePresence initial={false}>
        {docIds.map(id => (
          <AIDocumentCard key={id} docId={id} socket={socket} roomId={roomId} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AIDocumentSection.displayName = 'AIDocumentSection';

// ─────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────
// Trash Section Component
// ─────────────────────────────────────────────────────────────────────────

const TrashItemRow = memo(({ id, type, onRestore, onDeletePerm }) => {
  const title = useTaskStore(
    useCallback(
      (state) => {
        if (type === 'task') return state.tasks[id]?.title;
        if (type === 'document') return state.documents[id]?.title;
        if (type === 'decision') return state.decisions[id]?.title;
        if (type === 'summary') return state.summaries[id]?.title;
        return '';
      },
      [id, type]
    )
  );

  if (!title) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="ai-trash-card"
    >
      <span className="ai-trash-card-type">{type}</span>
      <h4 className="ai-trash-card-title">{title}</h4>
      <div className="ai-trash-actions">
        <button className="ai-trash-btn restore" onClick={() => onRestore(id, type)}>
          Restore
        </button>
        <button className="ai-trash-btn delete-perm" onClick={() => onDeletePerm({ id, type, title })}>
          Delete Permanently
        </button>
      </div>
    </motion.div>
  );
});
TrashItemRow.displayName = 'TrashItemRow';

const AITrashSection = memo(({ socket, roomId, setConfirmDelete }) => {
  const trashTaskIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.tasks).filter(t => t.is_deleted).map(t => t.id).join(','),
      []
    )
  );

  const trashDocIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.documents).filter(d => d.is_deleted).map(d => d.id).join(','),
      []
    )
  );

  const trashDecisionIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.decisions).filter(d => d.is_deleted).map(d => d.decision_id).join(','),
      []
    )
  );

  const trashSummaryIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.summaries).filter(s => !!s.deleted_at).map(s => s.id).join(','),
      []
    )
  );

  const trashTaskIds = useMemo(() => (trashTaskIdsStr ? trashTaskIdsStr.split(',') : []), [trashTaskIdsStr]);
  const trashDocIds = useMemo(() => (trashDocIdsStr ? trashDocIdsStr.split(',') : []), [trashDocIdsStr]);
  const trashDecisionIds = useMemo(() => (trashDecisionIdsStr ? trashDecisionIdsStr.split(',') : []), [trashDecisionIdsStr]);
  const trashSummaryIds = useMemo(() => (trashSummaryIdsStr ? trashSummaryIdsStr.split(',') : []), [trashSummaryIdsStr]);

  const handleRestore = useCallback((id, type) => {
    if (!socket || !roomId) return;
    console.log(`[TRASH] Restoring ${type} id=${id}`);
    if (type === 'task') {
      socket.emit('restore_task', { taskId: id, roomId, actorId: 'user' });
    } else if (type === 'document') {
      socket.emit('restore_document', { docId: id, roomId });
    } else if (type === 'decision') {
      socket.emit('restore_decision', { decisionId: id, roomId });
    } else if (type === 'summary') {
      socket.emit('restore_summary', { summaryId: id, roomId });
    }
  }, [socket, roomId]);

  const hasItems = trashTaskIds.length > 0 || trashDocIds.length > 0 || trashDecisionIds.length > 0 || trashSummaryIds.length > 0;

  if (!hasItems) {
    return (
      <div className="ai-trash-empty">
        <div className="ai-trash-empty-icon">🗑️</div>
        <p>Trash is empty.</p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(148, 163, 184, 0.4)' }}>
          Deleted tasks, documents, and decisions will appear here for recovery.
        </p>
      </div>
    );
  }

  return (
    <div className="ai-trash-list">
      {trashTaskIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Tasks ({trashTaskIds.length})</div>
          <AnimatePresence>
            {trashTaskIds.map(id => (
              <TrashItemRow key={id} id={id} type="task" onRestore={handleRestore} onDeletePerm={setConfirmDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {trashDocIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Documents ({trashDocIds.length})</div>
          <AnimatePresence>
            {trashDocIds.map(id => (
              <TrashItemRow key={id} id={id} type="document" onRestore={handleRestore} onDeletePerm={setConfirmDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {trashDecisionIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Decisions ({trashDecisionIds.length})</div>
          <AnimatePresence>
            {trashDecisionIds.map(id => (
              <TrashItemRow key={id} id={id} type="decision" onRestore={handleRestore} onDeletePerm={setConfirmDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {trashSummaryIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Summaries ({trashSummaryIds.length})</div>
          <AnimatePresence>
            {trashSummaryIds.map(id => (
              <TrashItemRow key={id} id={id} type="summary" onRestore={handleRestore} onDeletePerm={setConfirmDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
AITrashSection.displayName = 'AITrashSection';

// ─────────────────────────────────────────────────────────────────────────
// Archive Section Component
// ─────────────────────────────────────────────────────────────────────────

const ArchiveItemRow = memo(({ id, type, onUnarchive }) => {
  const title = useTaskStore(
    useCallback(
      (state) => {
        if (type === 'task') return state.tasks[id]?.title;
        if (type === 'document') return state.documents[id]?.title;
        if (type === 'decision') return state.decisions[id]?.title;
        if (type === 'summary') return state.summaries[id]?.title;
        return '';
      },
      [id, type]
    )
  );

  if (!title) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="ai-trash-card"
    >
      <span className="ai-trash-card-type">{type}</span>
      <h4 className="ai-trash-card-title">{title}</h4>
      <div className="ai-trash-actions">
        <button className="ai-trash-btn restore" onClick={() => onUnarchive(id, type)}>
          Unarchive
        </button>
      </div>
    </motion.div>
  );
});
ArchiveItemRow.displayName = 'ArchiveItemRow';

const AIArchiveSection = memo(({ socket, roomId }) => {
  const archivedTaskIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.tasks).filter(t => t.is_archived && !t.is_deleted).map(t => t.id).join(','),
      []
    )
  );

  const archivedDocIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.documents).filter(d => d.is_archived && !d.is_deleted).map(d => d.id).join(','),
      []
    )
  );

  const archivedDecisionIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.decisions).filter(d => d.is_archived && !d.is_deleted).map(d => d.decision_id).join(','),
      []
    )
  );

  const archivedSummaryIdsStr = useTaskStore(
    useCallback(
      (state) => Object.values(state.summaries).filter(s => s.is_archived && !s.deleted_at).map(s => s.id).join(','),
      []
    )
  );

  const archivedTaskIds = useMemo(() => (archivedTaskIdsStr ? archivedTaskIdsStr.split(',') : []), [archivedTaskIdsStr]);
  const archivedDocIds = useMemo(() => (archivedDocIdsStr ? archivedDocIdsStr.split(',') : []), [archivedDocIdsStr]);
  const archivedDecisionIds = useMemo(() => (archivedDecisionIdsStr ? archivedDecisionIdsStr.split(',') : []), [archivedDecisionIdsStr]);
  const archivedSummaryIds = useMemo(() => (archivedSummaryIdsStr ? archivedSummaryIdsStr.split(',') : []), [archivedSummaryIdsStr]);

  const handleUnarchive = useCallback((id, type) => {
    if (!socket || !roomId) return;
    console.log(`[ARCHIVE] Unarchiving ${type} id=${id}`);
    if (type === 'task') {
      socket.emit('toggle_archive_task', { taskId: id, isArchived: false, roomId, actorId: 'user' });
    } else if (type === 'document') {
      socket.emit('toggle_archive_document', { docId: id, isArchived: false, roomId });
    } else if (type === 'decision') {
      socket.emit('toggle_archive_decision', { decisionId: id, isArchived: false, roomId });
    } else if (type === 'summary') {
      socket.emit('toggle_archive_summary', { summaryId: id, isArchived: false, roomId });
    }
  }, [socket, roomId]);

  const hasItems = archivedTaskIds.length > 0 || archivedDocIds.length > 0 || archivedDecisionIds.length > 0 || archivedSummaryIds.length > 0;

  if (!hasItems) {
    return (
      <div className="ai-trash-empty">
        <div className="ai-trash-empty-icon">📦</div>
        <p>Archive is empty.</p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(148, 163, 184, 0.4)' }}>
          Archived tasks, documents, and decisions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="ai-trash-list">
      {archivedTaskIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header" style={{ color: '#94a3b8' }}>📦 Archived Tasks ({archivedTaskIds.length})</div>
          <AnimatePresence>
            {archivedTaskIds.map(id => (
              <ArchiveItemRow key={id} id={id} type="task" onUnarchive={handleUnarchive} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {archivedDocIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header" style={{ color: '#94a3b8' }}>📦 Archived Documents ({archivedDocIds.length})</div>
          <AnimatePresence>
            {archivedDocIds.map(id => (
              <ArchiveItemRow key={id} id={id} type="document" onUnarchive={handleUnarchive} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {archivedDecisionIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header" style={{ color: '#94a3b8' }}>📦 Archived Decisions ({archivedDecisionIds.length})</div>
          <AnimatePresence>
            {archivedDecisionIds.map(id => (
              <ArchiveItemRow key={id} id={id} type="decision" onUnarchive={handleUnarchive} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {archivedSummaryIds.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header" style={{ color: '#94a3b8' }}>📦 Archived Summaries ({archivedSummaryIds.length})</div>
          <AnimatePresence>
            {archivedSummaryIds.map(id => (
              <ArchiveItemRow key={id} id={id} type="summary" onUnarchive={handleUnarchive} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
AIArchiveSection.displayName = 'AIArchiveSection';

// ─────────────────────────────────────────────────────────────────────────
// AISummarySection Component
// ─────────────────────────────────────────────────────────────────────────

const AISummaryCard = memo(({ summaryId, socket, roomId }) => {
  const summary = useTaskStore(useCallback(state => state.summaries[summaryId], [summaryId]));
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);

  if (!summary) return null;

  const participants = Array.isArray(summary.participants) ? summary.participants : [];
  const highlights = Array.isArray(summary.highlights) ? summary.highlights : [];
  const formattedTime = new Date(summary.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleArchive = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('toggle_archive_summary', { summaryId: summary.id, isArchived: !summary.is_archived, roomId });
    setShowDropdown(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('soft_delete_summary', { summaryId: summary.id, roomId });
    setShowDropdown(false);
  };

  const icons = {
    meeting: '🤝',
    catch_up: '✨',
    daily: '📅'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="ai-doc-card"
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button
        className="ai-card-options-trigger"
        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
      >
        ⋮
      </button>

      {showDropdown && (
        <div className="ai-card-dropdown" onClick={(e) => e.stopPropagation()}>
          <button className="ai-dropdown-item" onClick={() => { setExpandedContent(!expandedContent); setShowDropdown(false); }}>
            📖 Open
          </button>
          <button className="ai-dropdown-item" onClick={handleArchive}>
            📦 {summary.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="ai-dropdown-item delete" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      )}

      <div className="ai-doc-header">
        <span className="ai-doc-icon">{icons[summary.summary_type] || '📊'}</span>
        <span className="ai-doc-header-text" style={{ textTransform: 'capitalize' }}>{summary.summary_type.replace('_', ' ')}</span>
        <span className="ai-doc-time">{formattedTime}</span>
      </div>

      <div className="ai-doc-title-block">
        <h3 className="ai-doc-title" style={{ fontSize: '1.1rem' }}>{summary.title}</h3>
      </div>

      {participants.length > 0 && (
        <div className="ai-doc-participants" style={{ marginBottom: '12px' }}>
          {participants.map((p, i) => (
            <span key={i} className="ai-doc-participant">👤 {p}</span>
          ))}
        </div>
      )}

      {highlights.length > 0 && (
        <div className="ai-doc-section">
          <div className="ai-doc-label">Highlights</div>
          <ul style={{ margin: '4px 0', paddingLeft: '20px', color: '#e2e8f0', fontSize: '0.85rem' }}>
            {highlights.map((h, i) => <li key={i} style={{ marginBottom: '4px' }}>{h}</li>)}
          </ul>
        </div>
      )}

      <div className="ai-doc-collapsible">
        <button 
          className="ai-doc-collapsible-btn" 
          onClick={(e) => { e.stopPropagation(); setExpandedContent(!expandedContent); }}
        >
          {expandedContent ? '▼' : '▶'} Full Summary
        </button>
        <AnimatePresence>
          {expandedContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ai-doc-collapsible-content"
            >
              <p className="ai-doc-text" style={{ whiteSpace: 'pre-wrap' }}>{summary.content}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
AISummaryCard.displayName = 'AISummaryCard';

const AISummarySection = memo(({ socket, roomId }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const summaryIds = useTaskStore(
    useCallback(
      (state) => {
        let list = Object.values(state.summaries).filter(s => !s.deleted_at && !s.is_archived);
        if (filterType !== 'all') {
          list = list.filter(s => s.summary_type === filterType);
        }
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          list = list.filter(s => 
            s.title.toLowerCase().includes(lowerQuery) || 
            s.content.toLowerCase().includes(lowerQuery) ||
            (s.participants || []).some(p => p.toLowerCase().includes(lowerQuery)) ||
            (s.highlights || []).some(h => h.toLowerCase().includes(lowerQuery))
          );
        }
        return list
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .map(s => s.id);
      },
      [filterType, searchQuery]
    )
  );

  useEffect(() => {
    if (!socket) return;
    const handleStatus = ({ status }) => {
      setIsGenerating(status === 'generating');
    };
    socket.on('summary_generation_status', handleStatus);
    return () => socket.off('summary_generation_status', handleStatus);
  }, [socket]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search summaries..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ai-edit-input"
          style={{ flex: '1', minWidth: '150px' }}
        />
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="ai-edit-input"
          style={{ width: 'auto' }}
        >
          <option value="all">All Types</option>
          <option value="meeting">Meeting</option>
          <option value="catch_up">Catch-Up</option>
          <option value="daily">Daily</option>
        </select>
        <button 
          className="ai-task-action-btn start" 
          onClick={() => socket?.emit('request_summary', { roomId, summaryType: 'daily', requestorName: 'User' })}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : '+ Daily Summary'}
        </button>
      </div>

      {summaryIds.length === 0 ? (
        <div className="ai-panel-empty">
          <div className="ai-panel-empty-icon">📊</div>
          <p>{searchQuery ? 'No summaries match your search.' : 'No summaries generated yet. Request a Catch-Up or Daily summary.'}</p>
        </div>
      ) : (
        <AnimatePresence>
          {summaryIds.map(id => (
            <AISummaryCard key={id} summaryId={id} socket={socket} roomId={roomId} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
});
AISummarySection.displayName = 'AISummarySection';

// ─────────────────────────────────────────────────────────────────────────
// AITaskPanel — The slide-in workspace panel with Tabs
// ─────────────────────────────────────────────────────────────────────────

const AUTO_COLLAPSE_MS = 60_000;

const AITaskPanel = memo(({ socket, roomId, setConfirmDelete }) => {
  const closePanel = useTaskStore(state => state.closePanel);
  const tasks = useTaskStore(state => state.tasks);
  const notes = useTaskStore(state => state.notes);
  const documents = useTaskStore(state => state.documents);
  const isGeneratingTask = useTaskStore(state => state.isGeneratingTask);
  const inactivityTimer = useRef(null);

  const [activeTab, setActiveTab] = useState('tasks');

  // Stats bar calculation
  const totalTasks = Object.values(tasks).filter(t => !t.is_deleted && !t.is_archived).length;
  const pendingCount = Object.values(tasks).filter(t => t.status === 'pending' && !t.is_deleted && !t.is_archived).length;
  const completedCount = Object.values(tasks).filter(t => t.status === 'completed' && !t.is_deleted && !t.is_archived).length;
  const totalDocs = Object.values(documents).filter(d => !d.is_deleted && !d.is_archived).length;
  const totalNotes = Object.values(notes).filter(n => !n.deleted_at && !n.archived_at).length;

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    if (activeTab === 'trash' || activeTab === 'archive') return;
    inactivityTimer.current = setTimeout(() => {
      console.log('[AI PANEL] Auto-collapsing after inactivity');
      closePanel();
    }, AUTO_COLLAPSE_MS);
  }, [closePanel, activeTab]);

  useEffect(() => {
    resetInactivityTimer();
    return () => clearTimeout(inactivityTimer.current);
  }, [resetInactivityTimer, activeTab]);

  return (
    <motion.div
      className="ai-task-panel"
      onMouseMove={resetInactivityTimer}
      onKeyDown={resetInactivityTimer}
    >
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title-group">
          <h2 className="ai-panel-title">
            <span className="ai-panel-title-icon">✨</span>
            AI Workspace
            {isGeneratingTask ? (
              <span className="ai-panel-loading-spinner" title="AI is processing chat..." />
            ) : (
              <span className="ai-panel-status-dot" title="Live sync active" />
            )}
          </h2>
          <span className="ai-panel-subtitle">
            {isGeneratingTask ? 'AI is processing chat...' : 'Auto-generated from chat'}
          </span>
        </div>
        <div className="ai-panel-actions">
          <button className="ai-panel-close-btn" onClick={closePanel} title="Collapse panel">
            ✕ Hide
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-panel-tabs">
        <button className={`ai-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          📋 Tasks
        </button>
        <button className={`ai-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          📝 Notes
        </button>
        <button className={`ai-tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          📄 Documents
        </button>
      </div>

      {/* Stats bar */}
      {activeTab === 'tasks' ? (
        <div className="ai-panel-stats">
          <div className="ai-stat-item">
            <span className="ai-stat-value">{totalTasks}</span>
            <span className="ai-stat-label">Total</span>
          </div>
          <div className="ai-stat-item">
            <span className="ai-stat-value" style={{ color: '#60a5fa' }}>{pendingCount}</span>
            <span className="ai-stat-label">Pending</span>
          </div>
          <div className="ai-stat-item">
            <span className="ai-stat-value" style={{ color: '#4ade80' }}>{completedCount}</span>
            <span className="ai-stat-label">Done</span>
          </div>
        </div>
      ) : activeTab === 'notes' ? (
        <div className="ai-panel-stats" style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.15)' }}>
          <div className="ai-stat-item" style={{ flex: 'none', width: '100%', background: 'transparent', border: 'none' }}>
            <span className="ai-stat-value" style={{ color: '#f8fafc' }}>📝 Notes</span>
            <span className="ai-stat-label" style={{ color: '#94a3b8' }}>{totalNotes} active note{totalNotes === 1 ? '' : 's'} captured from chat</span>
          </div>
        </div>
      ) : (
        <div className="ai-panel-stats">
          <div className="ai-stat-item" style={{ flex: 'none', width: '100%' }}>
            <span className="ai-stat-value">{totalDocs}</span>
            <span className="ai-stat-label">Total AI Documents</span>
          </div>
        </div>
      )}

      {/* Auto-collapse timer visual */}
      <div className="ai-panel-timer-bar">
        {activeTab !== 'trash' && activeTab !== 'archive' && (
          <motion.div
            className="ai-panel-timer-bar-fill"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: AUTO_COLLAPSE_MS / 1000, ease: 'linear' }}
            key={activeTab}
          />
        )}
      </div>

      {/* Content */}
      <div className="ai-panel-content">
        {activeTab === 'tasks' ? (
          <>
            {isGeneratingTask && (
              <div className="ai-section-loading-inline">
                <span className="ai-inline-spinner" />
                <span>AI is extracting new tasks...</span>
              </div>
            )}
            {totalTasks === 0 ? (
              <div className="ai-panel-empty">
                <div className="ai-panel-empty-icon">🤖</div>
                <p>Chat normally and I'll automatically detect tasks, assignments, and action items.</p>
              </div>
            ) : (
              <>
                <AITaskSection status="pending"     socket={socket} roomId={roomId} />
                <AITaskSection status="in_progress" socket={socket} roomId={roomId} />
                <AITaskSection status="completed"   socket={socket} roomId={roomId} />
              </>
            )}
          </>
        ) : activeTab === 'notes' ? (
          <NotesSection socket={socket} roomId={roomId} />
        ) : (
          <AIDocumentSection type="all" socket={socket} roomId={roomId} />
        )}
      </div>
    </motion.div>
  );
});
AITaskPanel.displayName = 'AITaskPanel';

// ─────────────────────────────────────────────────────────────────────────
// AINotificationChip — Floating pill notification
// ─────────────────────────────────────────────────────────────────────────

const AINotificationChip = memo(({ latestTask, latestDocument, latestNote, latestDecisionCandidate, latestDecisionFinal, notificationType, newTaskCount, onOpen, onDismiss }) => {
  const isDoc = notificationType === 'document' && latestDocument;
  const isNote = notificationType === 'note' && latestNote;
  const isDecisionCandidate = notificationType === 'decision_candidate' && latestDecisionCandidate;
  const isDecisionFinal = notificationType === 'decision_final' && latestDecisionFinal;
  
  const getDocMessage = (doc) => {
    switch (doc?.type) {
      case 'decision': return '✨ AI documented an architecture decision';
      case 'architecture': return '✨ AI documented an architecture decision';
      case 'meeting_notes': return '✨ AI generated project notes';
      case 'summary': return '✨ AI generated project notes';
      default: return '✨ AI generated documentation';
    }
  };

  const getNoteMessage = (note) => {
    switch ((note?.type || '').toLowerCase()) {
      case 'reminder': return '🗒️ AI captured a reminder';
      case 'idea': return '🗒️ AI captured an idea';
      case 'risk': return '🗒️ AI captured a risk';
      case 'observation': return '🗒️ AI captured an observation';
      case 'resource': return '🗒️ AI captured a resource';
      default: return '🗒️ AI captured a note';
    }
  };

  const getDecisionMessage = (decision, isFinal = false) => {
    if (isFinal) {
      return `✨ AI documented final team decision${decision?.title ? ` — ${decision.title}` : ''}`;
    }

    return `🧠 AI detected possible decision${decision?.title ? ` — ${decision.title}` : ''}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className="ai-task-chip-wrapper"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div className="ai-task-chip ai-doc-glow" onClick={onOpen}>
        {isDoc ? (
          <>
            <span className="ai-chip-sparkle">📄</span>
            <span>{getDocMessage(latestDocument)}</span>
          </>
        ) : isNote ? (
          <>
            <span className="ai-chip-sparkle">🗒️</span>
            <span>{getNoteMessage(latestNote)}</span>
          </>
        ) : (
          <>
            <span className="ai-chip-sparkle">✨</span>
            <span>
              AI detected {newTaskCount} task{newTaskCount !== 1 ? 's' : ''}
              {latestTask?.title ? ` — "${latestTask.title.substring(0, 28)}${latestTask.title.length > 28 ? '…' : ''}"` : ''}
            </span>
            {newTaskCount > 1 && <span className="ai-chip-badge">{newTaskCount}</span>}
          </>
        )}
        <button className="ai-chip-dismiss" onClick={(e) => { e.stopPropagation(); onDismiss(); }} title="Dismiss">
          ✕
        </button>
      </div>
    </motion.div>
  );
});
AINotificationChip.displayName = 'AINotificationChip';

// ─────────────────────────────────────────────────────────────────────────
// AITaskWorkspace — Root component
// ─────────────────────────────────────────────────────────────────────────

export const AITaskWorkspace = memo(({ socket, roomId }) => {
  const openPanel  = useTaskStore(state => state.openPanel);
  const closePanel = useTaskStore(state => state.closePanel);
  const dismissNotification = useTaskStore(state => state.dismissNotification);
  
  const isPanelOpen      = useTaskStore(state => state.isPanelOpen);
  const showNotification = useTaskStore(state => state.showNotification);
  const latestTask       = useTaskStore(state => state.latestTask);
  const latestDocument   = useTaskStore(state => state.latestDocument);
  const latestNote       = useTaskStore(state => state.latestNote);
  const notificationType = useTaskStore(state => state.notificationType);
  const newTaskCount     = useTaskStore(state => state.newTaskCount);

  // Global Confirm Delete state
  const [confirmDelete, setConfirmDelete] = useState(null);

  const setTasks = useTaskStore(state => state.setTasks);
  const setDocuments = useTaskStore(state => state.setDocuments);
  const setNotes = useTaskStore(state => state.setNotes);
  const upsertTask = useTaskStore(state => state.upsertTask);
  const removeTask = useTaskStore(state => state.removeTask);
  const upsertDocument = useTaskStore(state => state.upsertDocument);
  const removeDocument = useTaskStore(state => state.removeDocument);
  const upsertNote = useTaskStore(state => state.upsertNote);
  const removeNote = useTaskStore(state => state.removeNote);

  // Handle permanent hard deletion of items confirmed by user
  const handleConfirmPermanentDelete = useCallback(() => {
    if (!confirmDelete || !socket || !roomId) return;
    const { id, type } = confirmDelete;

    console.log(`[WORKSPACE] Global Confirm Delete: Permanently removing ${type} id=${id}`);
    if (type === 'task') {
      socket.emit('hard_delete_task', { taskId: id, roomId });
    } else if (type === 'document') {
      socket.emit('hard_delete_document', { docId: id, roomId });
    } else if (type === 'decision') {
      socket.emit('hard_delete_decision', { decisionId: id, roomId });
    }
    setConfirmDelete(null);
  }, [confirmDelete, socket, roomId]);

  // ── Socket bindings ──────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    // Fetch existing tasks, docs, and notes on mount
    socket.emit('get_tasks', { roomId }, (tasks) => {
      if (tasks && tasks.length > 0) {
        setTasks(tasks);
      } else {
        setTasks([]);
      }
    });
    
    socket.emit('get_documents', { roomId }, (docs) => {
      if (docs && docs.length > 0) {
        setDocuments(docs);
      } else {
        setDocuments([]);
      }
    });

    socket.emit('get_notes', { roomId }, (notes) => {
      if (notes && notes.length > 0) {
        setNotes(notes);
      } else {
        setNotes([]);
      }
    });

    // Realtime message/AI pipeline event listeners
    const handleTaskCreated = (task) => {
      console.log("[SOCKET EVENT] task_created:", task);
      upsertTask(task);
    };
    const handleTaskUpdated = (task) => {
      console.log("[SOCKET EVENT] task_updated:", task);
      upsertTask(task);
    };
    const handleTaskDeleted = ({ taskId }) => {
      console.log("[SOCKET EVENT] task_deleted:", taskId);
      removeTask(taskId);
    };

    const handleDocumentCreated = (doc) => {
      console.log("[SOCKET EVENT] document_created:", doc);
      upsertDocument(doc);
    };
    const handleDocumentUpdated = (doc) => {
      console.log("[SOCKET EVENT] document_updated:", doc);
      upsertDocument(doc);
    };
    const handleDocumentDeleted = ({ docId }) => {
      console.log("[SOCKET EVENT] document_deleted:", docId);
      removeDocument(docId);
    };

    const handleNoteCreated = (note) => {
      console.log("[SOCKET EVENT] note_created:", note);
      upsertNote(note);
    };
    const handleNoteUpdated = (note) => {
      console.log("[SOCKET EVENT] note_updated:", note);
      upsertNote(note);
    };
    const handleNoteDeleted = ({ noteId }) => {
      console.log("[SOCKET EVENT] note_deleted:", noteId);
      removeNote(noteId);
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    socket.on('document_created', handleDocumentCreated);
    socket.on('document_updated', handleDocumentUpdated);
    socket.on('document_deleted', handleDocumentDeleted);

    socket.on('note_created', handleNoteCreated);
    socket.on('note_updated', handleNoteUpdated);
    socket.on('note_deleted', handleNoteDeleted);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);

      socket.off('document_created', handleDocumentCreated);
      socket.off('document_updated', handleDocumentUpdated);
      socket.off('document_deleted', handleDocumentDeleted);

      socket.off('note_created', handleNoteCreated);
      socket.off('note_updated', handleNoteUpdated);
      socket.off('note_deleted', handleNoteDeleted);
    };
  }, [socket, roomId, setTasks, setDocuments, setNotes, upsertTask, removeTask, upsertDocument, removeDocument, upsertNote, removeNote]);

  // ── Reset state on room change ───────────────────────────
  useEffect(() => {
    closePanel();
    dismissNotification();
    setConfirmDelete(null);
  }, [roomId, closePanel, dismissNotification]);

  if (!roomId) return null;

  return (
    <>
      <AnimatePresence>
        {showNotification && !isPanelOpen && (
          <AINotificationChip
            key="chip"
            latestTask={latestTask}
            latestDocument={latestDocument}
            latestNote={latestNote}
            notificationType={notificationType}
            newTaskCount={newTaskCount}
            onOpen={openPanel}
            onDismiss={dismissNotification}
          />
        )}
      </AnimatePresence>

      <div className="ai-task-panel-overlay" aria-hidden={!isPanelOpen}>
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              key="panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0,     opacity: 1 }}
              exit={{ x: '100%',   opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
              style={{ width: '100%', height: '100%' }}
            >
              <AITaskPanel socket={socket} roomId={roomId} setConfirmDelete={setConfirmDelete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <AIConfirmDeleteModal
            key="confirm-modal"
            item={confirmDelete}
            onClose={() => setConfirmDelete(null)}
            onConfirm={handleConfirmPermanentDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
});
AITaskWorkspace.displayName = 'AITaskWorkspace';
