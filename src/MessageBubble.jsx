import React from 'react';

const MessageBubble = ({ message, isOwnMessage }) => {
  const isAI = message.sender_name === 'ThinkRoom AI';
  const bubbleClass = isAI 
    ? 'ai-message message-bubble' 
    : isOwnMessage 
      ? 'right-message message-bubble' 
      : 'left-message message-bubble';

  const displayName = isAI 
    ? 'ThinkRoom AI' 
    : isOwnMessage 
      ? 'You' 
      : (message.sender_name || message.senderName || message.sender || 'Anonymous');
  
  const avatarInitial = isAI ? '🤖' : displayName.charAt(0).toUpperCase();

  const statusIcon = {
    sending: '🕒',
    pending: '🕒',
    sent: '✓',
    delivered: '✓✓',
    failed: '⚠',
  }[message.status];

  return (
    <div className={bubbleClass}>
      <div className={`avatar ${isAI ? 'ai-avatar' : ''}`}>{avatarInitial}</div>
      <div className="message-content">
        {!isOwnMessage && (
          <div className="message-sender-name" style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '2px', color: isAI ? '#a855f7' : '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {displayName}
            {isAI && <span className="ai-badge">AI</span>}
          </div>
        )}
        <div className="message-text">{message.text}</div>
        <div className="message-timestamp">
          {new Date(message.created_at || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isOwnMessage && statusIcon ? <span className="message-status"> {statusIcon}</span> : null}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
