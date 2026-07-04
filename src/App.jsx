// ThinkRoom AI
import React, { useState, useEffect, useRef, useContext, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth, useUser, UserButton } from '@clerk/clerk-react';
import MessageBubble from './MessageBubble';
import AnimatedBackground from './AnimatedBackground';
import { fetchMessagesApi, sendMessageApi } from './api/messagesApi';
import { clearOfflineMessages, getOfflineMessages, queueOfflineMessage, saveOfflineMessages } from './utils/offlineSync';
import './App.css';
import LandingPage from './LandingPage';
import ResourceBoard from './ResourceBoard';
import NetworkStatus from './components/NetworkStatus';
import ThemeContext, { ThemeProvider } from './context/ThemeContext';
import { useChatStore } from './store/chatStore';
import ChatInput from './components/chat/ChatInput';
import { WorkspaceToggleButton } from './components/tasks/WorkspaceToggleButton.jsx';

const AITaskWorkspace = lazy(() =>
  import('./components/tasks/AITaskWorkspace.jsx').then((module) => ({
    default: module.AITaskWorkspace,
  }))
);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin.replace(/:\d+$/, ':5000');


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




function App() {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onEnterChat={() => navigate('/chat')}
              onEnterResources={() => navigate('/resources')}
            />
          }
        />
        <Route 
          path="/chat" 
          element={
            <>
              <SignedIn>
                <ChatPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/resources" 
          element={
            <>
              <SignedIn>
                <ResourceBoard onBack={() => navigate('/')} />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } 
        />
      </Routes>
    </ThemeProvider>
  );
}

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

function ChatPage() {
  console.count("[RENDER] ChatPage");
  const { user } = useUser();
  const { getToken } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  const streamingMessages = useChatStore(state => state.streamingMessages);
  const addStreamStart = useChatStore(state => state.addStreamStart);
  const appendStreamChunk = useChatStore(state => state.appendStreamChunk);
  const finalizeStream = useChatStore(state => state.finalizeStream);
  
  const currentUserIdRef = useRef(null);
  const currentUserId = user?.id;
  const currentUserNameRef = useRef('Anonymous');
  const currentUserEmailRef = useRef(null);

  useEffect(() => {
    if (user) {
      currentUserIdRef.current = user.id;
      currentUserNameRef.current = 
        user.fullName || 
        user.username || 
        user.primaryEmailAddress?.emailAddress || 
        'Anonymous';
      currentUserEmailRef.current = user.primaryEmailAddress?.emailAddress || null;

      // Sync user to Supabase users table
      const syncUserToDB = async () => {
        try {
          const token = await getToken();
          await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: user.id,
              name: currentUserNameRef.current,
              email: currentUserEmailRef.current
            })
          });
        } catch (error) {
          console.error('Failed to sync user to database:', error);
        }
      };
       syncUserToDB();
     }
  }, [user, getToken]);

     const [messages, setMessages] = useState([]);

     const [loadingMessages, setLoadingMessages] = useState(false);
     const [messageError, setMessageError] = useState('');
     const [isOnline, setIsOnline] = useState(navigator.onLine);
     const [mode, setMode] = useState(navigator.onLine ? 'server' : 'offline');
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

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);



  useEffect(() => {
    console.log('navigator.onLine (initial):', navigator.onLine);
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowMemoryDebug(prev => !prev);
        if (!showMemoryDebug && activeRoomRef.current) {
          try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin.replace(/:\d+$/, ':5000');
            const res = await fetch(`${baseUrl}/api/memory/${activeRoomRef.current}`);
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
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SOCKET] Connected:', socket.id);
      setSocketInstance(socket); // expose live socket to child components
      if (activeRoomRef.current) {
        socket.emit('join-room', activeRoomRef.current);
      }
    });

    // If socket connects before the listener is registered (fast connections), set it immediately
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

    return () => {
      socket.off('receive_message');
      socket.off('message-delivered');
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, []);




  useEffect(() => {
    const goOnline = () => {
      console.log('ONLINE EVENT');
      console.log('navigator.onLine:', navigator.onLine);
      setIsOnline(true);
    };
    const goOffline = () => {
      console.log('OFFLINE EVENT');
      console.log('navigator.onLine:', navigator.onLine);
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
      if (!navigator.onLine) {
        console.log('Polling detected offline; navigator.onLine:', navigator.onLine);
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
    console.log('MODE CHANGED:', mode);
  }, [mode]);


  useEffect(() => {
    if (!activeRoom || !socketRef.current) return;
    
    const socket = socketRef.current;
    const handler = (msg) => {
      if (msg.room_id !== activeRoom && msg.roomId !== activeRoom && msg.room !== activeRoom) return;
      
      // If the AI replied, stop the thinking animation
      if (msg.sender_name === 'ThinkRoom AI' || msg.personaId) {
        setIsThinking(false);
      }
      
      setMessages((prev) => addMessageIfMissing(prev, { ...msg, status: msg.status || 'delivered' }));
    };

    const handleStreamStart = (data) => {
      setIsThinking(false);
      addStreamStart(data);
    };
    const handleStreamChunk = (data) => appendStreamChunk(data.messageId, data.chunk);
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
    };

    socket.on("receive_message", handler);
    socket.on("ai_stream_start", handleStreamStart);
    socket.on("ai_stream_chunk", handleStreamChunk);
    socket.on("ai_stream_end", handleStreamEnd);

    return () => {
      socket.off("receive_message", handler);
      socket.off("ai_stream_start", handleStreamStart);
      socket.off("ai_stream_chunk", handleStreamChunk);
      socket.off("ai_stream_end", handleStreamEnd);
    };
  }, [activeRoom, addStreamStart, appendStreamChunk, finalizeStream]);

  useEffect(() => {
    async function fetchMessages() {
      if (!activeRoom) return;
      
      setLoadingMessages(true);
      setMessageError('');
      try {
        const token = await getToken();
        const allMessages = await fetchMessagesApi(token, activeRoom);
        setMessages((prev) => mergeMessages(allMessages, prev));
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessageError('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [activeRoom, getToken]);


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

      const token = await getToken();
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
        const token = await getToken();
        const allMessages = await fetchMessagesApi(token, activeRoomRef.current);
        const pendingMsgs = getOfflineMessages(activeRoomRef.current);
        setMessages((prevMessages) => mergeMessages(allMessages, [...prevMessages, ...pendingMsgs]));
      } catch (error) {
        console.error('Error refreshing messages after offline sync:', error);
      }

      isSyncingOfflineRef.current = false;
    };

    syncOfflineMessages();
  }, [isOnline, getToken]);


  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    // Only auto-scroll if user is already near the bottom (within 150px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, isThinking, streamingMessages]);


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
    
    setMessageError('');

    // If message mentions a persona or @ai, show thinking indicator
    if (textToSend.startsWith('@ai') || textToSend.match(/@\w+/)) {
      setIsThinking(true);
    }

    if (mode === 'server') {
      try {
        const token = await getToken();
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
     localStorage.setItem("roomId", roomId);
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
    localStorage.removeItem("roomId");
  };

  const handleRecap = () => {
    if (!activeRoom || !socketRef.current) return;
    
    socketRef.current.emit('request_summary', { 
      roomId: activeRoom, 
      summaryType: 'catch_up',
      requestorName: currentUserNameRef.current
    });
  };

  return (
    <div className="chat-page-container">
      <AnimatedBackground />
       <header className="chat-header">
         <h1>ThinkRoom AI {activeRoom ? `- Room: ${activeRoom}` : '- Global Chat'}</h1>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <NetworkStatus queuedCount={queuedCount} />
           <UserButton afterSignOutUrl="/" />
           <button 
             onClick={toggleTheme}
             className="chat-button-subtle"
             title="Toggle dark/light mode"
           >
             {theme === 'dark' ? '☀️' : '🌙'}
           </button>
         </div>
       </header>

      <div className="chat-controls-bar">
        <div className="chat-controls">
          <input
            type="text"
            className="chat-input-room"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button type="button" className="chat-button" onClick={handleJoinRoom}>
            Join Room
          </button>
          {activeRoom && (
            <button type="button" className="recap-button" onClick={handleRecap}>
              ✨ Catch Me Up
            </button>
          )}
          <button type="button" className="chat-button-secondary" onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusBadge mode={mode} />
          {activeRoom && <WorkspaceToggleButton />}
        </div>
      </div>

        <div className="chat-main-area">
          <div className="chat-container">
            <div className="chat-layout">
              <div className="chat-content">
                <div className="message-list" ref={messageListRef}>
                {loadingMessages ? (
                  <div className="empty-state">Loading messages...</div>
                ) : messageError ? (
                  <div className="empty-state">{messageError}</div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;
                    return (
                      <MessageBubble
                        key={msg.id ?? `${msg.created_at || msg.timestamp}-${msg.text}`}
                        message={msg}
                        isOwnMessage={isMine}
                      />
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <h2>Welcome!</h2>
                    <p>No messages yet. Start the conversation or join a room.</p>
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
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>
              <ChatInput
                onSendMessage={handleSendMessage}
                socket={socketInstance}
                roomId={activeRoom}
                userName={currentUserNameRef.current}
                placeholder="Message ThinkRoom AI..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Task Workspace — adaptive overlay, appears only when tasks are detected.
          Uses socketInstance (set on socket 'connect' event) for reliability. */}
      <Suspense fallback={<div className="ai-workspace-loading">Loading AI Workspace...</div>}>
        <AITaskWorkspace socket={socketInstance} roomId={activeRoom} />
      </Suspense>

      {/* Developer Memory Debug UI */}
      {showMemoryDebug && memoryDebugInfo && (
        <div style={{
          position: 'fixed', bottom: 20, left: 20, width: '400px', maxHeight: '60vh',
          backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
          padding: '16px', color: '#f8fafc', zIndex: 9999, overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#38bdf8' }}>🧠 Room Memory Debug</h3>
            <button onClick={() => setShowMemoryDebug(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✖</button>
          </div>
          <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <strong>Tokens (Chars):</strong> {memoryDebugInfo.tokenCount} <br/>
            <strong>Last Updated:</strong> {new Date(memoryDebugInfo.updatedAt).toLocaleTimeString()}
          </div>
          <pre style={{ 
            fontSize: '0.75rem', whiteSpace: 'pre-wrap', background: '#0f172a', 
            padding: '12px', borderRadius: '4px', overflowX: 'hidden'
          }}>
            {memoryDebugInfo.contextString}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
