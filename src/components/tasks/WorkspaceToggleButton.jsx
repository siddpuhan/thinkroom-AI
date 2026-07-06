"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import './WorkspaceToggleButton.css';

export const WorkspaceToggleButton = () => {
  const togglePanel = useTaskStore(state => state.togglePanel);
  const getTotalCount = useTaskStore(state => state.getTotalCount);
  const getPendingCount = useTaskStore(state => state.getPendingCount);
  const latestTask = useTaskStore(state => state.latestTask);
  
  const totalCount = getTotalCount();
  const pendingCount = getPendingCount();

  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (latestTask) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [latestTask]);

  return (
    <motion.button
      className={`workspace-toggle-btn ${pulse ? 'pulse-anim' : ''}`}
      onClick={togglePanel}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Toggle AI Workspace"
    >
      <span className="wtb-icon">✨</span>
      <span className="wtb-label">AI Workspace</span>
      <span className="wtb-count">({totalCount})</span>
      {pendingCount > 0 && <span className="wtb-indicator">🔴</span>}
    </motion.button>
  );
};
