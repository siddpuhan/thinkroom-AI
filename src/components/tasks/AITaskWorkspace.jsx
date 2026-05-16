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

const AITaskCard = memo(({ task, socket, roomId }) => {
  const optimisticUpdateStatus = useTaskStore(state => state.optimisticUpdateStatus);

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

  const assignedName = task.assignedToName || task.assigned_to_name || task.assigned_to || null;
  const priorityClass = task.priority || 'medium';
  const isCompleted = task.status === 'completed';
  const deadlineLabel = formatDeadline(task.deadline);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`ai-task-card priority-${priorityClass} ${isCompleted ? 'completed' : ''}`}
    >
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
      .filter(t => t.status === status)
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

const AIDocumentCard = memo(({ doc }) => {
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedParticipants, setExpandedParticipants] = useState(false);
  const [expandedSource, setExpandedSource] = useState(false);

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="ai-doc-card"
    >
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

const AIDocumentSection = memo(({ type }) => {
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
          <AIDocumentCard key={doc.id} doc={doc} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AIDocumentSection.displayName = 'AIDocumentSection';

// ─────────────────────────────────────────────────────────────────────────
// Decisions Tab Components
// ─────────────────────────────────────────────────────────────────────────

const AIDecisionCard = memo(({ decision }) => {
  const participants = Array.isArray(decision.participants) ? decision.participants : [];
  
  const formattedTime = new Date(decision.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="ai-decision-card"
    >
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

const AIDecisionSection = memo(() => {
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
          <AIDecisionCard key={dec.decision_id} decision={dec} />
        ))}
      </AnimatePresence>
    </div>
  );
});
AIDecisionSection.displayName = 'AIDecisionSection';

// ─────────────────────────────────────────────────────────────────────────
// AITaskPanel — The slide-in workspace panel with Tabs
// ─────────────────────────────────────────────────────────────────────────

const AUTO_COLLAPSE_MS = 60_000; // Increased to 60s for reading docs

const AITaskPanel = memo(({ socket, roomId }) => {
  const closePanel = useTaskStore(state => state.closePanel);
  const tasksObj = useTaskStore(state => state.tasks);
  const docsObj = useTaskStore(state => state.documents);
  const inactivityTimer = useRef(null);

  const [activeTab, setActiveTab] = useState('tasks');

  const totalTasks = Object.keys(tasksObj).length;
  const pendingCount = Object.values(tasksObj).filter(t => t.status === 'pending').length;
  const completedCount = Object.values(tasksObj).filter(t => t.status === 'completed').length;
  const totalDocs = Object.keys(docsObj).length;

  // Auto-collapse on inactivity
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      console.log('[AI PANEL] Auto-collapsing after inactivity');
      closePanel();
    }, AUTO_COLLAPSE_MS);
  }, [closePanel]);

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
      </div>

      {/* Stats bar (Only show for tasks) */}
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
        <motion.div
          className="ai-panel-timer-bar-fill"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: AUTO_COLLAPSE_MS / 1000, ease: 'linear' }}
          key={Date.now()} // Resets on re-render
        />
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
          <AIDecisionSection />
        ) : (
          <AIDocumentSection type={activeTab} />
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
  const upsertDocument = useTaskStore(state => state.upsertDocument);
  const setDocuments = useTaskStore(state => state.setDocuments);
  const upsertDecision = useTaskStore(state => state.upsertDecision);
  const setDecisions = useTaskStore(state => state.setDecisions);
  const openPanel  = useTaskStore(state => state.openPanel);
  const closePanel = useTaskStore(state => state.closePanel);
  const dismissNotification = useTaskStore(state => state.dismissNotification);

  const isPanelOpen      = useTaskStore(state => state.isPanelOpen);
  const showNotification = useTaskStore(state => state.showNotification);
  const latestTask       = useTaskStore(state => state.latestTask);
  const latestDocument   = useTaskStore(state => state.latestDocument);
  const notificationType = useTaskStore(state => state.notificationType);
  const newTaskCount     = useTaskStore(state => state.newTaskCount);

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
    const handleDocumentCreated = (doc) => upsertDocument(doc);
    const handleDocumentUpdated = (doc) => upsertDocument(doc);
    const handleDecisionCreated = (dec) => upsertDecision(dec);

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('document_created', handleDocumentCreated);
    socket.on('document_updated', handleDocumentUpdated);
    socket.on('decision_created', handleDecisionCreated);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('document_created', handleDocumentCreated);
      socket.off('document_updated', handleDocumentUpdated);
      socket.off('decision_created', handleDecisionCreated);
    };
  }, [socket, roomId, upsertTask, setTasks, upsertDocument, setDocuments, upsertDecision, setDecisions]);

  // ── Reset state on room change ───────────────────────────
  useEffect(() => {
    closePanel();
    dismissNotification();
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
              <AITaskPanel socket={socket} roomId={roomId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});
AITaskWorkspace.displayName = 'AITaskWorkspace';
