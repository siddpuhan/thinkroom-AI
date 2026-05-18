// AITaskWorkspace.jsx — The complete AI-native dynamic task and document workspace
// Architecture:
//   - AITaskWorkspace: root container, manages socket bindings
//   - AINotificationChip: floating pill that appears when AI detects a task or document
//   - AITaskPanel: slide-in panel with tabs for Tasks, Docs, Decisions, Meeting Notes, Summaries
//   - AITaskCard / AIDocumentCard: individual items

import React, { useEffect, useCallback, useMemo, useRef, useState, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore.js';
import './AITaskWorkspace.css';

// ─────────────────────────────────────────────────────────────────────────
// AITaskCard — Individual task with status actions
// ─────────────────────────────────────────────────────────────────────────

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

const AITaskCard = memo(({ task, socket, roomId }) => {
  const optimisticUpdateStatus = useTaskStore(state => state.optimisticUpdateStatus);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

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
          <button className="ai-dropdown-item" onClick={(e) => { setIsEditing(true); setShowDropdown(false); }}>
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
  const tasksObj = useTaskStore(state => state.tasks);

  const tasks = useMemo(() =>
    Object.values(tasksObj)
      .filter(t => t.status === status && !t.is_deleted && !t.is_archived)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [tasksObj, status]
  );

  const config = SECTION_CONFIG[status] || { label: status, color: '#a78bfa' };

  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="ai-task-section-label">
        {config.label}
        <span className="ai-section-count">{tasks.length}</span>
      </div>
      <AnimatePresence initial={false}>
        {tasks.map(task => (
          <AITaskCard key={task.id} task={task} socket={socket} roomId={roomId} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AITaskSection.displayName = 'AITaskSection';

// ─────────────────────────────────────────────────────────────────────────
// AIDocumentCard & AIDocumentSection
// ─────────────────────────────────────────────────────────────────────────

const AIDocumentCard = memo(({ doc, socket, roomId }) => {
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedParticipants, setExpandedParticipants] = useState(false);
  const [expandedSource, setExpandedSource] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const participants = Array.isArray(doc.participants) ? doc.participants : [];
  const sourceMessages = Array.isArray(doc.source_messages) ? doc.source_messages : [];
  
  const typeLabels = {
    decision: 'Decision',
    architecture: 'Architecture',
    meeting_notes: 'Meeting Notes',
    summary: 'Summary'
  };

  const icons = {
    decision: '🧠',
    architecture: '🏗️',
    meeting_notes: '📝',
    summary: '📊'
  };

  // Try to parse structured content
  let details = {};
  try {
    details = JSON.parse(doc.content || '{}');
  } catch (e) {
    // Fallback if content isn't valid JSON
    details = { decision: doc.content || doc.summary };
  }

  const decision = details.decision || '';
  const reason = details.reason || '';
  const tags = Array.isArray(details.tags) ? details.tags : [];
  
  const formattedTime = new Date(doc.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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
          <button className="ai-dropdown-item" onClick={() => { setExpandedSummary(true); setShowDropdown(false); }}>
            📖 Open
          </button>
          <button className="ai-dropdown-item" onClick={handleArchive}>
            📦 {doc.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="ai-dropdown-item delete" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      )}

      <div className="ai-doc-header">
        <span className="ai-doc-icon">{icons[doc.type] || '📄'}</span>
        <span className="ai-doc-header-text">{typeLabels[doc.type] || doc.type} Decision</span>
        <span className="ai-doc-time">{formattedTime}</span>
      </div>

      <div className="ai-doc-title-block">
        <div className="ai-doc-label">Title</div>
        <h3 className="ai-doc-title">{doc.title}</h3>
      </div>

      {decision && (
        <div className="ai-doc-section">
          <div className="ai-doc-label">Decision</div>
          <p className="ai-doc-text">{decision}</p>
        </div>
      )}

      {reason && (
        <div className="ai-doc-section">
          <div className="ai-doc-label">Reason</div>
          <p className="ai-doc-text">{reason}</p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="ai-doc-tags">
          {tags.map((tag, i) => (
            <span key={i} className="ai-doc-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Collapsible: Discussion Summary */}
      <div className="ai-doc-collapsible">
        <button 
          className="ai-doc-collapsible-btn" 
          onClick={(e) => { e.stopPropagation(); setExpandedSummary(!expandedSummary); }}
        >
          {expandedSummary ? '▼' : '▶'} Discussion Summary
        </button>
        <AnimatePresence>
          {expandedSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ai-doc-collapsible-content"
            >
              <p className="ai-doc-text">{doc.summary}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsible: Participants */}
      <div className="ai-doc-collapsible">
        <button 
          className="ai-doc-collapsible-btn" 
          onClick={(e) => { e.stopPropagation(); setExpandedParticipants(!expandedParticipants); }}
        >
          {expandedParticipants ? '▼' : '▶'} Participants
        </button>
        <AnimatePresence>
          {expandedParticipants && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ai-doc-collapsible-content"
            >
              <div className="ai-doc-participants">
                {participants.map((p, i) => (
                  <span key={i} className="ai-doc-participant">👤 {p}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsible: Source Conversation */}
      {sourceMessages.length > 0 && (
        <div className="ai-doc-collapsible">
          <button 
            className="ai-doc-collapsible-btn" 
            onClick={(e) => { e.stopPropagation(); setExpandedSource(!expandedSource); }}
          >
            {expandedSource ? '▼' : '▶'} Source Conversation
          </button>
          <AnimatePresence>
            {expandedSource && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ai-doc-collapsible-content"
              >
                <div style={{ marginTop: '4px' }}>
                  {sourceMessages.map((msg, i) => (
                    <div key={i} className="ai-doc-source-msg">
                      <div className="ai-doc-source-icon">💬</div>
                      <div className="ai-doc-source-body">
                        <div className="ai-doc-source-name">{msg.sender_name}</div>
                        <div className="ai-doc-source-text">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
});
AIDocumentCard.displayName = 'AIDocumentCard';

const AIDocumentSection = memo(({ type, socket, roomId }) => {
  const getDocumentsByType = useTaskStore(state => state.getDocumentsByType);
  const docs = getDocumentsByType(type === 'docs' ? 'all' : type);

  if (docs.length === 0) {
    return (
      <div className="ai-panel-empty">
        <div className="ai-panel-empty-icon">📝</div>
        <p>No {type === 'docs' ? 'documents' : type} generated yet. I'll silently document important decisions in the background.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <AnimatePresence>
        {docs.map(doc => (
          <AIDocumentCard key={doc.id} doc={doc} socket={socket} roomId={roomId} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AIDocumentSection.displayName = 'AIDocumentSection';

// ─────────────────────────────────────────────────────────────────────────
// Decisions Tab Components
// ─────────────────────────────────────────────────────────────────────────

const AIDecisionCard = memo(({ decision, socket, roomId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const participants = Array.isArray(decision.participants) ? decision.participants : [];
  const formattedTime = new Date(decision.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleArchive = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('toggle_archive_decision', {
      decisionId: decision.decision_id,
      isArchived: !decision.is_archived,
      roomId
    });
    setShowDropdown(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!socket || !roomId) return;
    socket.emit('soft_delete_decision', {
      decisionId: decision.decision_id,
      roomId
    });
    setShowDropdown(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="ai-decision-card"
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
          <button className="ai-dropdown-item" onClick={() => setShowDropdown(false)}>
            📖 Open
          </button>
          <button className="ai-dropdown-item" onClick={handleArchive}>
            📦 {decision.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="ai-dropdown-item delete" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      )}

      <div className="ai-decision-header">
        <span className="ai-decision-icon">⚡</span>
        <h4 className="ai-decision-title">{decision.title}</h4>
        <span className="ai-decision-time">{formattedTime}</span>
      </div>
      
      <div className="ai-decision-body">
        <div className="ai-decision-arrow">↳</div>
        <div className="ai-decision-content">
          <div className="ai-decision-text">{decision.decision}</div>
          {decision.reason && (
            <div className="ai-decision-reason">
              <span className="ai-decision-label">Reason:</span> {decision.reason}
            </div>
          )}
          {participants.length > 0 && (
            <div className="ai-decision-participants">
              <span className="ai-decision-label">Participants:</span> {participants.join(', ')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
AIDecisionCard.displayName = 'AIDecisionCard';

const AIDecisionSection = memo(({ socket, roomId }) => {
  const getAllDecisions = useTaskStore(state => state.getAllDecisions);
  const decisions = getAllDecisions();

  if (decisions.length === 0) {
    return (
      <div className="ai-panel-empty">
        <div className="ai-panel-empty-icon">⚡</div>
        <p>No project decisions recorded yet. Decisions will appear here as a lightweight timeline.</p>
      </div>
    );
  }

  return (
    <div className="ai-decision-timeline">
      <AnimatePresence>
        {decisions.map(dec => (
          <AIDecisionCard key={dec.decision_id} decision={dec} socket={socket} roomId={roomId} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AIDecisionSection.displayName = 'AIDecisionSection';

// ─────────────────────────────────────────────────────────────────────────
// Trash Section Component
// ─────────────────────────────────────────────────────────────────────────

const AITrashSection = memo(({ socket, roomId, setConfirmDelete }) => {
  const getTrashTasks = useTaskStore(state => state.getTrashTasks);
  const getTrashDocuments = useTaskStore(state => state.getTrashDocuments);
  const getTrashDecisions = useTaskStore(state => state.getTrashDecisions);

  const trashTasks = getTrashTasks();
  const trashDocs = getTrashDocuments();
  const trashDecs = getTrashDecisions();

  const hasItems = trashTasks.length > 0 || trashDocs.length > 0 || trashDecs.length > 0;

  const handleRestore = (id, type) => {
    if (!socket || !roomId) return;
    console.log(`[TRASH] Restoring ${type} id=${id}`);
    if (type === 'task') {
      socket.emit('restore_task', { taskId: id, roomId, actorId: 'user' });
    } else if (type === 'document') {
      socket.emit('restore_document', { docId: id, roomId });
    } else if (type === 'decision') {
      socket.emit('restore_decision', { decisionId: id, roomId });
    }
  };

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
      {trashTasks.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Tasks ({trashTasks.length})</div>
          <AnimatePresence>
            {trashTasks.map(t => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="ai-trash-card"
              >
                <span className="ai-trash-card-type">Task</span>
                <h4 className="ai-trash-card-title">{t.title}</h4>
                <div className="ai-trash-actions">
                  <button className="ai-trash-btn restore" onClick={() => handleRestore(t.id, 'task')}>
                    Restore
                  </button>
                  <button className="ai-trash-btn delete-perm" onClick={() => setConfirmDelete({ id: t.id, type: 'task', title: t.title })}>
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {trashDocs.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Documents ({trashDocs.length})</div>
          <AnimatePresence>
            {trashDocs.map(d => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="ai-trash-card"
              >
                <span className="ai-trash-card-type">{d.type || 'Doc'}</span>
                <h4 className="ai-trash-card-title">{d.title}</h4>
                <div className="ai-trash-actions">
                  <button className="ai-trash-btn restore" onClick={() => handleRestore(d.id, 'document')}>
                    Restore
                  </button>
                  <button className="ai-trash-btn delete-perm" onClick={() => setConfirmDelete({ id: d.id, type: 'document', title: d.title })}>
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {trashDecs.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div className="ai-trash-header">🗑️ Decisions ({trashDecs.length})</div>
          <AnimatePresence>
            {trashDecs.map(d => (
              <motion.div
                key={d.decision_id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="ai-trash-card"
              >
                <span className="ai-trash-card-type">Decision</span>
                <h4 className="ai-trash-card-title">{d.title}</h4>
                <div className="ai-trash-actions">
                  <button className="ai-trash-btn restore" onClick={() => handleRestore(d.decision_id, 'decision')}>
                    Restore
                  </button>
                  <button className="ai-trash-btn delete-perm" onClick={() => setConfirmDelete({ id: d.decision_id, type: 'decision', title: d.title })}>
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
AITrashSection.displayName = 'AITrashSection';

// ─────────────────────────────────────────────────────────────────────────
// AITaskPanel — The slide-in workspace panel with Tabs
// ─────────────────────────────────────────────────────────────────────────

const AUTO_COLLAPSE_MS = 60_000; // Increased to 60s for reading docs

const AITaskPanel = memo(({ socket, roomId, setConfirmDelete }) => {
  const closePanel = useTaskStore(state => state.closePanel);
  const tasksObj = useTaskStore(state => state.tasks);
  const docsObj = useTaskStore(state => state.documents);
  const inactivityTimer = useRef(null);

  const [activeTab, setActiveTab] = useState('tasks');

  // Filter out deleted/archived elements from standard statistics counts
  const totalTasks = Object.values(tasksObj).filter(t => !t.is_deleted && !t.is_archived).length;
  const pendingCount = Object.values(tasksObj).filter(t => t.status === 'pending' && !t.is_deleted && !t.is_archived).length;
  const completedCount = Object.values(tasksObj).filter(t => t.status === 'completed' && !t.is_deleted && !t.is_archived).length;
  const totalDocs = Object.values(docsObj).filter(d => !d.is_deleted && !d.is_archived).length;

  // Auto-collapse on inactivity (Pause auto-collapse if on Trash or editing to avoid frustrating users)
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    if (activeTab === 'trash') return; // Disable auto-collapse on trash
    inactivityTimer.current = setTimeout(() => {
      console.log('[AI PANEL] Auto-collapsing after inactivity');
      closePanel();
    }, AUTO_COLLAPSE_MS);
  }, [closePanel, activeTab]);

  useEffect(() => {
    resetInactivityTimer();
    return () => clearTimeout(inactivityTimer.current);
  }, [resetInactivityTimer, activeTab]); // Reset timer when switching tabs

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
            <span className="ai-panel-status-dot" title="Live sync active" />
          </h2>
          <span className="ai-panel-subtitle">Auto-generated from chat</span>
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
          Tasks
        </button>
        <button className={`ai-tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          Docs
        </button>
        <button className={`ai-tab-btn ${activeTab === 'decision' ? 'active' : ''}`} onClick={() => setActiveTab('decision')}>
          Decisions
        </button>
        <button className={`ai-tab-btn ${activeTab === 'meeting_notes' ? 'active' : ''}`} onClick={() => setActiveTab('meeting_notes')}>
          Notes
        </button>
        <button className={`ai-tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          Summaries
        </button>
        <button className={`ai-tab-btn ${activeTab === 'trash' ? 'active' : ''}`} onClick={() => setActiveTab('trash')} style={{ color: '#f87171' }}>
          🗑️ Trash
        </button>
      </div>

      {/* Stats bar (Only show for active tabs) */}
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
      ) : activeTab === 'trash' ? (
        <div className="ai-panel-stats" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
          <div className="ai-stat-item" style={{ flex: 'none', width: '100%', background: 'transparent', border: 'none' }}>
            <span className="ai-stat-value" style={{ color: '#ef4444' }}>🗑️ Recovery Workspace</span>
            <span className="ai-stat-label" style={{ color: '#fca5a5' }}>Restore items or delete them permanently</span>
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

      {/* Auto-collapse timer visual (Hidden when on Trash) */}
      <div className="ai-panel-timer-bar">
        {activeTab !== 'trash' && (
          <motion.div
            className="ai-panel-timer-bar-fill"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: AUTO_COLLAPSE_MS / 1000, ease: 'linear' }}
            key={activeTab} // Resets on tab change
          />
        )}
      </div>

      {/* Content */}
      <div className="ai-panel-content">
        {activeTab === 'tasks' ? (
          totalTasks === 0 ? (
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
          )
        ) : activeTab === 'decision' ? (
          <AIDecisionSection socket={socket} roomId={roomId} />
        ) : activeTab === 'trash' ? (
          <AITrashSection socket={socket} roomId={roomId} setConfirmDelete={setConfirmDelete} />
        ) : (
          <AIDocumentSection type={activeTab} socket={socket} roomId={roomId} />
        )}
      </div>
    </motion.div>
  );
});
AITaskPanel.displayName = 'AITaskPanel';

// ─────────────────────────────────────────────────────────────────────────
// AINotificationChip — Floating pill notification
// ─────────────────────────────────────────────────────────────────────────

const AINotificationChip = memo(({ latestTask, latestDocument, notificationType, newTaskCount, onOpen, onDismiss }) => {
  const isDoc = notificationType === 'document' && latestDocument;
  
  const getDocMessage = (doc) => {
    switch (doc?.type) {
      case 'decision': return '✨ AI documented an architecture decision';
      case 'architecture': return '✨ AI documented an architecture decision';
      case 'meeting_notes': return '✨ AI generated project notes';
      case 'summary': return '✨ AI generated project notes';
      default: return '✨ AI generated documentation';
    }
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
  const upsertTask = useTaskStore(state => state.upsertTask);
  const setTasks   = useTaskStore(state => state.setTasks);
  const removeTask = useTaskStore(state => state.removeTask);
  const upsertDocument = useTaskStore(state => state.upsertDocument);
  const setDocuments = useTaskStore(state => state.setDocuments);
  const removeDocument = useTaskStore(state => state.removeDocument);
  const upsertDecision = useTaskStore(state => state.upsertDecision);
  const setDecisions = useTaskStore(state => state.setDecisions);
  const removeDecision = useTaskStore(state => state.removeDecision);
  const openPanel  = useTaskStore(state => state.openPanel);
  const closePanel = useTaskStore(state => state.closePanel);
  const dismissNotification = useTaskStore(state => state.dismissNotification);

  const isPanelOpen      = useTaskStore(state => state.isPanelOpen);
  const showNotification = useTaskStore(state => state.showNotification);
  const latestTask       = useTaskStore(state => state.latestTask);
  const latestDocument   = useTaskStore(state => state.latestDocument);
  const notificationType = useTaskStore(state => state.notificationType);
  const newTaskCount     = useTaskStore(state => state.newTaskCount);

  // Global Confirm Delete state
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, type, title }

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

    // Fetch existing tasks and docs on mount
    socket.emit('get_tasks', { roomId }, (tasks) => {
      if (tasks && tasks.length > 0) setTasks(tasks);
    });
    
    socket.emit('get_documents', { roomId }, (docs) => {
      if (docs && docs.length > 0) setDocuments(docs);
    });

    socket.emit('get_decisions', { roomId }, (decs) => {
      if (decs && decs.length > 0) setDecisions(decs);
    });

    const handleTaskCreated = (task) => upsertTask(task);
    const handleTaskUpdated = (task) => upsertTask(task);
    const handleTaskDeleted = ({ taskId }) => {
      console.log('[SOCKET] task_deleted received:', taskId);
      removeTask(taskId);
    };

    const handleDocumentCreated = (doc) => upsertDocument(doc);
    const handleDocumentUpdated = (doc) => upsertDocument(doc);
    const handleDocumentDeleted = ({ docId }) => {
      console.log('[SOCKET] document_deleted received:', docId);
      removeDocument(docId);
    };

    const handleDecisionCreated = (dec) => upsertDecision(dec);
    const handleDecisionUpdated = (dec) => {
      console.log('[SOCKET] decision_updated received:', dec.decision_id);
      upsertDecision(dec);
    };
    const handleDecisionDeleted = ({ decisionId }) => {
      console.log('[SOCKET] decision_deleted received:', decisionId);
      removeDecision(decisionId);
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    socket.on('document_created', handleDocumentCreated);
    socket.on('document_updated', handleDocumentUpdated);
    socket.on('document_deleted', handleDocumentDeleted);

    socket.on('decision_created', handleDecisionCreated);
    socket.on('decision_updated', handleDecisionUpdated);
    socket.on('decision_deleted', handleDecisionDeleted);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);

      socket.off('document_created', handleDocumentCreated);
      socket.off('document_updated', handleDocumentUpdated);
      socket.off('document_deleted', handleDocumentDeleted);

      socket.off('decision_created', handleDecisionCreated);
      socket.off('decision_updated', handleDecisionUpdated);
      socket.off('decision_deleted', handleDecisionDeleted);
    };
  }, [socket, roomId, upsertTask, setTasks, removeTask, upsertDocument, setDocuments, removeDocument, upsertDecision, setDecisions, removeDecision]);

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

