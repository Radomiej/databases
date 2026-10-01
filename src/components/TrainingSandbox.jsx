import { useEffect, useRef, useState } from 'react';
import AppShell from './AppShell.jsx';
import SchemaPanel from './SchemaPanel.jsx';
import SqlEditor from './SqlEditor.jsx';
import ResultsPanel from './ResultsPanel.jsx';
import FeedbackAlert from './FeedbackAlert.jsx';
import DataPreviewModal from './DataPreviewModal.jsx';
import { createSqliteDatabase } from '../services/sqliteEngine.js';
import { runTrainingQuery, validateTrainingResult } from '../services/trainingGenerator.js';
import { buildTablePreviewSql } from '../services/tablePreview.js';

function restoreWork(session) {
  try {
    const stored = JSON.parse(sessionStorage.getItem('sql-lab.training-work'));
    if (stored?.signature === JSON.stringify(session.options)) return stored;
  } catch { /* Storage may be unavailable. The sandbox still works. */ }
  return { active: session.tasks[0].id, drafts: {}, passed: {} };
}

export default function TrainingSandbox({ session, onBack, onNew, onTutorContextChange, createDatabase = createSqliteDatabase }) {
  const [work, setWork] = useState(() => restoreWork(session));
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const database = useRef(null);
  const task = session.tasks.find((entry) => entry.id === work.active) ?? session.tasks[0];
  const sql = work.drafts[task.id] ?? '';
  const completed = session.tasks.filter((entry) => work.passed[entry.id]).length;

  useEffect(() => {
    onTutorContextChange?.({
      lesson: { order: task.lessonOrder, title: task.lessonTitle, theory: '', syntax: [] },
      task: { title: task.title, prompt: task.prompt, hint: session.options.hints ? task.hint : '' },
      schema: session.dataset.tables,
    });
  }, [onTutorContextChange, session, task]);

  useEffect(() => {
    let current = true, destroyDatabase;
    setStatus('loading');
    createDatabase(session.dataset).then(({ db, destroy }) => {
      if (!current) { destroy(); return; }
      destroyDatabase = destroy;
      db.run('PRAGMA query_only = ON;');
      database.current = db;
      setStatus('ready');
    }).catch((failure) => { if (current) { setStatus('error'); setError(failure.message); } });
    return () => { current = false; database.current = null; destroyDatabase?.(); };
  }, [session, createDatabase]);

  useEffect(() => {
    try { sessionStorage.setItem('sql-lab.training-work', JSON.stringify({ ...work, signature: JSON.stringify(session.options) })); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }, [session, work]);

  const changeSql = (value) => setWork((current) => ({ ...current, drafts: { ...current.drafts, [task.id]: value } }));
  const execute = (check = false) => {
    if (status !== 'ready') return;
    const next = runTrainingQuery(database.current, sql);
    setResult(next); setFeedback(null);
    if (check) {
      const validation = validateTrainingResult(next, task);
      if (validation.passed) setWork((current) => ({ ...current, passed: { ...current.passed, [task.id]: true } }));
      setFeedback({ type: validation.passed ? 'success' : 'warning', title: validation.passed ? 'Zadanie zaliczone' : 'Jeszcze nie tym razem', message: validation.message, details: validation.details });
    }
  };
  const selectTask = (id) => { setWork((current) => ({ ...current, active: id })); setResult(null); setFeedback(null); setSidebarOpen(false); };
  const previewTable = (name) => setPreview({ table: session.dataset.tables.find((table) => table.name === name), result: runTrainingQuery(database.current, buildTablePreviewSql(name, 'sqlite')) });
  const sidebar = <div className="sidebar-content training-sidebar">
    <div className="brand-block"><div className="brand-mark"><i className="bi bi-lightning-charge-fill" /></div><div><div className="brand-name">Trening SQL</div><div className="brand-subtitle">Samodzielny sandbox</div></div></div>
    <button type="button" className="btn btn-editor-secondary w-100" onClick={onBack}><i className="bi bi-arrow-left" /> Wróć do kursu</button>
    <section className="training-progress"><span>{completed} / {session.tasks.length} zaliczonych</span><progress max={session.tasks.length} value={completed} aria-label="Postęp treningu" /><small>{completed === session.tasks.length ? 'Cały zestaw ukończony. Dobra robota!' : 'Możesz rozwiązywać zadania w dowolnej kolejności.'}</small></section>
    <nav className="training-task-list" aria-label="Zadania treningowe">{session.tasks.map((entry, index) => <button type="button" key={entry.id} className={`training-task ${entry.id === task.id ? 'is-active' : ''}`} aria-current={entry.id === task.id ? 'step' : undefined} onClick={() => selectTask(entry.id)}><i className={`bi ${work.passed[entry.id] ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-label={work.passed[entry.id] ? 'Zaliczone' : 'Do wykonania'} /><span><strong>Zadanie {index + 1}</strong><small>Lekcja {entry.lessonOrder} · {entry.lessonTitle}</small></span></button>)}</nav>
    <div className="training-seed"><span>Kod zestawu</span><code>{session.options.seed}</code><small>{session.options.rows} wierszy w tabeli · {session.options.difficulty === 'easy' ? 'Podstawowy' : session.options.difficulty === 'challenge' ? 'Wyzwanie' : 'Standardowy'}</small></div>
  </div>;

  return <AppShell sidebar={sidebar} sidebarOpen={sidebarOpen} onSidebarClose={(value) => setSidebarOpen(value === true)} inspector={<SchemaPanel schema={session.dataset.tables} dataset={session.dataset} relationships={[]} allowTableCreation={false} relationshipsReadOnly onPreviewTable={previewTable} previewDisabled={status !== 'ready'} />}>
    <div className="main-toolbar"><div className="toolbar-dataset">Trening SQL <span className="toolbar-separator">/</span> Lekcje {session.options.start === session.options.end ? session.options.start : `${session.options.start}–${session.options.end}`}</div><button type="button" className="btn btn-training" onClick={onNew}><i className="bi bi-shuffle" /> Nowy zestaw</button></div>
    <section className="training-task-card" aria-labelledby="training-task-title"><div className="training-task-kicker">Zadanie samodzielne · lekcja {task.lessonOrder}</div><h1 id="training-task-title">{task.title}: {task.lessonTitle}</h1><p>{task.prompt}</p><div className="training-expected">Wymagane kolumny: {task.expected.columns.map((column) => <code key={column}>{column}</code>)}</div>{session.options.hints && <details key={task.id}><summary>Podpowiedź</summary><p>{task.hint}</p></details>}<small>Wpisz własne zapytanie i wybierz „Sprawdź”. Oceniany jest wynik, nie identyczność kodu.</small></section>
    {status === 'loading' && <div role="status" className="alert alert-info">Przygotowuję bazę treningową…</div>}
    {status === 'error' && <div role="alert" className="alert alert-danger">Nie udało się otworzyć bazy: {error}. Wybierz „Nowy zestaw”, aby spróbować ponownie.</div>}
    {storageWarning && <div role="alert" className="alert alert-warning">Przeglądarka blokuje zapis sesji. Po odświeżeniu postęp może zostać utracony.</div>}
    <SqlEditor value={sql} onChange={changeSql} onRun={() => execute()} onCheck={() => execute(true)} onReset={() => { changeSql(''); setResult(null); setFeedback(null); }} showSolution={false} disabled={status !== 'ready'} />
    <FeedbackAlert feedback={feedback} />
    <ResultsPanel result={result} showHistory={false} />
    <DataPreviewModal open={Boolean(preview)} table={preview?.table} result={preview?.result} databaseLabel={session.dataset.name} mode="sqlite" loading={false} onClose={() => setPreview(null)} onRefresh={() => previewTable(preview.table.name)} />
  </AppShell>;
}
