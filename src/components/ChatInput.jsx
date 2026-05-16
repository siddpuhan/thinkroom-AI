import React, { useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip } from 'lucide-react';
import './ChatInput.css';

const ChatInput = ({ value, onChange, onSend, disabled, placeholder }) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="premium-input-container">
      <div className="input-wrapper">
        <button type="button" className="attachment-button" title="Attach file (coming soon)">
          <Paperclip size={20} />
        </button>
        
        <textarea
          ref={textareaRef}
          className="premium-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Message ThinkRoom AI..."}
          rows={1}
          disabled={disabled}
        />

        <button 
          type="button" 
          className={`premium-send-button ${!value.trim() ? 'disabled' : ''}`}
          onClick={() => value.trim() && onSend()}
          disabled={!value.trim() || disabled}
        >
          <SendHorizontal size={20} />
        </button>
      </div>
      <div className="input-footer-hint">
        <b>Shift + Enter</b> for new line
      </div>
    </div>
  );
};

export default ChatInput;
