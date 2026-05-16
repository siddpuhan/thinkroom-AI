import React from 'react';
import { motion } from 'framer-motion';

export const TaskCard = ({ task }) => {
  const priorityClass = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent'
  };

  return (
    <div className="task-card">
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        {task.ai_generated && (
          <span className="task-ai-badge">AI ✨</span>
        )}
      </div>
      
      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <div>
          {task.assigned_to ? (
            <span className="task-assignee">@{task.assigned_to}</span>
          ) : (
            <span className="task-unassigned">Unassigned</span>
          )}
        </div>
        <span className={`task-priority ${priorityClass[task.priority] || priorityClass.medium}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
};
