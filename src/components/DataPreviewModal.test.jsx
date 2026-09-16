import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DataPreviewModal from './DataPreviewModal.jsx';

const table = {
  name: 'wypozyczenia',
  columns: [{ name: 'id', type: 'INTEGER' }, { name: 'data_zwrotu', type: 'DATE' }],
};

describe('DataPreviewModal', () => {
  it('renders preview rows, null values and refresh action', () => {
    const onRefresh = vi.fn();
    render(
      <DataPreviewModal
        open
        table={table}
        databaseLabel="Biblioteka"
        mode="sqlite"
        result={{ ok: true, columns: ['id', 'data_zwrotu'], rows: [[1, null]], rowCount: 1, durationMs: 1.2 }}
        loading={false}
        onClose={vi.fn()}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Podgląd danych: wypozyczenia' })).toBeInTheDocument();
    expect(screen.getByText('Biblioteka')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Podgląd danych: wypozyczenia' })).toBeInTheDocument();
    expect(screen.getByText('NULL')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Odśwież podgląd' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders the loading and error states', () => {
    const { rerender } = render(
      <DataPreviewModal open table={table} databaseLabel="inf03_lab" mode="mysql" result={null} loading onClose={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText('Pobieram dane tabeli…')).toBeInTheDocument();

    rerender(
      <DataPreviewModal
        open
        table={table}
        databaseLabel="inf03_lab"
        mode="mysql"
        result={{ ok: false, message: 'Brak połączenia', hint: 'Uruchom MySQL.' }}
        loading={false}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('Brak połączenia')).toBeInTheDocument();
    expect(screen.getByText('Uruchom MySQL.')).toBeInTheDocument();
  });
});
