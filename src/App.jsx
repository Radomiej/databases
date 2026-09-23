import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import ConnectionPanel from './components/ConnectionPanel.jsx';
import DataPreviewModal from './components/DataPreviewModal.jsx';
import FeedbackAlert from './components/FeedbackAlert.jsx';
import HelpModal from './components/HelpModal.jsx';
import HintPanel from './components/HintPanel.jsx';
import LessonPanel from './components/LessonPanel.jsx';
import RelationEditorModal from './components/RelationEditorModal.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import SchemaPanel from './components/SchemaPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import SqlEditor from './components/SqlEditor.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import TableBuilderModal from './components/TableBuilderModal.jsx';
import appPackage from '../package.json';
import { DATASETS, getDataset } from './data/datasets.js';
import { COURSE_LESSONS, getLesson } from './data/lessons.js';
import { getTaskProgressKey } from './data/lessonTasks.js';
import { validateQueryResult } from './services/queryValidation.js';
import { validateSchema } from './services/schemaValidation.js';
import { useSqliteDatabase } from './hooks/useSqliteDatabase.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useExecutionHistory } from './hooks/useExecutionHistory.js';
import { describeTable as describeMysqlTable, getConnectorHealth, listRelations, listTables, runQuery as runMysqlQuery, testConnection } from './services/mysqlApi.js';
import { buildTablePreviewSql } from './services/tablePreview.js';
import { getTaskSqlDraft, getTaskSqlDraftKey } from './services/taskSqlDrafts.js';

const DEFAULT_CONNECTION = { host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: '' };

function App() {
  const [mode, setMode] = useState('sqlite');
  const [datasetId, setDatasetId] = useState('biblioteka');
  const [lessonId, setLessonId] = useState('select-limit');
  const [sqlText, setSqlText] = useState(() => getLesson('select-limit').solution);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress, setProgress] = useState({});
  const [taskProgress, setTaskProgress] = useState({});
  const { history, addHistory, clearHistory } = useExecutionHistory();
  const [customTables, setCustomTables] = useLocalStorage('sql-lab.custom-tables', {});
  const [relationshipOverrides, setRelationshipOverrides] = useLocalStorage('sql-lab.relationships', {});
  const [taskSqlByKey, setTaskSqlByKey] = useLocalStorage('sql-lab.task-sql', {});
  const [rememberConnection, setRememberConnection] = useLocalStorage('sql-lab.remember-connection', false);
  const [savedConnection, setSavedConnection] = useLocalStorage('sql-lab.mysql-connection', DEFAULT_CONNECTION);
  const [connection, setConnection] = useState(() => ({ ...DEFAULT_CONNECTION, ...(rememberConnection ? savedConnection : {}), password: '' }));
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isTableBuilderOpen, setIsTableBuilderOpen] = useState(false);
  const [mysqlStatus, setMysqlStatus] = useState({ state: 'idle', message: '', serverVersion: '' });
  const [mysqlSchema, setMysqlSchema] = useState([]);
  const [mysqlRelationships, setMysqlRelationships] = useState([]);
  const [mysqlCapabilities, setMysqlCapabilities] = useState({ mutationsAvailable: false, schemaMutationsAvailable: false });
  const [allowMutations, setAllowMutations] = useState(false);
  const [allowSchemaMutations, setAllowSchemaMutations] = useState(false);
  const [isRelationEditorOpen, setIsRelationEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [tablePreview, setTablePreview] = useState({ table: null, result: null, loading: false });
  const previewRequestRef = useRef(0);
  const dataset = useMemo(() => getDataset(datasetId), [datasetId]);
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);
  const lessonTasks = useMemo(() => lesson.tasks?.length ? lesson.tasks : [{ id: `${lesson.id}-guided`, title: 'Zadanie', prompt: lesson.task, hint: lesson.hint, solution: lesson.solution, expected: lesson.expected, successMessage: lesson.successMessage }], [lesson]);
  const [activeTaskId, setActiveTaskId] = useState('');
  const activeTask = useMemo(() => lessonTasks.find((task) => task.id === activeTaskId) ?? lessonTasks[0], [activeTaskId, lessonTasks]);
  const customTablesForDataset = useMemo(() => customTables?.[datasetId] ?? [], [customTables, datasetId]);
  const savedRelationships = relationshipOverrides?.[datasetId];
  const sqliteRelationships = useMemo(() => (Array.isArray(savedRelationships) ? savedRelationships : dataset.relationships), [dataset.relationships, savedRelationships]);
  const sqlite = useSqliteDatabase(datasetId, customTablesForDataset, sqliteRelationships);

  useEffect(() => {
    if (mode !== 'mysql') {
      setMysqlCapabilities({ mutationsAvailable: false, schemaMutationsAvailable: false });
      return undefined;
    }
    let isCurrent = true;
    getConnectorHealth().then((response) => {
      if (isCurrent) setMysqlCapabilities({
        mutationsAvailable: response.ok === true && response.allowMutationsAvailable === true,
        schemaMutationsAvailable: response.ok === true && response.allowSchemaMutationsAvailable === true,
      });
    });
    return () => { isCurrent = false; };
  }, [mode]);

  useEffect(() => {
    const firstTask = lessonTasks[0];
    setActiveTaskId(firstTask?.id ?? '');
    setSqlText(firstTask ? getTaskSqlDraft(taskSqlByKey, lesson.id, firstTask, firstTask) : lesson.solution);
    setResult(null);
    setFeedback(null);
    setIsHintOpen(false);
  }, [lessonId, lesson.solution, lessonTasks]);

  const handleDatasetChange = (nextDatasetId) => {
    const nextDataset = getDataset(nextDatasetId);
    const firstLesson = COURSE_LESSONS.find((item) => item.datasetId === nextDataset.id) ?? COURSE_LESSONS[0];
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

  const handleTaskChange = (nextTaskId) => {
    const nextTask = lessonTasks.find((task) => task.id === nextTaskId);
    if (!nextTask) return;
    setActiveTaskId(nextTask.id);
    setSqlText(getTaskSqlDraft(taskSqlByKey, lesson.id, nextTask, lessonTasks[0]));
    setResult(null);
    setFeedback(null);
    setIsHintOpen(false);
  };

  const handleSqlChange = (nextSql) => {
    setSqlText(nextSql);
    if (!activeTask) return;
    const key = getTaskSqlDraftKey(lesson.id, activeTask.id);
    setTaskSqlByKey((current) => ({ ...current, [key]: nextSql }));
  };

  const handleModeChange = (nextMode) => {
    previewRequestRef.current += 1;
    setMode(nextMode);
    setIsRelationEditorOpen(false);
    if (nextMode === 'sqlite') {
      setMysqlSchema([]);
      setMysqlRelationships([]);
      setMysqlStatus({ state: 'idle', message: '', serverVersion: '' });
    }
    setTablePreview({ table: null, result: null, loading: false });
    if (nextMode === 'sqlite') setConnection((current) => ({ ...current, password: '' }));
    setSidebarOpen(false);
  };

  const handleConnectionChange = (nextConnection) => {
    setConnection(nextConnection);
    if (rememberConnection) setSavedConnection({ ...nextConnection, password: '' });
  };

  const handleRememberConnectionChange = (shouldRemember) => {
    setRememberConnection(shouldRemember);
    if (shouldRemember) setSavedConnection({ ...connection, password: '' });
  };

  const refreshMysqlSchema = async () => {
    const [tablesResponse, relationsResponse] = await Promise.all([listTables(connection), listRelations(connection)]);
    const actualRelationships = relationsResponse.ok && Array.isArray(relationsResponse.relationships) ? relationsResponse.relationships : [];
    setMysqlRelationships(actualRelationships);
    if (!tablesResponse.ok) {
      setMysqlSchema([]);
      return { schema: [], tablesResponse, relationsResponse };
    }

    const tableDetails = await Promise.all(tablesResponse.tableNames.map(async (tableName) => {
      const detail = await describeMysqlTable(connection, tableName);
      const foreignKeys = actualRelationships.flatMap((relationship) => {
        const [fromTable, fromColumn] = relationship.from.split('.');
        const [toTable, toColumn] = relationship.to.split('.');
        return fromTable === tableName ? [{ table: toTable, from: fromColumn, to: toColumn }] : [];
      });
      return {
        name: tableName,
        columns: detail.ok ? detail.rows.map(([field, type, nullable, key, defaultValue]) => ({ name: field, type, notNull: nullable === 'NO', primaryKey: key === 'PRI', defaultValue })) : [],
        foreignKeys,
      };
    }));
    setMysqlSchema(tableDetails);
    return { schema: tableDetails, tablesResponse, relationsResponse };
  };

  const handleTestConnection = async () => {
    setMysqlStatus({ state: 'loading', message: 'Łączę się z serwerem...', serverVersion: '' });
    const response = await testConnection(connection);
    if (!response.ok) {
      setMysqlSchema([]);
      setMysqlRelationships([]);
      setMysqlStatus({ state: 'error', message: response.message, serverVersion: '' });
      setResult(response);
      return;
    }
    const { tablesResponse, relationsResponse } = await refreshMysqlSchema();
    setMysqlStatus({ state: 'connected', message: 'Połączenie działa poprawnie.', serverVersion: response.serverVersion });
    if (!tablesResponse.ok) setFeedback({ type: 'warning', title: 'Połączono, ale nie pobrano schematu', message: tablesResponse.message, details: tablesResponse.hint });
    else if (!relationsResponse.ok) setFeedback({ type: 'warning', title: 'Pobrano tabele bez relacji', message: relationsResponse.message, details: relationsResponse.hint });
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

  const handlePreviewTable = async (tableName) => {
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    const sourceSchema = mode === 'sqlite' ? sqlite.schema : mysqlSchema;
    const table = sourceSchema.find((tableItem) => tableItem.name === tableName)
      ?? dataset.tables.find((tableItem) => tableItem.name === tableName)
      ?? { name: tableName, columns: [] };
    setTablePreview({ table, result: null, loading: true });

    try {
      const sql = buildTablePreviewSql(tableName, mode);
      const previewResult = mode === 'sqlite' ? sqlite.execute(sql) : await runMysqlQuery(connection, sql, false, false);
      if (previewRequestRef.current === requestId) setTablePreview({ table, result: previewResult, loading: false });
    } catch (error) {
      if (previewRequestRef.current === requestId) {
        setTablePreview({
          table,
          loading: false,
          result: { ok: false, errorType: 'preview', message: error instanceof Error ? error.message : String(error), hint: 'Wybierz tabelę z panelu schematu i spróbuj ponownie.' },
        });
      }
    }
  };

  const handleCloseTablePreview = () => {
    previewRequestRef.current += 1;
    setTablePreview({ table: null, result: null, loading: false });
  };

  const handleSaveRelationships = (nextRelationships) => {
    const response = sqlite.applyRelationships(nextRelationships);
    if (!response.ok) {
      setFeedback({ type: 'warning', title: 'Nie udało się zapisać relacji', message: response.message, details: response.hint });
      return response;
    }
    setRelationshipOverrides((current) => ({ ...current, [datasetId]: nextRelationships }));
    setFeedback({ type: 'success', title: 'Relacje zapisane', message: 'Zmiany relacji SQLite są aktywne w bieżącej bazie i zapisane w projekcie.' });
    setIsRelationEditorOpen(false);
    return response;
  };

  const handleResetRelationships = () => {
    const response = sqlite.applyRelationships(dataset.relationships);
    if (!response.ok) {
      setFeedback({ type: 'warning', title: 'Nie udało się zresetować relacji', message: response.message, details: response.hint });
      return response;
    }
    setRelationshipOverrides((current) => {
      const next = { ...current };
      delete next[datasetId];
      return next;
    });
    setFeedback({ type: 'success', title: 'Relacje przywrócone', message: 'Przywrócono relacje startowe bieżącej bazy. Własne tabele pozostały bez zmian.' });
    setIsRelationEditorOpen(false);
    return response;
  };

  const handleResetActiveDatabase = () => {
    setCustomTables((current) => {
      const next = { ...current };
      delete next[datasetId];
      return next;
    });
    setRelationshipOverrides((current) => {
      const next = { ...current };
      delete next[datasetId];
      return next;
    });
    sqlite.reset();
    setResult(null);
    setFeedback(null);
    handleCloseTablePreview();
  };

  const handleFactoryReset = async () => {
    const historyCleared = await clearHistory();
    setMode('sqlite');
    setDatasetId('biblioteka');
    setLessonId('select-limit');
    const firstLesson = getLesson('select-limit');
    const firstTask = firstLesson.tasks?.[0];
    setActiveTaskId(firstTask?.id ?? '');
    setSqlText(firstTask?.solution ?? firstLesson.solution);
    setTaskSqlByKey({});
    setProgress({});
    setTaskProgress({});
    setCustomTables({});
    setRelationshipOverrides({});
    setRememberConnection(false);
    setSavedConnection(DEFAULT_CONNECTION);
    setConnection(DEFAULT_CONNECTION);
    setAllowMutations(false);
    setAllowSchemaMutations(false);
    setMysqlSchema([]);
    setMysqlRelationships([]);
    setMysqlStatus({ state: 'idle', message: '', serverVersion: '' });
    setIsRelationEditorOpen(false);
    setIsTableBuilderOpen(false);
    setIsHelpOpen(false);
    setSidebarOpen(false);
    setIsHintOpen(false);
    setResult(null);
    setFeedback(null);
    handleCloseTablePreview();
    sqlite.reset();
    return { historyCleared };
  };

  const saveHistory = (queryResult, executedSql, action) => {
    void addHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sql: executedSql,
      timestamp: new Date().toISOString(),
      datasetId,
      databaseName: mode === 'sqlite' ? dataset.name : connection.database || 'MySQL',
      mode,
      action,
      lessonId: lesson.id,
      lessonOrder: lesson.order,
      lessonTitle: lesson.title,
      taskId: activeTask?.id ?? '',
      taskTitle: activeTask?.title ?? 'Zadanie nieopisane',
      ok: Boolean(queryResult?.ok),
      rowCount: queryResult?.rowCount ?? queryResult?.changedRows ?? 0,
      statementType: queryResult?.statementType,
      durationMs: queryResult?.durationMs ?? 0,
    });
  };

  const executeCurrentQuery = async (action = 'run') => {
    const executedSql = sqlText;
    if (mode !== 'sqlite') {
      const queryResult = await runMysqlQuery(connection, executedSql, allowMutations, allowSchemaMutations);
      let schema;
      if (queryResult.ok && queryResult.statementType === 'DDL') schema = (await refreshMysqlSchema()).schema;
      setResult(queryResult);
      setFeedback(null);
      saveHistory(queryResult, executedSql, action);
      return { ...queryResult, schema };
    }
    const queryResult = sqlite.execute(executedSql);
    const schema = sqlite.getSchema?.() ?? sqlite.schema;
    setResult(queryResult);
    setFeedback(null);
    saveHistory(queryResult, executedSql, action);
    return { ...queryResult, schema };
  };

  const handleRun = () => {
    void executeCurrentQuery('run');
  };

  const handleCheck = async () => {
    const queryResult = await executeCurrentQuery('check');
    if (activeTask?.expectedSchema) {
      if (!queryResult.ok) {
        setFeedback({ type: 'warning', title: 'Nie udało się wykonać zadania', message: queryResult.message, details: queryResult.hint });
        return;
      }
      const validation = validateSchema(queryResult.schema ?? (mode === 'sqlite' ? sqlite.schema : mysqlSchema), activeTask.expectedSchema);
      if (validation.passed) {
        const taskKey = getTaskProgressKey(lesson.id, activeTask.id);
        const nextTaskProgress = { ...taskProgress, [taskKey]: true };
        setTaskProgress(nextTaskProgress);
        if (lessonTasks.every((task) => nextTaskProgress[getTaskProgressKey(lesson.id, task.id)])) setProgress((current) => ({ ...current, [lesson.id]: true }));
        setFeedback({ type: 'success', title: 'Zadanie zaliczone', message: activeTask.successMessage ?? lesson.successMessage, details: validation.details });
      } else {
        setFeedback({ type: 'warning', title: 'Jeszcze nie tym razem', message: validation.message, details: validation.details });
      }
      return;
    }
    if (mode !== 'sqlite') {
      setFeedback({ type: 'warning', title: 'Ocena jest dostępna w trybie SQLite', message: 'Tryb MySQL służy do wykonywania zapytań na Twojej bazie.' });
      return;
    }
    const validation = validateQueryResult(queryResult, activeTask?.expected);
    if (validation.passed) {
      const taskKey = getTaskProgressKey(lesson.id, activeTask.id);
      const nextTaskProgress = { ...taskProgress, [taskKey]: true };
      setTaskProgress(nextTaskProgress);
      if (lessonTasks.every((task) => nextTaskProgress[getTaskProgressKey(lesson.id, task.id)])) setProgress((current) => ({ ...current, [lesson.id]: true }));
      setFeedback({ type: 'success', title: 'Zadanie zaliczone', message: activeTask.successMessage ?? lesson.successMessage, details: validation.details });
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
      lessons={COURSE_LESSONS}
      selectedLessonId={lessonId}
      onLessonChange={handleLessonChange}
      progress={progress}
      onOpenSettings={() => { setSidebarOpen(false); setIsSettingsOpen(true); }}
      onOpenHelp={() => { setSidebarOpen(false); setIsHelpOpen(true); }}
    />
  );

  return (
    <AppShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onSidebarClose={(nextValue) => setSidebarOpen(typeof nextValue === 'boolean' ? nextValue : false)}
      inspector={<SchemaPanel schema={mode === 'sqlite' ? sqlite.schema : mysqlSchema} dataset={dataset} databaseLabel={mode === 'sqlite' ? dataset.name : connection.database || 'MySQL'} relationships={mode === 'sqlite' ? sqliteRelationships : mysqlRelationships} mode={mode} onAddTable={() => setIsTableBuilderOpen(true)} onPreviewTable={handlePreviewTable} previewDisabled={(mode === 'sqlite' && sqlite.status !== 'ready') || (mode === 'mysql' && mysqlStatus.state !== 'connected')} onEditRelationships={mode === 'sqlite' && sqlite.status === 'ready' ? () => setIsRelationEditorOpen(true) : undefined} relationshipsReadOnly={mode === 'mysql'} />}
    >
      <div className="main-toolbar">
        <div className="toolbar-dataset">{dataset.name}<span className="toolbar-separator">/</span> SQL practice</div>
        <div className="toolbar-engine"><span className="toolbar-engine-dot" />{mode === 'sqlite' ? 'SQLite lokalnie' : 'MySQL connector'}</div>
      </div>
      {mode === 'mysql' && <ConnectionPanel connection={connection} onChange={handleConnectionChange} onTest={handleTestConnection} status={mysqlStatus.state} statusMessage={mysqlStatus.message} serverVersion={mysqlStatus.serverVersion} rememberConnection={rememberConnection} onRememberChange={handleRememberConnectionChange} allowMutations={allowMutations} mutationsAvailable={mysqlCapabilities.mutationsAvailable} onAllowMutationsChange={setAllowMutations} allowSchemaMutations={allowSchemaMutations} schemaMutationsAvailable={mysqlCapabilities.schemaMutationsAvailable} onAllowSchemaMutationsChange={setAllowSchemaMutations} />}
      <LessonPanel lesson={lesson} dataset={dataset} databaseStatus={mode === 'sqlite' ? sqlite.status : mysqlStatus.state} mode={mode} activeTaskId={activeTask?.id} taskProgress={taskProgress} onTaskChange={handleTaskChange} />
      <div className="syntax-strip">
        <div className="syntax-strip-label"><i className="bi bi-braces" aria-hidden="true" /> Składnia</div>
        <div className="syntax-code-list">{lesson.syntax.map((syntax) => <code key={syntax}>{syntax}</code>)}</div>
      </div>
      <SqlEditor
        value={sqlText}
        onChange={handleSqlChange}
        onRun={handleRun}
        onCheck={handleCheck}
        onReset={() => { handleSqlChange(''); setResult(null); setFeedback(null); }}
        onShowSolution={() => handleSqlChange(activeTask?.solution ?? lesson.solution)}
        disabled={mode === 'sqlite' && sqlite.status !== 'ready'}
      />
      <HintPanel hint={activeTask?.hint ?? lesson.hint} open={isHintOpen} onToggle={() => setIsHintOpen((open) => !open)} />
      <FeedbackAlert feedback={feedback} />
      <ResultsPanel result={result} history={history} onHistorySelect={(entry) => { handleSqlChange(entry.sql); setResult(null); setFeedback(null); }} />
      <TableBuilderModal open={isTableBuilderOpen} onClose={() => setIsTableBuilderOpen(false)} onCreate={handleCreateTable} existingNames={sqlite.schema.map((tableItem) => tableItem.name)} />
      <RelationEditorModal open={isRelationEditorOpen} schema={sqlite.schema.length ? sqlite.schema : dataset.tables} relationships={sqliteRelationships} onClose={() => setIsRelationEditorOpen(false)} onSave={handleSaveRelationships} onReset={handleResetRelationships} />
      <DataPreviewModal open={Boolean(tablePreview.table)} table={tablePreview.table} databaseLabel={mode === 'sqlite' ? dataset.name : connection.database || 'MySQL'} mode={mode} result={tablePreview.result} loading={tablePreview.loading} onClose={handleCloseTablePreview} onRefresh={() => tablePreview.table && handlePreviewTable(tablePreview.table.name)} />
      <SettingsModal open={isSettingsOpen} version={appPackage.version} mode={mode} datasetLabel={dataset.name} onClose={() => setIsSettingsOpen(false)} onResetDatabase={handleResetActiveDatabase} onFactoryReset={handleFactoryReset} />
      <HelpModal open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </AppShell>
  );
}

export default App;
