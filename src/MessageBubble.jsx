import React, { useState } from 'react';
import MarkdownRenderer from './components/MarkdownRenderer';
import { Copy, RefreshCw, Check, Zap } from 'lucide-react';

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

const MessageBubble = ({ message, isOwnMessage }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAI = AI_PERSONAS.includes(message.sender_name) || message.personaId || message.isStreaming;
  const personaColor = message.color || PERSONA_COLORS[message.sender_name];
  
  const bubbleClass = isAI 
    ? `ai-message message-bubble` 
    : isOwnMessage 
      ? 'right-message message-bubble' 
      : 'left-message message-bubble';

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
    <div 
      className={bubbleClass} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`avatar ${isAI ? 'ai-avatar' : ''}`}>{avatarInitial}</div>
      <div className="message-content">
        {!isOwnMessage && (
          <div className={`message-sender-name ${personaColor || ''}`} style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: isAI && !personaColor ? '#a855f7' : (personaColor ? undefined : '#888'), display: 'flex', alignItems: 'center', gap: '6px' }}>
            {displayName}
            {isAI && <span className="ai-badge"><Zap size={10} style={{display: 'inline', marginRight: '2px', marginBottom: '1px'}}/>AI</span>}
          </div>
        )}
        <div className="message-text">
          {isAI ? (
            <>
              <MarkdownRenderer content={message.text} />
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
    </div>
  );
};

export default React.memo(MessageBubble);
