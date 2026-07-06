"use client";
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import './NotesSection.css';

const NOTE_META = {
  reminder: { label: 'Reminder', icon: '⏰', accent: '#fb923c', color: '#fb923c' },
  idea: { label: 'Idea', icon: '💡', accent: '#a78bfa', color: '#c084fc' },
  risk: { label: 'Risk', icon: '⚠️', accent: '#f87171', color: '#f87171' },
  observation: { label: 'Observation', icon: '👀', accent: '#38bdf8', color: '#38bdf8' },
  resource: { label: 'Resource', icon: '🔗', accent: '#34d399', color: '#34d399' },
};

const STATUS_FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'trash', label: 'Trash' },
];

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'reminder', label: 'Reminders' },
  { key: 'idea', label: 'Ideas' },
  { key: 'risk', label: 'Risks' },
  { key: 'observation', label: 'Observations' },
  { key: 'resource', label: 'Resources' },
];

const NoteCard = memo(({ note, socket, roomId, viewMode }) => {
  const meta = NOTE_META[(note.type || '').toLowerCase()] || {
    label: note.type || 'Note',
    icon: '📝',
    accent: '#60a5fa',
    color: '#60a5fa',
  };

  const formattedTime = new Date(note.created_at || note.updated_at || Date.now()).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleArchive = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('toggle_archive_note', {
      noteId: note.id,
      isArchived: !note.archived_at,
      roomId,
    });
  }, [socket, roomId, note.id, note.archived_at]);

  const handleDelete = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('soft_delete_note', {
      noteId: note.id,
      roomId,
    });
  }, [socket, roomId, note.id]);

  const handleRestore = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('restore_note', {
      noteId: note.id,
      roomId,
    });
  }, [socket, roomId, note.id]);

  const handlePermanentDelete = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('hard_delete_note', {
      noteId: note.id,
      roomId,
    });
  }, [socket, roomId, note.id]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="ai-note-card"
      style={{ '--note-accent': meta.accent, '--note-color': meta.color }}
    >
      <div className="ai-note-card-header">
        <div className="ai-note-card-title-row">
          <div className="ai-note-icon" aria-hidden="true">{meta.icon}</div>
          <div className="ai-note-title-wrap">
            <span className="ai-note-type">{meta.label}</span>
            <h3 className="ai-note-title">{note.title}</h3>
          </div>
        </div>
        <div className="ai-note-time">{formattedTime}</div>
      </div>

      <div className="ai-note-content">{note.content || note.title}</div>

      <div className="ai-note-meta-row">
        <span className="ai-note-meta-pill">Confidence {(Number(note.confidence || 0) * 100).toFixed(0)}%</span>
        {note.archived_at && <span className="ai-note-meta-pill">Archived</span>}
        {note.deleted_at && <span className="ai-note-meta-pill">Deleted</span>}
      </div>

      <div className="ai-note-actions">
        {viewMode === 'trash' ? (
          <>
            <button type="button" className="ai-note-btn restore" onClick={handleRestore}>Restore</button>
            <button type="button" className="ai-note-btn delete" onClick={handlePermanentDelete}>Delete Permanently</button>
          </>
        ) : (
          <>
            <button type="button" className="ai-note-btn archive" onClick={handleArchive}>
              {note.archived_at ? 'Unarchive' : 'Archive'}
            </button>
            <button type="button" className="ai-note-btn delete" onClick={handleDelete}>Delete</button>
          </>
        )}
      </div>
    </motion.article>
  );
});

NoteCard.displayName = 'NoteCard';

export const NotesSection = memo(({ socket, roomId }) => {
  const notesObj = useTaskStore((state) => state.notes);
  const setNotes = useTaskStore((state) => state.setNotes);
  const upsertNote = useTaskStore((state) => state.upsertNote);
  const removeNote = useTaskStore((state) => state.removeNote);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    setNotes([]);
    if (!socket || !roomId) return;

    socket.emit('get_notes', { roomId }, (notes) => {
      setNotes(Array.isArray(notes) ? notes : []);
    });

    const handleCreated = (note) => upsertNote(note);
    const handleUpdated = (note) => upsertNote(note);
    const handleDeleted = ({ noteId }) => removeNote(noteId);

    socket.on('note_created', handleCreated);
    socket.on('note_updated', handleUpdated);
    socket.on('note_deleted', handleDeleted);

    return () => {
      socket.off('note_created', handleCreated);
      socket.off('note_updated', handleUpdated);
      socket.off('note_deleted', handleDeleted);
    };
  }, [socket, roomId, setNotes, upsertNote, removeNote]);

  const notes = useMemo(() => Object.values(notesObj || {}), [notesObj]);

  const visibleNotes = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return notes
      .filter((note) => {
        const isDeleted = Boolean(note.deleted_at);
        const isArchived = Boolean(note.archived_at);

        if (statusFilter === 'active' && (isDeleted || isArchived)) return false;
        if (statusFilter === 'archived' && (!isArchived || isDeleted)) return false;
        if (statusFilter === 'trash' && !isDeleted) return false;

        if (typeFilter !== 'all' && (note.type || '').toLowerCase() !== typeFilter) return false;

        if (!term) return true;

        const haystack = `${note.title || ''} ${note.content || ''} ${note.type || ''}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0));
  }, [notes, searchQuery, statusFilter, typeFilter]);

  const activeCount = notes.filter((note) => !note.deleted_at && !note.archived_at).length;
  const archivedCount = notes.filter((note) => !note.deleted_at && note.archived_at).length;
  const trashCount = notes.filter((note) => Boolean(note.deleted_at)).length;

  return (
    <div className="ai-notes-shell">
      <div className="ai-notes-toolbar">
        <div className="ai-notes-search-row">
          <input
            className="ai-notes-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, content, or type..."
          />
        </div>

        <div className="ai-notes-filter-group">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`ai-notes-chip ${statusFilter === item.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ai-notes-filter-group">
          {TYPE_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`ai-notes-chip ${typeFilter === item.key ? 'active' : ''}`}
              onClick={() => setTypeFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ai-notes-summary">
          <div className="ai-notes-summary-card">
            <span className="ai-notes-summary-label">Active</span>
            <span className="ai-notes-summary-value">{activeCount}</span>
          </div>
          <div className="ai-notes-summary-card">
            <span className="ai-notes-summary-label">Archived</span>
            <span className="ai-notes-summary-value">{archivedCount}</span>
          </div>
          <div className="ai-notes-summary-card">
            <span className="ai-notes-summary-label">Trash</span>
            <span className="ai-notes-summary-value">{trashCount}</span>
          </div>
        </div>
      </div>

      {visibleNotes.length === 0 ? (
        <div className="ai-note-empty">
          <div className="ai-note-empty-icon">🗒️</div>
          <h3 className="ai-note-empty-title">No notes match your filters</h3>
          <p className="ai-note-empty-copy">
            Chat normally and the notes engine will capture reminders, ideas, risks, observations, and resources.
          </p>
        </div>
      ) : (
        <div className="ai-notes-list">
          <AnimatePresence>
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                socket={socket}
                roomId={roomId}
                viewMode={statusFilter}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

NotesSection.displayName = 'NotesSection';