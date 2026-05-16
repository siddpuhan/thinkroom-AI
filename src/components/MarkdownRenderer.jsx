import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownRenderer.css';

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
