import React, { useRef, useEffect, useState, memo } from 'react';
import { List, ListImperativeAPI, RowComponentProps } from 'react-window';
import MessageBubble from '../../MessageBubble';

interface Message {
  id: string;
  text: string;
  sender_id: string;
  sender_name: string;
  color?: string;
  personaId?: string;
  isStreaming?: boolean;
  status?: 'sending' | 'pending' | 'sent' | 'delivered' | 'failed';
  created_at: string;
  timestamp: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  loadingMessages: boolean;
  messageError: string | null;
}

// Custom hook to measure container size dynamically using ResizeObserver
function useContainerSize(ref: React.RefObject<HTMLDivElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loadingMessages,
  messageError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<ListImperativeAPI | null>(null);
  const { width, height } = useContainerSize(containerRef);

  // Estimate message item heights based on character count and type
  const getItemSize = (index: number): number => {
    const msg = messages[index];
    if (!msg) return 80;

    const lines = Math.ceil((msg.text?.length || 0) / 60) + (msg.text?.split('\n').length || 1) - 1;
    const isAI = msg.isStreaming || msg.personaId || [
      'Senior Architect',
      'Lead Designer',
      'Cybersec Engineer',
      'Product Manager',
      'Friendly Mentor',
      'Root-Cause Analyst',
      'ThinkRoom AI'
    ].includes(msg.sender_name);

    let baseHeight = 55 + (lines * 22);
    if (isAI) baseHeight += 45; // extra padding for AI tag and hover toolbar
    return Math.max(85, baseHeight);
  };

  // Scroll to bottom when messages count increases or the last message text changes (e.g. streaming chunks)
  const lastMessageText = messages[messages.length - 1]?.text;
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToRow({
        index: messages.length - 1,
        align: 'end'
      });
    }
  }, [messages.length, lastMessageText]);

  type ListRowProps = Record<string, never>;

  const Row = ({ index, style }: RowComponentProps<ListRowProps>) => {
    const msg = messages[index];
    const isMine = msg.sender_id === currentUserId;
    return (
      <div style={{ ...style, padding: '4px 16px', boxSizing: 'border-box' }}>
        <MessageBubble
          message={msg}
          isOwnMessage={isMine}
        />
      </div>
    );
  };

  const renderEmptyState = () => {
    if (loadingMessages) {
      return <div className="empty-state">Loading messages...</div>;
    }

    if (messageError) {
      return <div className="empty-state">{messageError}</div>;
    }

    if (messages.length === 0) {
      return (
        <div className="empty-state">
          <p className="empty-title">Welcome to ThinkRoom AI</p>
          <p className="empty-subtitle">This room has no messages yet. Start the conversation!</p>
        </div>
      );
    }

    return null;
  };

  const emptyState = renderEmptyState();

  return (
    <div
      className="message-list"
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        flex: 1
      }}
    >
      {emptyState}
      {!emptyState && height > 0 && width > 0 && (
        <List<ListRowProps>
          listRef={listRef}
          rowCount={messages.length}
          rowHeight={getItemSize}
          rowComponent={Row}
          rowProps={{}}
          className="virtualized-message-list-inner"
          style={{ height, width }}
        />
      )}
    </div>
  );
};

export default memo(MessageList);
