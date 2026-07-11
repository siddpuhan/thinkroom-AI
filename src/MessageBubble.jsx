import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Check, Zap } from 'lucide-react';

const MarkdownRenderer = lazy(() => import('./components/MarkdownRenderer'));

const AI_PERSONAS = [
  "Senior Architect",
  "Lead Designer",
  "Cybersec Engineer",
  "Product Manager",
  "Friendly Mentor",
  "Root-Cause Analyst",
  "ThinkRoom AI"
];

const PERSONA_COLORS = {
  "Senior Architect": "text-blue-500",
  "Lead Designer": "text-pink-500",
  "Cybersec Engineer": "text-red-500",
  "Product Manager": "text-yellow-500",
  "Friendly Mentor": "text-green-500",
  "Root-Cause Analyst": "text-purple-500",
  "ThinkRoom AI": "text-purple-400"
};

const MessageBubble = ({ message, isOwnMessage, groupedWithPrev }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAI = AI_PERSONAS.includes(message.sender_name) || message.personaId || message.isStreaming;
  const personaColor = message.color || PERSONA_COLORS[message.sender_name];
  
  const bubbleClass = [
    isAI ? 'ai-message' : isOwnMessage ? 'right-message' : 'left-message',
    'message-bubble',
    groupedWithPrev ? 'grouped-with-prev' : ''
  ].filter(Boolean).join(' ');

  const displayName = isAI 
    ? (message.sender_name || 'ThinkRoom AI') 
    : isOwnMessage 
      ? 'You' 
      : (message.sender_name || 'Anonymous');
  
  const avatarInitial = isAI ? '🤖' : displayName.charAt(0).toUpperCase();

  const statusIcon = {
    sending: '🕒',
    pending: '🕒',
    sent: '✓',
    delivered: '✓✓',
    failed: '⚠',
  }[message.status];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={bubbleClass}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isOwnMessage && <div className={`avatar ${isAI ? 'ai-avatar' : ''}`}>{avatarInitial}</div>}
      <div className="message-content">
        {!isOwnMessage && (
          <div className={`message-sender-name ${personaColor || ''}`}>
            {displayName}
            {isAI && <span className="ai-badge"><Zap size={10} style={{display: 'inline', marginRight: '2px', marginBottom: '1px'}}/>AI</span>}
          </div>
        )}
        <div className="message-text">
          {isAI ? (
            <>
              <Suspense fallback={<span className="markdown-loading">Loading...</span>}>
                <MarkdownRenderer content={message.text} />
              </Suspense>
              {message.isStreaming && <span className="streaming-cursor"></span>}
            </>
          ) : (
            message.text
          )}
        </div>
        
        <div className="message-footer">
          {isAI && isHovered && !message.isStreaming && (
            <div className="ai-toolbar">
              <button onClick={handleCopy} className="toolbar-btn" title="Copy text">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button className="toolbar-btn" title="Regenerate response">
                <RefreshCw size={14} />
              </button>
            </div>
          )}
          <div className="message-timestamp">
            {new Date(message.created_at || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isOwnMessage && statusIcon ? <span className="message-status"> {statusIcon}</span> : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(MessageBubble);
