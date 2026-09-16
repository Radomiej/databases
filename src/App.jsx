import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import FeedbackAlert from './components/FeedbackAlert.jsx';
import HintPanel from './components/HintPanel.jsx';
import LessonPanel from './components/LessonPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import SchemaPanel from './components/SchemaPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import SqlEditor from './components/SqlEditor.jsx';
import TableBuilderModal from './components/TableBuilderModal.jsx';
import { DATASETS, getDataset } from './data/datasets.js';
import { LESSONS, getLesson } from './data/lessons.js';
import { validateQueryResult } from './services/queryValidation.js';
import { useSqliteDatabase } from './hooks/useSqliteDatabase.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

function App() {
  const [mode, setMode] = useState('sqlite');
  const [datasetId, setDatasetId] = useState('biblioteka');
  const [lessonId, setLessonId] = useState('select-limit');
  const [sqlText, setSqlText] = useState(() => getLesson('select-limit').solution);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress, setProgress] = useLocalStorage('sql-lab.progress', {});
  const [history, setHistory] = useLocalStorage('sql-lab.history', []);
  const [customTables, setCustomTables] = useLocalStorage('sql-lab.custom-tables', {});
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isTableBuilderOpen, setIsTableBuilderOpen] = useState(false);
  const dataset = useMemo(() => getDataset(datasetId), [datasetId]);
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);
  const customTablesForDataset = customTables?.[datasetId] ?? [];
  const sqlite = useSqliteDatabase(datasetId, customTablesForDataset);

  useEffect(() => {
    setSqlText(lesson.solution);
    setResult(null);
    setFeedback(null);
    setIsHintOpen(false);
  }, [lessonId, lesson.solution]);

  const handleDatasetChange = (nextDatasetId) => {
    const nextDataset = getDataset(nextDatasetId);
    const firstLesson = LESSONS.find((item) => item.datasetId === nextDataset.id) ?? LESSONS[0];
    setDatasetId(nextDataset.id);
    setLessonId(firstLesson.id);
    setSidebarOpen(false);
  };

  const handleLessonChange = (nextLessonId) => {
    const nextLesson = getLesson(nextLessonId);
    setLessonId(nextLesson.id);
    setDatasetId(nextLesson.datasetId);
    setSidebarOpen(false);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setSidebarOpen(false);
  };

  const handleCreateTable = (definition) => {
    const queryResult = sqlite.execute(definition.sql);
    if (!queryResult.ok) {
      setResult(queryResult);
      setFeedback({ type: 'warning', title: 'Nie udało się utworzyć tabeli', message: queryResult.message, details: queryResult.hint });
      return;
    }
    setCustomTables((current) => ({ ...current, [datasetId]: [...(current[datasetId] ?? []), definition] }));
    setResult(queryResult);
    setFeedback({ type: 'success', title: 'Tabela utworzona', message: `Tabela ${definition.tableName} jest gotowa do użycia w zapytaniach.` });
    setIsTableBuilderOpen(false);
  };

  const saveHistory = (queryResult) => {
    setHistory((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sql: sqlText,
        timestamp: new Date().toISOString(),
        datasetId,
        mode,
        ok: Boolean(queryResult?.ok),
        rowCount: queryResult?.rowCount ?? queryResult?.changedRows ?? 0,
      },
      ...current,
    ].slice(0, 30));
  };

  const executeCurrentQuery = () => {
    if (mode !== 'sqlite') {
      const connectorResult = { ok: false, errorType: 'connection', message: 'Tryb MySQL zostanie aktywowany po skonfigurowaniu connectora.', hint: 'Wprowadź dane połączenia w panelu connectora.' };
      setResult(connectorResult);
      saveHistory(connectorResult);
      return connectorResult;
    }
    const queryResult = sqlite.execute(sqlText);
    setResult(queryResult);
    setFeedback(null);
    saveHistory(queryResult);
    return queryResult;
  };

  const handleRun = () => {
    executeCurrentQuery();
  };

  const handleCheck = () => {
    const queryResult = executeCurrentQuery();
    if (mode !== 'sqlite') {
      setFeedback({ type: 'warning', title: 'Ocena jest dostępna w trybie SQLite', message: 'Tryb MySQL służy do wykonywania zapytań na Twojej bazie.' });
      return;
    }
    const validation = validateQueryResult(queryResult, lesson.expected);
    if (validation.passed) {
      setProgress((current) => ({ ...current, [lesson.id]: true }));
      setFeedback({ type: 'success', title: 'Zadanie zaliczone', message: lesson.successMessage, details: validation.details });
    } else {
      setFeedback({ type: 'warning', title: 'Jeszcze nie tym razem', message: validation.message, details: validation.details });
    }
  };

  const sidebar = (
    <Sidebar
      mode={mode}
      onModeChange={handleModeChange}
      datasets={DATASETS}
      selectedDatasetId={datasetId}
      onDatasetChange={handleDatasetChange}
      lessons={LESSONS}
      selectedLessonId={lessonId}
      onLessonChange={handleLessonChange}
      progress={progress}
    />
  );

  return (
    <AppShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onSidebarClose={(nextValue) => setSidebarOpen(typeof nextValue === 'boolean' ? nextValue : false)}
      inspector={<SchemaPanel schema={sqlite.schema} dataset={dataset} relationships={dataset.relationships} mode={mode} onAddTable={() => setIsTableBuilderOpen(true)} />}
    >
      <div className="main-toolbar">
        <div className="toolbar-dataset">{dataset.name}<span className="toolbar-separator">/</span> SQL practice</div>
        <div className="toolbar-engine"><span className="toolbar-engine-dot" />{mode === 'sqlite' ? 'SQLite lokalnie' : 'MySQL connector'}</div>
      </div>
      <LessonPanel lesson={lesson} dataset={dataset} databaseStatus={sqlite.status} />
      <div className="syntax-strip">
        <div className="syntax-strip-label"><i className="bi bi-braces" aria-hidden="true" /> Składnia</div>
        <div className="syntax-code-list">{lesson.syntax.map((syntax) => <code key={syntax}>{syntax}</code>)}</div>
      </div>
      <SqlEditor
        value={sqlText}
        onChange={setSqlText}
        onRun={handleRun}
        onCheck={handleCheck}
        onReset={() => { setSqlText(''); setResult(null); setFeedback(null); }}
        onShowSolution={() => setSqlText(lesson.solution)}
        disabled={mode === 'sqlite' && sqlite.status !== 'ready'}
      />
      <HintPanel hint={lesson.hint} open={isHintOpen} onToggle={() => setIsHintOpen((open) => !open)} />
      <FeedbackAlert feedback={feedback} />
      <ResultsPanel result={result} history={history} onHistorySelect={(entry) => { setSqlText(entry.sql); setResult(null); setFeedback(null); }} />
      <TableBuilderModal open={isTableBuilderOpen} onClose={() => setIsTableBuilderOpen(false)} onCreate={handleCreateTable} existingNames={sqlite.schema.map((tableItem) => tableItem.name)} />
    </AppShell>
  );
}

export default App;
