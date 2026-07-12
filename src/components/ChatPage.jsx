"use client";
import React, { useState, useEffect, useRef, useContext, lazy, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useUser, useSupabase } from '@/components/SupabaseProvider';
import MessageBubble from '../MessageBubble';
import AnimatedBackground from '../AnimatedBackground';
import { fetchMessagesApi, sendMessageApi } from '../api/messagesApi';
import { clearOfflineMessages, getOfflineMessages, queueOfflineMessage, saveOfflineMessages } from '../utils/offlineSync';
import '../App.css';
import ThemeContext from '../context/ThemeContext';
import { useChatStore } from '../store/chatStore';
import { useTaskStore } from '../store/taskStore';
import ChatInput from './chat/ChatInput';
import { logout } from '@/app/actions';

const AITaskWorkspace = lazy(() =>
  import('./tasks/AITaskWorkspace.jsx').then((module) => ({
    default: module.AITaskWorkspace,
  }))
);
import { SOCKET_URL, API_BASE_URL } from '../apiConfig';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function mergeMessages(serverMsgs, localMsgs) {
  const map = new Map();

  serverMsgs.forEach(msg => map.set(msg.id, msg));
  localMsgs.forEach(msg => {
    if (!map.has(msg.id)) map.set(msg.id, msg);
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp)
  );
}

const addMessageIfMissing = (currentMessages, incomingMessage) => {
  const duplicateById = incomingMessage.id
    ? currentMessages.some((msg) => msg.id === incomingMessage.id)
    : false;

  const duplicateByPayload = currentMessages.some(
    (msg) =>
      msg.text === incomingMessage.text &&
      msg.sender_id === incomingMessage.sender_id &&
      (msg.timestamp || msg.created_at) === (incomingMessage.timestamp || incomingMessage.created_at)
  );

  if (duplicateById || duplicateByPayload) {
    return currentMessages;
  }

  return [...currentMessages, incomingMessage];
};

const markMessageStatus = (currentMessages, clientId, status) =>
  currentMessages.map((msg) => (msg.clientId === clientId ? { ...msg, status } : msg));

const StatusBadge = ({ mode }) => {
  const badge = {
    server: { text: 'Online Mode', color: 'green' },
    offline: { text: 'Offline Mode', color: 'red' },
  }[mode] || { text: 'Connecting...', color: 'yellow' };

  return (
    <div className={`status-badge ${badge.color}`}>
      <span className="status-dot"></span>
      {badge.text}
    </div>
  );
};

export default function ChatPage() {
  console.count("[RENDER] ChatPage");
  const { user } = useSupabase();
  const { supabase } = useSupabase();
  
const { theme, toggleTheme } = useContext(ThemeContext);
  
  const streamingMessages = useChatStore(state => state.streamingMessages);
  const addStreamStart = useChatStore(state => state.addStreamStart);
  const appendStreamChunk = useChatStore(state => state.appendStreamChunk);
  const finalizeStream = useChatStore(state => state.finalizeStream);
  const wsTotalCount = useTaskStore(state => state.totalCount());
  const wsPendingCount = useTaskStore(state => state.pendingCount());
  
  const currentUserId = user?.id;
  const currentUserIdRef = useRef(currentUserId);
  const currentUserNameRef = useRef('Anonymous');
  const currentUserEmailRef = useRef(null);

  useEffect(() => {
    if (user) {
      currentUserIdRef.current = user.id;
      currentUserNameRef.current = 
        user.user_metadata?.full_name || 
        user.user_metadata?.name || 
        user.email || 
        'Anonymous';
      currentUserEmailRef.current = user.email || null;
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      const syncUserToDB = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token ?? null;
          await fetch(`${API_BASE_URL}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: user.id,
              name: currentUserNameRef.current,
              email: currentUserEmailRef.current,
              avatarUrl
            })
          });
        } catch (error) {
          console.error('Failed to sync user to database:', error);
        }
      };
       syncUserToDB();
     }
  }, [user, supabase]);

     const [messages, setMessages] = useState([]);

     const [loadingMessages, setLoadingMessages] = useState(false);
     const [messageError, setMessageError] = useState('');
     const [isOnline, setIsOnline] = useState(true);
     const [mode, setMode] = useState('server');
     const [queuedCount, setQueuedCount] = useState(0);
     const [roomInput, setRoomInput] = useState('');
     const [activeRoom, setActiveRoom] = useState('');
     const [isThinking, setIsThinking] = useState(false);
     const [socketInstance, setSocketInstance] = useState(null); // live socket for child components
     const [showMemoryDebug, setShowMemoryDebug] = useState(false);
     const [memoryDebugInfo, setMemoryDebugInfo] = useState(null);
     const messageListRef = useRef(null);
     const socketRef = useRef(null);
     const isSyncingOfflineRef = useRef(false);
     const activeRoomRef = useRef('');
     const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);

     const scrollToBottom = useCallback((force = false) => {
       const el = messageListRef.current;
       if (!el) return;
       if (force) {
         requestAnimationFrame(() => {
           el.scrollTop = el.scrollHeight;
         });
         setShowNewMessageIndicator(false);
       } else {
         const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
         if (isNearBottom) {
           requestAnimationFrame(() => {
             el.scrollTop = el.scrollHeight;
           });
         } else {
           setShowNewMessageIndicator(true);
         }
       }
     }, []);

     const handleScroll = useCallback(() => {
       const el = messageListRef.current;
       if (!el) return;
       const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
       if (isNearBottom) {
         setShowNewMessageIndicator(false);
       }
     }, []);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const lastRoomRef = useRef('');
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      if (activeRoom !== lastRoomRef.current) {
        lastRoomRef.current = activeRoom;
        setTimeout(() => scrollToBottom(true), 50);
      }
    }
  }, [messages.length, loadingMessages, activeRoom, scrollToBottom]);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowMemoryDebug(prev => !prev);
        if (!showMemoryDebug && activeRoomRef.current) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/memory/${activeRoomRef.current}`);
            const data = await res.json();
            if (data.success) {
              setMemoryDebugInfo(data);
            }
          } catch (err) {
            console.error("Failed to fetch memory debug info", err);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMemoryDebug, activeRoom]);

   useEffect(() => {
      const savedRoom = localStorage.getItem("roomId");
      if (savedRoom) {
        setRoomInput(savedRoom);
        setActiveRoom(savedRoom);
        activeRoomRef.current = savedRoom;
      }
    }, []);


  useEffect(() => {
    let socket;
    const initSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[SOCKET] Connected:', socket.id);
        setSocketInstance(socket); // expose live socket to child components
        // Re-join room on every connect/reconnect
        if (activeRoomRef.current) {
          socket.emit('join-room', activeRoomRef.current);
          console.log('[SOCKET] Re-joined room on connect:', activeRoomRef.current);
        }
      });

      if (socket.connected) {
        setSocketInstance(socket);
      }

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', () => {
        console.log('[SOCKET] Disconnected');
        setSocketInstance(null);
      });

      socket.on('message-delivered', ({ clientId }) => {
        if (!clientId) return;
        setMessages((prevMessages) => markMessageStatus(prevMessages, clientId, 'delivered'));
      });

    }; // close initSocket

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.off('message-delivered');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
    };
  }, [supabase]);

  // ── Ensure socket always joins the active room ────────────────────────────
  // This runs whenever the socket instance or active room changes.
  // It handles: initial join, room switching, and socket reconnections.
  useEffect(() => {
    if (!socketInstance || !activeRoom) return;
    console.log('[SOCKET] Ensuring join-room:', activeRoom);
    socketInstance.emit('join-room', activeRoom);
  }, [socketInstance, activeRoom]);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    
    const goOnline = () => {
      setIsOnline(true);
    };
    const goOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMode(isOnline ? 'server' : 'offline');
  }, [isOnline]);

  useEffect(() => {
    const queuedMessages = getOfflineMessages(activeRoomRef.current);
    setQueuedCount(queuedMessages.length);
  }, [activeRoom, messages, isOnline]);

  useEffect(() => {
    if (!activeRoom || !socketInstance) return;
    
    const socket = socketInstance;
    const handler = (msg) => {
      if (msg.room_id !== activeRoom && msg.roomId !== activeRoom && msg.room !== activeRoom) return;
      
      if (msg.sender_name === 'ThinkRoom AI' || msg.personaId) {
        setIsThinking(false);
      }
      
      setMessages((prev) => addMessageIfMissing(prev, { ...msg, status: msg.status || 'delivered' }));
      
      const isMine = msg.sender_id === currentUserIdRef.current;
      setTimeout(() => {
        scrollToBottom(isMine);
      }, 50);
    };

    const handleStreamStart = (data) => {
      setIsThinking(false);
      addStreamStart(data);
    };
    const handleStreamEnd = (data) => {
      const msgData = useChatStore.getState().streamingMessages[data.messageId];
      finalizeStream(data);
      setMessages((prev) => addMessageIfMissing(prev, {
        id: data.finalDbId,
        text: data.text,
        sender_name: msgData?.sender || "ThinkRoom AI",
        created_at: data.created_at || new Date().toISOString(),
        room_id: activeRoom,
        status: 'delivered',
        color: msgData?.color,
        personaId: msgData?.personaId
      }));
      setTimeout(() => {
        scrollToBottom(false);
      }, 50);
    };

    const chunkBuffer = {};
    let flushTimer = null;
    const flushChunks = () => {
      flushTimer = null;
      Object.entries(chunkBuffer).forEach(([id, acc]) => {
        if (acc) appendStreamChunk(id, acc);
      });
      for (const k in chunkBuffer) delete chunkBuffer[k];
    };
    const bufferedHandleStreamChunk = (data) => {
      chunkBuffer[data.messageId] = (chunkBuffer[data.messageId] || '') + data.chunk;
      if (!flushTimer) flushTimer = setTimeout(flushChunks, 50);
    };

    socket.on("receive_message", handler);
    socket.on("ai_stream_start", handleStreamStart);
    socket.on("ai_stream_chunk", bufferedHandleStreamChunk);
    socket.on("ai_stream_end", handleStreamEnd);

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      flushChunks();
      socket.off("receive_message", handler);
      socket.off("ai_stream_start", handleStreamStart);
      socket.off("ai_stream_chunk", bufferedHandleStreamChunk);
      socket.off("ai_stream_end", handleStreamEnd);
    };
  }, [activeRoom, socketInstance, addStreamStart, appendStreamChunk, finalizeStream, scrollToBottom]);

useEffect(() => {
    let scrollToBottomTimeout;
    
    async function fetchMessages() {
      if (!activeRoom) return;
      
      setLoadingMessages(true);
      setMessageError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        const allMessages = await fetchMessagesApi(token, activeRoom);
        setMessages((prev) => mergeMessages(allMessages, prev));
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessageError('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
      
      scrollToBottomTimeout = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
    fetchMessages();

    return () => {
      if (scrollToBottomTimeout) clearTimeout(scrollToBottomTimeout);
    };
  }, [activeRoom, scrollToBottom, supabase]);

  useEffect(() => {
    const syncOfflineMessages = async () => {
      if (!isOnline || isSyncingOfflineRef.current) {
        return;
      }

      const queuedMessages = getOfflineMessages(activeRoomRef.current);
      if (queuedMessages.length === 0) {
        return;
      }

      isSyncingOfflineRef.current = true;
      const remainingMessages = [];

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      for (const queuedMessage of queuedMessages) {
        try {
          const savedMessage = await sendMessageApi(
            queuedMessage.text,
            queuedMessage.sender_id,
            token,
            queuedMessage.sender_name,
            activeRoomRef.current,
            queuedMessage.clientId
          );
          socketRef.current?.emit('send_message', {
            ...savedMessage,
            clientId: queuedMessage.clientId,
            status: 'sent',
          });
        } catch (error) {
          console.error('Error syncing offline message:', error);
          remainingMessages.push(queuedMessage);
        }
      }

      if (remainingMessages.length === 0) {
        clearOfflineMessages(activeRoomRef.current);
      } else {
        saveOfflineMessages(activeRoomRef.current, remainingMessages);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        const allMessages = await fetchMessagesApi(token, activeRoomRef.current);
        const pendingMsgs = getOfflineMessages(activeRoomRef.current);
        setMessages((prevMessages) => mergeMessages(allMessages, [...prevMessages, ...pendingMsgs]));
      } catch (error) {
        console.error('Error refreshing messages after offline sync:', error);
      }

      isSyncingOfflineRef.current = false;
    };

    syncOfflineMessages();
  }, [isOnline, supabase]);

  useEffect(() => {
    scrollToBottom(false);
  }, [isThinking, streamingMessages, scrollToBottom]);

  const handleSendMessage = async (messageText) => {
    if (!messageText || messageText.trim() === '') return;

    const textToSend = messageText.trim();
    const clientId = generateUUID();
    const tempMessage = {
      id: clientId,
      clientId,
      text: textToSend,
      timestamp: new Date().toISOString(),
      sender_id: user?.id || currentUserIdRef.current,
      sender_name: currentUserNameRef.current,
      pending: !isOnline,
      status: mode === 'offline' ? 'pending' : 'sending',
      room_id: activeRoomRef.current
    };

    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
    
    setMessageError('');

    if (textToSend.startsWith('@ai') || textToSend.match(/@\w+/)) {
      setIsThinking(true);
    }

    if (mode === 'server') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        const savedMessage = await sendMessageApi(
          textToSend,
          currentUserIdRef.current || user?.id,
          token,
          currentUserNameRef.current,
          activeRoomRef.current,
          clientId
        );
        setMessages((prevMessages) => {
          const withoutTemp = prevMessages.filter((msg) => msg.id !== tempMessage.id);
          const alreadyExists = withoutTemp.some((msg) => msg.id === savedMessage.id);
          return alreadyExists
            ? withoutTemp
            : [...withoutTemp, { ...savedMessage, clientId, status: 'sent' }];
        });
        socketRef.current?.emit('send_message', {
          roomId: activeRoomRef.current,
          message: {
            ...savedMessage,
            clientId,
            status: 'sent',
            room_id: activeRoomRef.current
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        queueOfflineMessage(activeRoomRef.current, {
          clientId,
          text: textToSend,
          sender_id: user?.id || currentUserIdRef.current,
          sender_name: currentUserNameRef.current,
          timestamp: tempMessage.timestamp,
          status: 'pending',
          roomId: activeRoomRef.current,
        });
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempMessage.id ? { ...msg, pending: true, status: 'failed' } : msg
          )
        );
        setMessageError('Message queued offline and will sync when online');
      }
    } else {
      queueOfflineMessage(activeRoomRef.current, {
        clientId,
        text: textToSend,
        sender_id: user?.id || currentUserIdRef.current,
        sender_name: currentUserNameRef.current,
        timestamp: tempMessage.timestamp,
        status: 'pending',
        roomId: activeRoomRef.current,
      });
      setMessages((prevMessages) => markMessageStatus(prevMessages, clientId, 'pending'));
    }
  };

   const handleJoinRoom = () => {
     const roomId = roomInput.trim();
     if (!roomId || !socketRef.current) {
       return;
     }

     if (activeRoomRef.current) {
       socketRef.current.emit("leave-room", activeRoomRef.current);
     }

     console.log('Joining room:', roomId);
     activeRoomRef.current = roomId;
     setMessages([]);
     setActiveRoom(roomId);
     (typeof window !== "undefined" ? localStorage.setItem.bind(localStorage) : () => {})("roomId", roomId);
     socketRef.current.emit('join-room', roomId);
   };

  const handleLeaveRoom = () => {
    if (activeRoomRef.current && socketRef.current) {
      socketRef.current.emit("leave-room", activeRoomRef.current);
    }
    activeRoomRef.current = '';
    setActiveRoom('');
    setRoomInput('');
    setMessages([]);
    (typeof window !== "undefined" ? localStorage.removeItem.bind(localStorage) : () => {})("roomId");
  };

  const handleRecap = () => {
    if (!activeRoom || !socketRef.current) return;
    
    socketRef.current.emit('request_summary', { 
      roomId: activeRoom, 
      summaryType: 'catch_up',
      requestorName: currentUserNameRef.current
    });
  };

  const isOffline = mode === 'offline';

  return (
    <div className="app-workspace">
      <div className="chat-page-container">

        {/* ── Command Center ── */}
        <header className="command-center">
          <div className="cmd-main-row">
            {/* LEFT */}
            <div className="cmd-left">
              <div className="cmd-brand">
                <motion.div
                  className="cmd-brand-dot"
                  animate={{ boxShadow: ['0 0 12px rgba(139,92,246,0.35)', '0 0 20px rgba(139,92,246,0.5)', '0 0 12px rgba(139,92,246,0.35)'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />
                <span className="cmd-brand-text">ThinkRoom</span>
              </div>
              {activeRoom && (
                <div className="cmd-room-pill">
                  <span className="hash">#</span>
                  <span className="rname">{activeRoom}</span>
                  <button type="button" className="cmd-leave-btn" onClick={handleLeaveRoom} title="Leave room">✕</button>
                </div>
              )}
            </div>

            {/* CENTER */}
            <div className="cmd-center">
              {activeRoom && (
                <>
                  <div className="cmd-room-title">#{activeRoom}</div>
                  <div className="cmd-meta-row">
                    <div className={`cmd-live ${isOffline ? 'offline' : ''}`}>
                      <span className="cmd-live-dot" />
                      <span>{isOffline ? 'Offline' : 'Connected'}</span>
                    </div>
                    <span className="cmd-sep" />
                    <span className="cmd-meta-text">
                      {isOffline ? 'no connection' : 'Live \u2022 25ms'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT */}
            <div className="cmd-right">
              {activeRoom && (
                <motion.button
                  className="cmd-ws-btn"
                  onClick={() => useTaskStore.getState().togglePanel()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  title="AI Workspace"
                >
                  <span className="ws-sparkle">✨</span>
                  <span className="ws-label">Workspace</span>
                  {wsTotalCount > 0 && (
                    <span className="ws-count">{wsTotalCount}</span>
                  )}
                  {wsPendingCount > 0 && (
                    <motion.span
                      className="ws-pending"
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </motion.button>
              )}
              <motion.button
                className="cmd-btn cmd-btn-icon"
                onClick={toggleTheme}
                title="Toggle theme"
                whileHover={{ rotate: 15 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </motion.button>
              <motion.div
                className="cmd-avatar"
                whileHover={{ scale: 1.05 }}
                title={currentUserNameRef.current || 'User'}
              >
                {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                  <img src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="" />
                ) : (
                  (currentUserNameRef.current?.[0] || user?.email?.[0] || '?').toUpperCase()
                )}
              </motion.div>
              <form action={logout}>
                <motion.button
                  type="submit"
                  className="cmd-btn cmd-btn-icon"
                  title="Sign Out"
                  whileHover={{ scale: 1.05 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </motion.button>
              </form>
            </div>
          </div>

          {/* ── Info Strip ── */}
          {activeRoom && (
            <div className="cmd-info-strip">
              <span className="cmd-pill">
                <span className="pill-dot green" />
                <span className="pill-count">{messages.length}</span> messages
              </span>
              <span className="cmd-pill">
                <span className={`pill-dot ${isThinking ? 'purple' : 'gray'}`} />
                AI {isThinking ? 'thinking\u2026' : 'active'}
              </span>
              <span className="cmd-pill">
                <span className={`pill-dot ${socketInstance ? 'green' : 'gray'}`} />
                Socket {socketInstance ? 'connected' : 'disconnected'}
              </span>
              <span className="cmd-pill">
                <span className="pill-dot blue" />
                Private room
              </span>
              {queuedCount > 0 && (
                <span className="cmd-pill">
                  <span className="pill-dot yellow" />
                  {queuedCount} queued
                </span>
              )}
            </div>
          )}
        </header>

        {/* ── Body ── */}
        <div className="chat-body">
          {!activeRoom ? (
            <div className="join-prompt">
              <div className="join-prompt-card">
                <div className="join-prompt-icon">✦</div>
                <h2 className="join-prompt-title">Join a Room</h2>
                <p className="join-prompt-subtitle">Enter a room ID to start collaborating with your team</p>
                <div className="join-prompt-input-group">
                  <input
                    type="text"
                    className="join-prompt-input"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="e.g. project-alpha"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  />
                  <button type="button" className="join-prompt-btn" onClick={handleJoinRoom}>
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-main">
              <AnimatedBackground />
              <div className="conversation-column">
                <div className="message-list" ref={messageListRef} onScroll={handleScroll}>
                  {loadingMessages ? (
                    <div className="empty-state">Loading messages...</div>
                  ) : messageError ? (
                    <div className="empty-state">{messageError}</div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, idx) => {
                      const isMine = msg.sender_id === currentUserId;
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const groupedWithPrev = prevMsg &&
                        prevMsg.sender_id === msg.sender_id &&
                        !msg.isStreaming && !prevMsg.isStreaming &&
                        new Date(msg.created_at || msg.timestamp) - new Date(prevMsg.created_at || prevMsg.timestamp) < 120000;
                      return (
                        <MessageBubble
                          key={msg.id ?? `${msg.created_at || msg.timestamp}-${msg.text}`}
                          message={msg}
                          isOwnMessage={isMine}
                          groupedWithPrev={groupedWithPrev}
                        />
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">✦</div>
                      <h2 className="empty-title">Welcome to #{activeRoom}</h2>
                      <p className="empty-subtitle">No messages yet. Start the conversation.</p>
                    </div>
                  )}
                  {Object.values(streamingMessages).map(streamMsg => (
                    <MessageBubble
                      key={`stream-${streamMsg.id}`}
                      message={streamMsg}
                      isOwnMessage={false}
                    />
                  ))}
                  {isThinking && (
                    <div className="ai-thinking">
                      <span>ThinkRoom AI is processing</span>
                      <div className="thinking-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>

                {showNewMessageIndicator && (
                  <button
                    type="button"
                    className="new-messages-indicator"
                    onClick={() => scrollToBottom(true)}
                  >
                    New Messages ↓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Floating Composer ── */}
        {activeRoom && (
          <div className="composer-area">
            <ChatInput
              onSendMessage={handleSendMessage}
              socket={socketInstance}
              roomId={activeRoom}
              userName={currentUserNameRef.current}
              placeholder="Message ThinkRoom AI..."
            />
          </div>
        )}

        {/* ── Recap FAB ── */}
        {activeRoom && (
          <button type="button" className="recap-fab" onClick={handleRecap} title="Catch Me Up">
            ✨
          </button>
        )}

        <Suspense fallback={<div className="ai-workspace-loading">Loading AI Workspace...</div>}>
          <AITaskWorkspace socket={socketInstance} roomId={activeRoom} />
        </Suspense>

        {showMemoryDebug && memoryDebugInfo && (
          <div className="memory-debug-panel">
            <div className="memory-debug-header">
              <h3 className="memory-debug-title">🧠 Room Memory</h3>
              <button className="memory-debug-close" onClick={() => setShowMemoryDebug(false)}>✕</button>
            </div>
            <div className="memory-debug-meta">
              <strong>Tokens:</strong> {memoryDebugInfo.tokenCount} &middot;
              <strong>Updated:</strong> {new Date(memoryDebugInfo.updatedAt).toLocaleTimeString()}
            </div>
            <pre className="memory-debug-content">{memoryDebugInfo.contextString}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
