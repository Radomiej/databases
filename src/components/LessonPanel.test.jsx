import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LessonPanel from './LessonPanel.jsx';

const dataset = { name: 'Biblioteka' };
const tasks = [
  { id: 'guided', title: 'Zadanie pokazowe', prompt: 'Pokaż tytuły książek.', hint: 'Użyj SELECT.', solution: 'SELECT tytul FROM ksiazki;', expected: { columns: ['tytul'], rows: [] } },
  { id: 'solo-1', title: 'Samodzielnie 1', prompt: 'Pokaż autorów.', hint: 'Wybierz tabelę autorzy.', solution: 'SELECT * FROM autorzy;', expected: { columns: [], rows: [] } },
  { id: 'solo-2', title: 'Samodzielnie 2', prompt: 'Pokaż wypożyczenia.', hint: 'Wybierz tabelę wypozyczenia.', solution: 'SELECT * FROM wypozyczenia;', expected: { columns: [], rows: [] } },
];

describe('LessonPanel', () => {
  it('shows a visible task checklist with the first task active', () => {
    render(
      <LessonPanel
        lesson={{ order: 1, title: 'SELECT i LIMIT', difficulty: 'Start', theory: 'Wybieranie danych.', tasks }}
        dataset={dataset}
        databaseStatus="ready"
        activeTaskId="guided"
        taskProgress={{}}
        onTaskChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Zadanie do wykonania' })).toBeInTheDocument();
    expect(screen.getByText('Pokazowe · Zadanie 1')).toBeInTheDocument();
    expect(screen.getByText('Pokaż tytuły książek.')).toBeInTheDocument();
    expect(screen.getByText('Samodzielnie 1')).toBeInTheDocument();
    expect(screen.getByText('Samodzielnie 2')).toBeInTheDocument();
    expect(document.querySelector('.bi-filetype-html')).toBeInTheDocument();
  });

  it('selects a later task without presenting its solution', () => {
    const onTaskChange = vi.fn();
    render(
      <LessonPanel
        lesson={{ order: 1, title: 'SELECT i LIMIT', difficulty: 'Start', theory: 'Wybieranie danych.', tasks }}
        dataset={dataset}
        databaseStatus="ready"
        activeTaskId="guided"
        taskProgress={{}}
        onTaskChange={onTaskChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Samodzielnie 1/i }));

    expect(onTaskChange).toHaveBeenCalledWith('solo-1');
  });
});
