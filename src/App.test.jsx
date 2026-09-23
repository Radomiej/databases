import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';
import { createFakeIndexedDb } from './test/fakeIndexedDb.js';
import { loadExecutionHistory } from './services/executionHistory.js';

const sqliteMock = vi.hoisted(() => ({ execute: vi.fn(() => ({ ok: true, rows: [], columns: [], rowCount: 0 })), reset: vi.fn(), applyRelationships: vi.fn(() => ({ ok: true })) }));
const mysqlMock = vi.hoisted(() => ({
  describeTable: vi.fn(async () => ({ ok: true, rows: [] })),
  getConnectorHealth: vi.fn(async () => ({ ok: true, allowMutationsAvailable: false, allowSchemaMutationsAvailable: false })),
  listRelations: vi.fn(async () => ({ ok: true, relationships: [] })),
  listTables: vi.fn(async () => ({ ok: true, tableNames: [] })),
  runQuery: vi.fn(async () => ({ ok: true, rows: [], columns: [], rowCount: 0 })),
  testConnection: vi.fn(async () => ({ ok: true, serverVersion: 'test' })),
}));

beforeEach(() => {
  localStorage.clear();
  sqliteMock.reset.mockClear();
  sqliteMock.execute.mockClear();
  Object.values(mysqlMock).forEach((method) => method.mockClear());
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: createFakeIndexedDb() });
});

vi.mock('./hooks/useSqliteDatabase.js', () => ({
  useSqliteDatabase: () => ({
    status: 'ready',
    error: null,
    schema: [],
    execute: sqliteMock.execute,
    reset: sqliteMock.reset,
    applyRelationships: sqliteMock.applyRelationships,
  }),
}));

vi.mock('./services/mysqlApi.js', () => ({
  describeTable: mysqlMock.describeTable,
  getConnectorHealth: mysqlMock.getConnectorHealth,
  listRelations: mysqlMock.listRelations,
  listTables: mysqlMock.listTables,
  runQuery: mysqlMock.runQuery,
  testConnection: mysqlMock.testConnection,
}));

test('renders SQL Learning Lab shell', () => {
  render(<App />);
  expect(screen.getAllByText('SQL Learning Lab').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: /uruchom/i })).toBeInTheDocument();
});

test('keeps a separate SQL draft for each task across task changes and reloads', async () => {
  const firstMount = render(<App />);
  const editor = screen.getByRole('textbox', { name: 'Zapytanie SQL' });
  await waitFor(() => expect(editor.value).toContain('LIMIT 3'));
  fireEvent.change(editor, { target: { value: 'SELECT tytul FROM ksiazki WHERE id = 1;' } });
  fireEvent.click(screen.getByRole('button', { name: /Autorzy z limitem/ }));
  expect(editor.value).toBe('');
  fireEvent.change(editor, { target: { value: 'SELECT imie FROM autorzy LIMIT 2;' } });
  fireEvent.click(screen.getAllByRole('button', { name: /Zadanie pokazowe/ })[0]);
  expect(editor.value).toBe('SELECT tytul FROM ksiazki WHERE id = 1;');
  firstMount.unmount();

  render(<App />);
  const reloadedEditor = screen.getByRole('textbox', { name: 'Zapytanie SQL' });
  await waitFor(() => expect(reloadedEditor.value).toBe('SELECT tytul FROM ksiazki WHERE id = 1;'));
  fireEvent.click(screen.getByRole('button', { name: /Autorzy z limitem/ }));
  expect(reloadedEditor.value).toBe('SELECT imie FROM autorzy LIMIT 2;');
});

test('opens the settings and help panels from the sidebar', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Ustawienia/i }));
  expect(screen.getByRole('dialog', { name: 'Ustawienia' })).toBeInTheDocument();
  expect(screen.getByText('0.1.0')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zamknij ustawienia' }));
  fireEvent.click(screen.getByRole('button', { name: /Pomoc/i }));
  expect(screen.getByRole('dialog', { name: 'Jak korzystać z SQL Learning Lab' })).toBeInTheDocument();
});

test('resets only the active SQLite dataset and preserves drafts, other datasets and history', () => {
  localStorage.setItem('sql-lab.custom-tables', JSON.stringify({ biblioteka: [{ tableName: 'notatki' }], sklep: [{ tableName: 'testowa' }] }));
  localStorage.setItem('sql-lab.relationships', JSON.stringify({ biblioteka: [], sklep: [] }));
  localStorage.setItem('sql-lab.task-sql', JSON.stringify({ 'select-limit:select-limit-guided': 'SELECT 1;' }));
  localStorage.setItem('sql-lab.history', JSON.stringify([{ id: 'keep', sql: 'SELECT 1;', timestamp: '2026-09-23T10:00:00.000Z' }]));
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /Ustawienia/i }));
  fireEvent.click(screen.getByRole('button', { name: /Resetuj lokalną bazę/i }));
  fireEvent.click(screen.getByRole('button', { name: /Potwierdź reset lokalnej bazy/i }));

  expect(sqliteMock.reset).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem('sql-lab.custom-tables'))).toEqual({ sklep: [{ tableName: 'testowa' }] });
  expect(JSON.parse(localStorage.getItem('sql-lab.relationships'))).toEqual({ sklep: [] });
  expect(JSON.parse(localStorage.getItem('sql-lab.task-sql'))['select-limit:select-limit-guided']).toBe('SELECT 1;');
  expect(localStorage.getItem('sql-lab.history')).not.toBeNull();
});

test('factory reset clears local course data and returns to SQLite without calling MySQL', async () => {
  localStorage.setItem('sql-lab.custom-tables', JSON.stringify({ biblioteka: [{ tableName: 'notatki' }] }));
  localStorage.setItem('sql-lab.relationships', JSON.stringify({ biblioteka: [] }));
  localStorage.setItem('sql-lab.task-sql', JSON.stringify({ 'where:price-filter': 'SELECT 1;' }));
  localStorage.setItem('sql-lab.remember-connection', JSON.stringify(true));
  localStorage.setItem('sql-lab.mysql-connection', JSON.stringify({ host: 'localhost', port: 3306, database: 'moje', user: 'uczen' }));
  localStorage.setItem('sql-lab.history', JSON.stringify([{ id: 'old', sql: 'SELECT 1;', timestamp: '2026-09-23T10:00:00.000Z' }]));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /MySQL — connector/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ustawienia/i }));
  fireEvent.click(screen.getByRole('button', { name: /Przywróć ustawienia fabryczne/i }));
  expect(screen.getByText(/nie zmienia danych na serwerze MySQL/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Potwierdź przywrócenie ustawień fabrycznych/i }));

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/ustawienia fabryczne/i));
  expect(screen.getByRole('button', { name: /SQLite — nauka/i })).toHaveAttribute('aria-pressed', 'true');
  expect(sqliteMock.reset).toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('sql-lab.custom-tables'))).toEqual({});
  expect(JSON.parse(localStorage.getItem('sql-lab.relationships'))).toEqual({});
  expect(JSON.parse(localStorage.getItem('sql-lab.task-sql'))).toEqual({});
  expect(JSON.parse(localStorage.getItem('sql-lab.remember-connection'))).toBe(false);
  expect(JSON.parse(localStorage.getItem('sql-lab.mysql-connection'))).toEqual({ host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: '' });
  expect(mysqlMock.runQuery).not.toHaveBeenCalled();
  expect(mysqlMock.testConnection).not.toHaveBeenCalled();
  expect(await loadExecutionHistory({ indexedDB: globalThis.indexedDB, storage: localStorage })).toEqual([]);
});

test('records only executed SQL with the selected lesson, task, database and action', async () => {
  render(<App />);
  const editor = screen.getByRole('textbox', { name: 'Zapytanie SQL' });
  fireEvent.click(screen.getByRole('button', { name: /Autorzy z limitem/ }));
  const sql = 'SELECT imie, nazwisko\nFROM autorzy\nLIMIT 3;';
  fireEvent.change(editor, { target: { value: sql } });
  expect(await loadExecutionHistory({ indexedDB: globalThis.indexedDB, storage: localStorage })).toEqual([]);

  fireEvent.click(screen.getByRole('button', { name: 'Uruchom Ctrl ↵' }));

  await waitFor(async () => {
    const entries = await loadExecutionHistory({ indexedDB: globalThis.indexedDB, storage: localStorage });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      sql,
      mode: 'sqlite',
      databaseName: 'Biblioteka',
      lessonId: 'select-limit',
      lessonOrder: 1,
      lessonTitle: 'SELECT i LIMIT',
      taskId: 'authors-list',
      taskTitle: 'Autorzy z limitem',
      action: 'run',
      ok: true,
      rowCount: 0,
    });
  });

  fireEvent.change(editor, { target: { value: 'SELECT 1;' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sprawdź' }));
  await waitFor(async () => {
    const entries = await loadExecutionHistory({ indexedDB: globalThis.indexedDB, storage: localStorage });
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ sql: 'SELECT 1;', action: 'check' });
  });
});
