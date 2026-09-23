import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import HistoryPanel from './HistoryPanel.jsx';

it('shows full query context and lets the student browse beyond the first page', () => {
  const history = Array.from({ length: 11 }, (_, index) => ({
    id: `query-${index}`,
    sql: index === 10 ? 'SELECT\n  nazwisko\nFROM autorzy;' : `SELECT ${index};`,
    timestamp: `2026-09-23T10:${String(10 - index).padStart(2, '0')}:00.000Z`,
    mode: 'sqlite',
    databaseName: 'Biblioteka',
    lessonOrder: 1,
    lessonTitle: 'SELECT i LIMIT',
    taskTitle: 'Zadanie pokazowe',
    action: 'check',
    ok: true,
    rowCount: 3,
  }));
  const { container } = render(<HistoryPanel history={history} onHistorySelect={vi.fn()} />);

  expect(screen.getAllByText(/Biblioteka/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Lekcja 1 · SELECT i LIMIT · Zadanie pokazowe/).length).toBeGreaterThan(0);
  const visibleSql = () => [...container.querySelectorAll('.history-item code')].map((element) => element.textContent);
  expect(visibleSql()).not.toContain('SELECT\n  nazwisko\nFROM autorzy;');
  fireEvent.click(screen.getByRole('button', { name: 'Następna strona historii' }));
  expect(screen.getByText('Strona 2 z 2')).toBeInTheDocument();
  expect(visibleSql()).toContain('SELECT\n  nazwisko\nFROM autorzy;');
});

it('shows a readable database name for entries created before database names were recorded', () => {
  const { container } = render(<HistoryPanel history={[{
    id: 'legacy',
    sql: 'SELECT 1;',
    timestamp: '2026-09-23T10:00:00.000Z',
    mode: 'sqlite',
    datasetId: 'biblioteka',
    ok: true,
    rowCount: 1,
  }]} onHistorySelect={vi.fn()} />);

  expect([...container.querySelectorAll('.history-context')].map((element) => element.textContent)).toContain('SQLite · Biblioteka');
});
