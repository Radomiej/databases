import { beforeEach, describe, expect, it } from 'vitest';
import { clearExecutionHistory, loadExecutionHistory, saveExecutionHistory } from './executionHistory.js';
import { createFakeIndexedDb } from '../test/fakeIndexedDb.js';

describe('execution history persistence', () => {
  let indexedDB;

  beforeEach(() => {
    indexedDB = createFakeIndexedDb();
    localStorage.clear();
  });

  it('migrates the existing local history without discarding its SQL', async () => {
    const oldEntry = {
      id: 'legacy-1',
      sql: 'SELECT\n  tytul\nFROM ksiazki;',
      timestamp: '2026-09-22T10:00:00.000Z',
      datasetId: 'biblioteka',
      mode: 'sqlite',
      ok: true,
      rowCount: 3,
    };
    localStorage.setItem('sql-lab.history', JSON.stringify([oldEntry]));

    const history = await loadExecutionHistory({ indexedDB, storage: localStorage });

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: 'legacy-1', sql: oldEntry.sql, datasetId: 'biblioteka', rowCount: 3 });
    expect(localStorage.getItem('sql-lab.history')).toBeNull();
  });

  it('keeps complete entries beyond the old 30-item limit', async () => {
    const first = {
      id: 'query-0',
      sql: 'SELECT\n  k.tytul\nFROM ksiazki k;',
      timestamp: '2026-09-23T10:00:00.000Z',
      mode: 'sqlite',
      databaseName: 'Biblioteka',
      lessonId: 'select-limit',
      lessonTitle: 'SELECT i LIMIT',
      taskId: 'authors-list',
      taskTitle: 'Autorzy z limitem',
      ok: true,
      rowCount: 3,
    };
    for (let index = 0; index < 36; index += 1) {
      await saveExecutionHistory({ ...first, id: `query-${index}` }, { indexedDB });
    }

    const history = await loadExecutionHistory({ indexedDB, storage: localStorage });

    expect(history).toHaveLength(36);
    expect(history.find((entry) => entry.id === 'query-0')).toMatchObject({
      sql: first.sql,
      databaseName: 'Biblioteka',
      lessonTitle: 'SELECT i LIMIT',
      taskTitle: 'Autorzy z limitem',
      rowCount: 3,
    });
  });

  it('clears persisted history when factory settings are restored', async () => {
    await saveExecutionHistory({ id: 'saved', sql: 'SELECT 1;', timestamp: '2026-09-23T10:00:00.000Z' }, { indexedDB });

    await clearExecutionHistory({ indexedDB });

    expect(await loadExecutionHistory({ indexedDB, storage: localStorage })).toEqual([]);
  });
});
