import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { createFakeIndexedDb } from '../test/fakeIndexedDb.js';
import { useExecutionHistory } from './useExecutionHistory.js';

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: createFakeIndexedDb() });
});

it('restores saved execution history after the application hook is mounted again', async () => {
  const entry = {
    id: 'saved-query',
    sql: 'SELECT\n  *\nFROM ksiazki;',
    timestamp: '2026-09-23T10:00:00.000Z',
    mode: 'sqlite',
    databaseName: 'Biblioteka',
    lessonTitle: 'SELECT i LIMIT',
    taskTitle: 'Zadanie pokazowe',
    ok: true,
    rowCount: 3,
  };
  const firstMount = renderHook(() => useExecutionHistory());
  await waitFor(() => expect(firstMount.result.current.ready).toBe(true));
  await act(async () => firstMount.result.current.addHistory(entry));
  firstMount.unmount();

  const nextMount = renderHook(() => useExecutionHistory());
  await waitFor(() => expect(nextMount.result.current.history).toHaveLength(1));

  expect(nextMount.result.current.history[0]).toMatchObject({ sql: entry.sql, lessonTitle: entry.lessonTitle, taskTitle: entry.taskTitle });
});
