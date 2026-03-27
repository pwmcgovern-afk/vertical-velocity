import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/** Lightweight markdown → JSX for assistant messages. Handles **bold**, bullet lists, and ## headings. */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={key++} className="ask-ai-md-list">{listItems}</ul>);
      listItems = [];
    }
  };

  const inlineFormat = (line: string): React.ReactNode[] => {
    // Split on **bold** markers
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<div key={key++} className="ask-ai-md-h2">{inlineFormat(trimmed.slice(3))}</div>);
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<div key={key++} className="ask-ai-md-h3">{inlineFormat(trimmed.slice(4))}</div>);
    }
    // Bullet points
    else if (/^[-*•]\s/.test(trimmed)) {
      listItems.push(<li key={key++}>{inlineFormat(trimmed.replace(/^[-*•]\s+/, ''))}</li>);
    }
    // Empty line
    else if (trimmed === '') {
      flushList();
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(<p key={key++} className="ask-ai-md-p">{inlineFormat(trimmed)}</p>);
    }
  }
  flushList();
  return elements;
}

const SUGGESTED_QUESTIONS = [
  'Which company has the highest ARR per employee?',
  'Compare healthcare AI companies by revenue',
  'What are the fastest-growing companies?',
  'Which category has the most companies?',
];

export function AskAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastFailedRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    lastFailedRef.current = null;
    const userMsg: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = res.status === 429
          ? 'Too many requests, try again in a moment'
          : data.error || 'Something went wrong';
        setError(errMsg);
        lastFailedRef.current = trimmed;
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setError('Connection failed. Check your network and try again.');
      lastFailedRef.current = trimmed;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleRetry = () => {
    if (lastFailedRef.current) {
      // Remove the last user message that failed, then resend
      setMessages(prev => prev.slice(0, -1));
      sendMessage(lastFailedRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        className="ask-ai-btn"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close AI chat' : 'Ask AI about companies'}
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Ask AI</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="ask-ai-popup">
          <div className="ask-ai-header">
            <span className="ask-ai-header-title">Ask AI</span>
            <span className="ask-ai-header-badge">Powered by Claude</span>
          </div>

          <div className="ask-ai-messages">
            {messages.length === 0 && !isLoading && (
              <div className="ask-ai-welcome">
                <p className="ask-ai-welcome-text">Ask me anything about the {'\u00A0'}vertical AI companies tracked on Vertical Velocity.</p>
                <div className="ask-ai-suggestions">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button
                      key={q}
                      className="ask-ai-chip"
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`ask-ai-msg ask-ai-msg-${msg.role}`}>
                <div className={`ask-ai-bubble ask-ai-bubble-${msg.role}`}>
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ask-ai-msg ask-ai-msg-assistant">
                <div className="ask-ai-bubble ask-ai-bubble-assistant">
                  <span className="ask-ai-typing">
                    <span className="ask-ai-dot" />
                    <span className="ask-ai-dot" />
                    <span className="ask-ai-dot" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="ask-ai-error">
                <span>{error}</span>
                <button className="ask-ai-retry" onClick={handleRetry}>Retry</button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="ask-ai-input-area">
            <textarea
              ref={inputRef}
              className="ask-ai-input"
              placeholder="Ask about companies, rankings, categories..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="ask-ai-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AskAI;
