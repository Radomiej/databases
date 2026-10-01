import { useEffect, useMemo, useRef, useState } from 'react';
import { sendTutorMessage } from '../services/aiTutorApi.js';

function makeContext(lesson, task, schema) {
  return {
    lesson: {
      order: lesson?.order,
      title: lesson?.title,
      theory: lesson?.theory,
      syntax: lesson?.syntax,
    },
    task: {
      title: task?.title,
      prompt: task?.prompt,
      hint: task?.hint,
    },
    schema: Array.isArray(schema) ? schema : [],
  };
}

export default function AiTutorPanel({ lesson, task, schema, sendMessage = sendTutorMessage }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const messageListRef = useRef(null);
  const context = useMemo(() => makeContext(lesson, task, schema), [lesson, task, schema]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (messageListRef.current) messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, pending]);

  const submit = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;
    if (!apiKey.trim()) { setError('Wpisz klucz API wybranego dostawcy.'); return; }
    const recent = messages.slice(-14);
    if (recent[0]?.role === 'assistant') recent.shift();
    const nextMessages = [...recent, { role: 'user', content }];
    setDraft('');
    setError('');
    setPending(true);
    try {
      const response = await sendMessage({ provider, apiKey, messages: nextMessages, context });
      setMessages([...nextMessages, { role: 'assistant', content: response.reply }].slice(-16));
    } catch (failure) {
      setMessages((current) => [...current, { role: 'user', content }].slice(-16));
      setDraft(content);
      setError(failure instanceof Error ? failure.message : 'Nie udało się wysłać wiadomości.');
    } finally { setPending(false); }
  };

  const switchProvider = (event) => {
    setProvider(event.target.value);
    setApiKey('');
    setMessages([]);
    setError('');
  };

  const clearConversation = () => {
    setMessages([]);
    setApiKey('');
    setDraft('');
    setError('');
  };

  return <>
    {!open && <button type="button" className="ai-tutor-launcher" aria-label="Otwórz korepetytora AI" onClick={() => setOpen(true)}><i className="bi bi-robot" aria-hidden="true" /><span>Korepetytor AI</span></button>}
    {open && <aside className="ai-tutor-panel" role="complementary" aria-label="Korepetytor AI">
      <header className="ai-tutor-header">
        <div className="ai-tutor-heading"><span className="ai-tutor-avatar"><i className="bi bi-robot" aria-hidden="true" /></span><div><h2>Korepetytor AI</h2><small>Pomoc do bieżącej lekcji</small></div></div>
        <div className="ai-tutor-header-actions"><button type="button" className="ai-tutor-icon-button" aria-label="Zapomnij klucz i wyczyść rozmowę" title="Zapomnij klucz i wyczyść rozmowę" onClick={clearConversation}><i className="bi bi-trash3" aria-hidden="true" /></button><button type="button" className="ai-tutor-icon-button" aria-label="Zamknij panel korepetytora" onClick={() => setOpen(false)}><i className="bi bi-x-lg" aria-hidden="true" /></button></div>
      </header>
      <div className="ai-tutor-settings">
        <label className="ai-tutor-field"><span>Dostawca AI</span><select className="form-select" value={provider} onChange={switchProvider}><option value="claude">Claude Haiku</option><option value="openai">OpenAI</option></select></label>
        <label className="ai-tutor-field"><span>Klucz API</span><input className="form-control" type="password" autoComplete="off" spellCheck="false" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={provider === 'claude' ? 'sk-ant-…' : 'sk-…'} /></label>
        <p className="ai-tutor-privacy">Klucz pozostaje w pamięci tej karty. Pytanie oraz bieżąca lekcja, zadanie i schemat bazy trafią do wybranego dostawcy AI. Nie wysyłamy wyników ani rekordów tabel.</p>
      </div>
      <div className="ai-tutor-messages" ref={messageListRef} aria-live="polite" aria-label="Rozmowa">
        {messages.length === 0 && <div className="ai-tutor-welcome"><span className="ai-tutor-welcome-icon"><i className="bi bi-chat-square-text" aria-hidden="true" /></span><strong>W czym mogę pomóc?</strong><p>Zapytaj o składnię, działanie zapytania albo poproś o wskazówkę do zadania.</p>{lesson?.title && <small>Teraz: lekcja {lesson.order} · {lesson.title}</small>}</div>}
        {messages.map((message, index) => <div className={`ai-tutor-message is-${message.role}`} key={`${index}-${message.content.slice(0, 16)}`}><span>{message.role === 'user' ? 'Ty' : 'Korepetytor'}</span><p>{message.content}</p></div>)}
        {pending && <div role="status" className="ai-tutor-typing"><span /><span /><span /> Asystent pisze…</div>}
      </div>
      <form className="ai-tutor-composer" onSubmit={submit}>
        {error && <div role="alert" className="ai-tutor-error">{error}</div>}
        <label className="visually-hidden" htmlFor="ai-tutor-input">Wiadomość do asystenta</label>
        <textarea id="ai-tutor-input" className="form-control" rows="3" maxLength="2000" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Napisz pytanie…" />
        <div className="ai-tutor-compose-footer"><small>Shift + Enter — nowy wiersz</small><button type="submit" className="btn btn-primary" disabled={pending || !draft.trim()}><i className="bi bi-send" aria-hidden="true" /> Wyślij wiadomość</button></div>
      </form>
    </aside>}
  </>;
}
