import React, { useRef, useEffect, useState, memo } from 'react';
import { SendHorizontal, Paperclip } from 'lucide-react';
import { useChatStore } from '../../store/chatStore.js';
import { useUser } from '@clerk/clerk-react';
import '../ChatInput.css';

interface ChatInputProps {
  onSendMessage: (_text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Simple debounce helper
function debounce(func: () => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = function() {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func();
    }, wait);
  };
  
  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false, placeholder }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debouncedTypingRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Subscribe to store updates with specific selectors (only re-renders if socket or roomId changes)
  const socket = useChatStore(state => state.socket);
  const roomId = useChatStore(state => state.roomId);
  const { user } = useUser();
  const userName = user?.fullName || user?.username || 'Anonymous';

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [text]);

  // Debounced socket typing emitter initialization
  useEffect(() => {
    if (!socket || !roomId) return;

    debouncedTypingRef.current = debounce(() => {
      socket.emit("typing", { roomId, sender: userName || "Anonymous" });
    }, 500);

    return () => {
      if (debouncedTypingRef.current) {
        debouncedTypingRef.current.cancel();
      }
    };
  }, [socket, roomId, userName]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Emit debounced typing event on keystroke
    if (debouncedTypingRef.current) {
      debouncedTypingRef.current();
    }
  };

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text);
      setText(''); // Reset text local state after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Message ThinkRoom AI..."}
          rows={1}
          disabled={disabled}
        />

        <button 
          type="button" 
          className={`premium-send-button ${!text.trim() ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
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

export default memo(ChatInput);
