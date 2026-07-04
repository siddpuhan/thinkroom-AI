import React, { useEffect } from 'react';
import { TaskColumn } from './TaskColumn.jsx';
import { useTaskStore } from '../../store/taskStore.js';
import './TaskSidebar.css';

export const TaskSidebar = ({ roomId, socket }) => {
  const setTasks = useTaskStore(state => state.setTasks);
  const upsertTask = useTaskStore(state => state.upsertTask);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('get_tasks', { roomId }, (tasks) => {
      if (tasks && tasks.length) setTasks(tasks);
    });

    const handleTaskCreated = (task) => {
      upsertTask(task);
    };

    const handleTaskUpdated = (task) => {
      upsertTask(task);
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
    };
  }, [socket, roomId, setTasks, upsertTask]);

  if (!roomId) return null;

  return (
    <div className="task-sidebar-container">
      <div className="task-sidebar-header">
        <h2>
          <span>Tasks</span>
          <span className="task-ai-badge">AI AUTO-SYNC ✨</span>
        </h2>
      </div>
      
      <div className="task-sidebar-content custom-scrollbar">
        <TaskColumn title="Pending" status="pending" />
        <TaskColumn title="In Progress" status="in_progress" />
        <TaskColumn title="Completed" status="completed" />
      </div>
    </div>
  );
};
