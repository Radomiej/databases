import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import LessonPanel from './components/LessonPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import SqlEditor from './components/SqlEditor.jsx';
import { DATASETS, getDataset } from './data/datasets.js';
import { LESSONS, getLesson } from './data/lessons.js';
import { useSqliteDatabase } from './hooks/useSqliteDatabase.js';

function SchemaPreview({ schema, dataset }) {
  return (
    <div className="inspector-content">
      <div className="inspector-heading">
        <div className="inspector-heading-icon"><i className="bi bi-database-fill" aria-hidden="true" /></div>
        <div>
          <h2>Schemat bazy</h2>
          <p>{dataset.name} · {dataset.tables.length} tabel</p>
        </div>
      </div>
      <div className="inspector-tabs" role="tablist" aria-label="Widoki schematu">
        <button type="button" className="inspector-tab is-active" role="tab" aria-selected="true">Tabele</button>
        <button type="button" className="inspector-tab" role="tab" aria-selected="false">Relacje</button>
      </div>
      <div className="schema-search-wrap">
        <i className="bi bi-search" aria-hidden="true" />
        <input className="schema-search" aria-label="Szukaj tabeli" placeholder="Szukaj tabeli..." />
      </div>
      <div className="schema-table-list">
        {(schema.length ? schema : dataset.tables).map((tableItem) => (
          <div className="schema-table-card" key={tableItem.name}>
            <div className="schema-table-heading">
              <span className="schema-table-icon"><i className="bi bi-table" aria-hidden="true" /></span>
              <strong>{tableItem.name}</strong>
              <button type="button" className="schema-more" aria-label={`Opcje tabeli ${tableItem.name}`}><i className="bi bi-three-dots-vertical" /></button>
            </div>
            <div className="schema-column-count">{tableItem.columns.length} kolumn</div>
            <div className="schema-columns">
              {tableItem.columns.slice(0, 5).map((column) => (
                <div className="schema-column" key={column.name}>
                  <i className={`bi ${column.primaryKey || column.pk ? 'bi-key-fill schema-key' : 'bi-grip-vertical schema-column-mark'}`} aria-hidden="true" />
                  <span>{column.name}</span>
                  {(column.foreignKey || column.foreignKeys?.length) && <small>FK</small>}
                </div>
              ))}
              {tableItem.columns.length > 5 && <div className="schema-more-columns">+ {tableItem.columns.length - 5} więcej</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="inspector-hint">
        <div className="hint-icon"><i className="bi bi-info-circle-fill" aria-hidden="true" /></div>
        <div><strong>Wskazówka</strong><p>Kliknij tabelę, aby podejrzeć jej dane lub podpowiedź zapytania.</p></div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('sqlite');
  const [datasetId, setDatasetId] = useState('biblioteka');
  const [lessonId, setLessonId] = useState('select-limit');
  const [sqlText, setSqlText] = useState(() => getLesson('select-limit').solution);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress] = useState({});
  const dataset = useMemo(() => getDataset(datasetId), [datasetId]);
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);
  const sqlite = useSqliteDatabase(datasetId);

  useEffect(() => {
    setSqlText(lesson.solution);
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

  const handleRun = () => {
    if (mode === 'sqlite') sqlite.execute(sqlText);
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
      inspector={<SchemaPreview schema={sqlite.schema} dataset={dataset} />}
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
        onCheck={handleRun}
        onReset={() => setSqlText('')}
        onShowSolution={() => setSqlText(lesson.solution)}
        disabled={mode === 'sqlite' && sqlite.status !== 'ready'}
      />
      <section className="result-placeholder" aria-live="polite">
        <div className="placeholder-result-icon"><i className="bi bi-table" aria-hidden="true" /></div>
        <div><strong>Wynik zapytania</strong><p>Uruchom zapytanie, aby zobaczyć rekordy w tabeli wyników.</p></div>
      </section>
    </AppShell>
  );
}

export default App;
