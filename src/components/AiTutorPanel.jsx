import { useEffect, useMemo, useRef, useState } from 'react';
import { getFreeOpenRouterModels, sendTutorMessage } from '../services/aiTutorApi.js';

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

export default function AiTutorPanel({ lesson, task, schema, sendMessage = sendTutorMessage, loadFreeModels = getFreeOpenRouterModels }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [freeModels, setFreeModels] = useState([]);
  const [freeModelsStatus, setFreeModelsStatus] = useState('idle');
  const [freeModelsRefresh, setFreeModelsRefresh] = useState(0);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const messageListRef = useRef(null);
  const context = useMemo(() => makeContext(lesson, task, schema), [lesson, task, schema]);

  useEffect(() => {
    if (provider !== 'openrouter') return undefined;
    let active = true;
    setFreeModelsStatus('loading');
    loadFreeModels().then((result) => {
      if (!active) return;
      setFreeModels(result.models ?? []);
      setFreeModelsStatus(result.configured ? 'ready' : 'unconfigured');
      setModel('');
    }).catch(() => {
      if (active) { setFreeModels([]); setFreeModelsStatus('error'); }
    });
    return () => { active = false; };
  }, [provider, loadFreeModels, freeModelsRefresh]);

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
    if (provider !== 'openrouter' && !apiKey.trim()) { setError('Wpisz klucz API wybranego dostawcy.'); return; }
    if (provider === 'openrouter' && !model) { setError('Wybierz model z aktualnej listy darmowych modeli.'); return; }
    const recent = messages.slice(-14);
    if (recent[0]?.role === 'assistant') recent.shift();
    const nextMessages = [...recent, { role: 'user', content }];
    setDraft('');
    setError('');
    setPending(true);
    try {
      const response = await sendMessage({ provider, ...(provider === 'openrouter' ? {} : { apiKey }), baseUrl: provider === 'openai' ? baseUrl.trim() : '', model: provider === 'openai' || provider === 'openrouter' ? model.trim() : '', messages: nextMessages, context });
      setMessages([...nextMessages, { role: 'assistant', content: response.reply }].slice(-16));
    } catch (failure) {
      setMessages((current) => [...current, { role: 'user', content }].slice(-16));
      setDraft(content);
      setError(failure instanceof Error ? failure.message : 'Nie udało się wysłać wiadomości.');
      if (provider === 'openrouter' && /darmowy|katalog/i.test(failure instanceof Error ? failure.message : '')) setFreeModelsRefresh((value) => value + 1);
    } finally { setPending(false); }
  };

  const switchProvider = (event) => {
    setProvider(event.target.value);
    setApiKey('');
    setBaseUrl('');
    setModel('');
    setMessages([]);
    setError('');
  };

  const clearConversation = () => {
    setMessages([]);
    setApiKey('');
    setBaseUrl('');
    setModel('');
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
      <details className="ai-tutor-settings">
        <summary className="ai-tutor-settings-toggle">
          <span><i className="bi bi-sliders" aria-hidden="true" /> Ustawienia AI</span>
          <span className="ai-tutor-settings-summary">
            {provider === 'openrouter' ? freeModels.find((item) => item.id === model)?.name || 'OpenRouter Free' : provider === 'openai' ? (baseUrl.trim() ? 'OpenAI-compatible' : 'OpenAI') : 'Claude Haiku'}
            <i className="bi bi-chevron-down" aria-hidden="true" />
          </span>
        </summary>
        <div className="ai-tutor-settings-content">
        <label className="ai-tutor-field"><span>Dostawca AI</span><select className="form-select" value={provider} onChange={switchProvider}><option value="claude">Claude Haiku</option><option value="openai">OpenAI</option><option value="openrouter">OpenRouter Free</option></select></label>
        {provider !== 'openrouter' && <label className="ai-tutor-field"><span>Klucz API</span><input className="form-control" type="password" autoComplete="off" spellCheck="false" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={provider === 'claude' ? 'sk-ant-…' : 'sk-…'} /></label>}
        {provider === 'openrouter' && <>
          <label className="ai-tutor-field"><span>Darmowy model OpenRouter</span><select className="form-select" value={model} onChange={(event) => setModel(event.target.value)} disabled={freeModelsStatus !== 'ready'}><option value="">{freeModelsStatus === 'loading' ? 'Pobieranie listy…' : 'Wybierz darmowy model…'}</option>{freeModels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {freeModelsStatus === 'unconfigured' && <small className="ai-tutor-endpoint-help">Backend nie ma skonfigurowanego OPENROUTER_API_KEY. Klucz pozostaje wyłącznie po stronie serwera.</small>}
          {freeModelsStatus === 'error' && <small className="ai-tutor-endpoint-help">Nie udało się pobrać listy darmowych modeli. Sprawdź backend i spróbuj ponownie.</small>}
          {freeModelsStatus === 'ready' && <small className="ai-tutor-endpoint-help">Lista pochodzi z aktualnego katalogu OpenRoutera. Backend ponownie sprawdza cenę modelu przy każdym pytaniu i odrzuca modele płatne.</small>}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setFreeModelsRefresh((value) => value + 1)} disabled={freeModelsStatus === 'loading'}>Odśwież listę darmowych modeli</button>
        </>}
        {provider === 'openai' && <>
          <label className="ai-tutor-field"><span>Własny endpoint OpenAI-compatible</span><input className="form-control" type="url" autoComplete="off" spellCheck="false" maxLength="2048" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://openrouter.ai/api/v1" /></label>
          <label className="ai-tutor-field"><span>Model OpenAI-compatible</span><input className="form-control" type="text" autoComplete="off" maxLength="160" value={model} onChange={(event) => setModel(event.target.value)} placeholder="np. anthropic/claude-haiku-4.5" /></label>
          <small className="ai-tutor-endpoint-help">Puste pole używa oficjalnego OpenAI. Własny adres: baza API (np. …/api/v1) albo pełny endpoint …/chat/completions. Model wpisz zgodnie z ofertą dostawcy.</small>
        </>}
        <p className="ai-tutor-privacy">{provider === 'openrouter' ? 'Klucz OpenRoutera jest przechowywany tylko w zmiennej środowiskowej backendu. OpenRouter i operator modelu otrzymają pytanie oraz kontekst; operator może je przechowywać.' : 'Klucz pozostaje w pamięci tej karty.'} Pytanie oraz bieżąca lekcja, zadanie i schemat bazy trafią do {provider === 'openai' && baseUrl.trim() ? 'wskazanego endpointu' : 'wybranego dostawcy AI'}. Nie wysyłamy wyników ani rekordów tabel.</p>
        </div>
      </details>
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
