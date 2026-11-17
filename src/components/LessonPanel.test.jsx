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
  it('omits the walkthrough control for lessons without an explanation', () => {
    render(<LessonPanel lesson={{ id: 'select-limit', order: 1, title: 'SELECT', theory: 'Wybieranie.', tasks }} dataset={dataset} databaseStatus="ready" activeTaskId="guided" />);
    expect(screen.queryByRole('button', { name: /Zobacz krok po kroku/ })).not.toBeInTheDocument();
  });
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
    expect(document.querySelector('.bi-list-check')).toBeInTheDocument();
  });

  it('keeps example, quick check and tasks together in one ordered lesson page', () => {
    const lesson = { id: 'select-limit', order: 1, title: 'SELECT i LIMIT', difficulty: 'Start', theory: 'Wybieranie danych.', example: 'SELECT tytul FROM ksiazki LIMIT 3;', syntax: ['SELECT kolumna FROM tabela;'], tasks };
    const { container } = render(<LessonPanel lesson={lesson} dataset={dataset} databaseStatus="ready" activeTaskId="guided" onTaskChange={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Przykład SQL' })).toHaveTextContent('SELECT tytul FROM ksiazki LIMIT 3;');
    expect(screen.getByRole('region', { name: 'Krótka próba' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Zadanie do wykonania' })).toBeInTheDocument();
    const labels = [...container.querySelectorAll('.sql-flow-eyebrow')].map((node) => node.textContent);
    expect(labels).toEqual(['01 · Poznaj i prześledź', '02 · Sprawdź, czy rozumiesz', '03 · Spróbuj samodzielnie']);
  });

  it('checks the concept question without executing or changing the SQL editor', () => {
    render(<LessonPanel lesson={{ id: 'select-limit', order: 1, title: 'SELECT i LIMIT', theory: 'Wybieranie danych.', example: 'SELECT tytul FROM ksiazki LIMIT 3;', tasks }} dataset={dataset} databaseStatus="ready" activeTaskId="guided" onTaskChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Liczbę kolumn do trzech.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sprawdź odpowiedź' }));
    expect(screen.getByRole('status')).toHaveTextContent('Jeszcze nie. Liczbę wierszy w wyniku do trzech.');
    fireEvent.click(screen.getByRole('radio', { name: 'Liczbę wierszy w wyniku do trzech.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sprawdź odpowiedź' }));
    expect(screen.getByRole('status')).toHaveTextContent('Dobrze. Liczbę wierszy w wyniku do trzech.');
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

  it('expands only the selected task and shows exact result columns before revealing the hint', () => {
    const lesson = { order: 6, title: 'GROUP BY', difficulty: 'Średni', theory: 'Grupowanie.', id: 'group-by', tasks: [
      { id: 'one', title: 'Zadanie pokazowe', prompt: 'Policz produkty.', hint: 'Użyj COUNT(*).', expected: { columns: ['kategoria', 'liczba'], rows: [] } },
      { id: 'two', title: 'Drugie zadanie', prompt: 'Policz zamówienia.', hint: 'Użyj tabeli zamowienia.', expected: { columns: ['status', 'liczba'], rows: [] } },
    ] };
    const { rerender } = render(<LessonPanel lesson={lesson} dataset={dataset} databaseStatus="ready" activeTaskId="one" onTaskChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Zadanie pokazowe/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Drugie zadanie/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Kolumny wyniku (w tej kolejności)')).toBeInTheDocument();
    expect(screen.getByText('kategoria, liczba')).toBeInTheDocument();
    expect(screen.queryByText('Policz zamówienia.')).not.toBeInTheDocument();
    expect(screen.queryByText('Użyj COUNT(*).')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż podpowiedź' }));
    expect(screen.getByText('Użyj COUNT(*).')).toBeInTheDocument();

    rerender(<LessonPanel lesson={lesson} dataset={dataset} databaseStatus="ready" activeTaskId="two" onTaskChange={vi.fn()} />);
    expect(screen.getByText('status, liczba')).toBeInTheDocument();
    expect(screen.queryByText('Użyj tabeli zamowienia.')).not.toBeInTheDocument();
  });

  it('lets the student collapse and reopen the active task', () => {
    render(<LessonPanel lesson={{ id: 'select-limit', order: 1, title: 'SELECT', difficulty: 'Start', theory: 'Wybieranie.', tasks }} dataset={dataset} databaseStatus="ready" activeTaskId="guided" onTaskChange={vi.fn()} />);
    const activeButton = screen.getByRole('button', { name: /Zadanie pokazowe/i });

    fireEvent.click(activeButton);
    expect(activeButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Pokaż tytuły książek.')).not.toBeInTheDocument();

    fireEvent.click(activeButton);
    expect(activeButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Pokaż tytuły książek.')).toBeInTheDocument();
  });

  it('shows the required table columns, constraints and foreign key for a schema task', () => {
    const lesson = { order: 16, title: 'Relacje', difficulty: 'Struktura', theory: 'Klucze obce.', id: 'schema-relations', tasks: [
      { id: 'relation', title: 'Zadanie pokazowe', prompt: 'Utwórz tabelę.', hint: 'Użyj REFERENCES.', expectedSchema: { tables: [{ name: 'wypozyczenia_lab', exactColumns: true, columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'osoba_id', type: 'INTEGER', notNull: true },
        { name: 'status', type: 'TEXT', defaultValue: 'nowa' },
      ], foreignKeys: [{ from: 'osoba_id', table: 'osoby', to: 'id' }] }] } },
    ] };
    render(<LessonPanel lesson={lesson} dataset={dataset} databaseStatus="ready" activeTaskId="relation" onTaskChange={vi.fn()} />);

    expect(screen.getByText('Tabela: wypozyczenia_lab')).toBeInTheDocument();
    expect(screen.getByText('id INTEGER PRIMARY KEY')).toBeInTheDocument();
    expect(screen.getByText('osoba_id INTEGER NOT NULL')).toBeInTheDocument();
    expect(screen.getByText('status TEXT DEFAULT „nowa”')).toBeInTheDocument();
    expect(screen.getByText('osoba_id → osoby.id')).toBeInTheDocument();
  });
});
