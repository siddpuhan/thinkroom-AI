import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from './TaskCard.jsx';
import { useTaskStore } from '../../store/taskStore.js';

export const TaskColumn = ({ title, status }) => {
  const tasksObj = useTaskStore(state => state.tasks);
  
  const tasks = useMemo(() => {
    return Object.values(tasksObj)
      .filter(t => t.status === status)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [tasksObj, status]);

  return (
    <div className="task-column">
      <div className="task-column-header">
        <h3 className="task-column-title">{title}</h3>
        <span className="task-column-count">{tasks.length}</span>
      </div>
      
      <div className="task-column-list">
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TaskCard task={task} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="task-empty">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
};
