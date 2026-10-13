import { FormEvent, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConversationEngine, ChatMessage } from './context/engine';
import './style.css';

const proxyUrl = import.meta.env.VITE_PROXY_URL;

function App() {
  const engine = useRef(new ConversationEngine()).current;
  const requestId = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Your messages stay in this tab until you send them.');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const result = engine.ingest(text);
    if (result.reset) {
      requestId.current += 1;
      setMessages([]);
      setLoading(false);
      setStatus('Conversation forgotten. Nothing in that message was sent.');
      return;
    }

    setMessages(engine.getMessages());
    if (!proxyUrl) {
      setStatus('Add VITE_PROXY_URL to connect an LLM proxy. Your message was not sent.');
      return;
    }

    const id = ++requestId.current;
    const request = engine.startRequest();
    setLoading(true);
    setStatus('Sending your current conversation to the configured proxy…');

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'anthropic',
          messages: engine.getMessages(),
        }),
        signal: request.signal,
      });
      if (!response.ok) throw new Error('The proxy could not complete the request.');

      const payload: { text?: unknown; content?: unknown } = await response.json();
      const answer =
        typeof payload.text === 'string'
          ? payload.text
          : typeof payload.content === 'string'
            ? payload.content
            : '';
      if (!answer) throw new Error('The proxy returned no text response.');

      if (engine.addAssistantMessage(answer, request.epoch)) {
        setMessages(engine.getMessages());
        setStatus('Reply received.');
      }
    } catch (error) {
      if (!request.signal.aborted && id === requestId.current) {
        setStatus(error instanceof Error ? error.message : 'The request failed.');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function forgetConversation() {
    requestId.current += 1;
    engine.resetContext();
    setMessages([]);
    setLoading(false);
    setStatus('Conversation forgotten. No conversation context remains in this tab.');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="LiveForget Agent home">
          <span className="brand-mark" aria-hidden="true">LF</span>
          <span>LiveForget</span>
        </a>
        <button className="forget-button" type="button" onClick={forgetConversation}>
          Forget conversation
        </button>
      </header>

      <section className="conversation" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">A more private conversation</p>
          <h1 id="page-title">Say what’s on your mind.</h1>
          <p className="intro-copy">
            Ask anything. Say <strong>“forget everything I said”</strong> at any time to clear
            this conversation before it reaches the model.
          </p>
        </div>

        <div className="messages" aria-live="polite" aria-relevant="additions">
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✳</span>
              <p>Your conversation will appear here.</p>
              <span>Reset phrases are checked on this device.</span>
            </div>
          ) : (
            messages.map((message, index) => (
              <article className={`message ${message.role}`} key={`${index}-${message.role}`}>
                <span className="message-label">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <p>{message.content}</p>
              </article>
            ))
          )}
          {loading && <p className="loading">Thinking…</p>}
        </div>

        <form className="composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="message-input">Your message</label>
          <textarea
            id="message-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Write a message…"
            rows={2}
          />
          <div className="composer-footer">
            <span>Enter to send · Shift + Enter for a new line</span>
            <button className="send-button" type="submit" disabled={!input.trim() || loading}>
              {loading ? 'Sending…' : 'Send'}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
        <p className="status" role="status">{status}</p>
      </section>

      <footer className="privacy-note">
        <span aria-hidden="true">◇</span>
        Reset detection happens before a message is added to conversation context.
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
