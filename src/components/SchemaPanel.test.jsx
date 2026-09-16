import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SchemaPanel from './SchemaPanel.jsx';

const table = {
  name: 'autorzy',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true },
    { name: 'imie', type: 'TEXT' },
  ],
};

const dataset = { name: 'Biblioteka', tables: [table], relationships: [] };

function renderPanel(overrides = {}) {
  return render(
    <SchemaPanel
      schema={[table]}
      dataset={dataset}
      relationships={[]}
      mode="sqlite"
      onAddTable={vi.fn()}
      onPreviewTable={vi.fn()}
      onEditRelationships={vi.fn()}
      {...overrides}
    />,
  );
}

describe('SchemaPanel', () => {
  it('opens a table options menu and starts the data preview', () => {
    const onPreviewTable = vi.fn();
    renderPanel({ onPreviewTable });

    fireEvent.click(screen.getByRole('button', { name: 'Opcje tabeli autorzy' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /Podgląd danych/i }));
    expect(onPreviewTable).toHaveBeenCalledWith('autorzy');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the table options menu with Escape', () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Opcje tabeli autorzy' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('exposes the relationship editor in the Relations tab', () => {
    const onEditRelationships = vi.fn();
    renderPanel({
      relationships: [{ from: 'ksiazki.autor_id', to: 'autorzy.id' }],
      onEditRelationships,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Relacje' }));
    expect(screen.getByText('ksiazki.autor_id')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Edytuj relacje/i }));
    expect(onEditRelationships).toHaveBeenCalledTimes(1);
  });

  it('marks MySQL relationships as read-only', () => {
    renderPanel({ mode: 'mysql', relationships: [{ from: 'ksiazki.autor_id', to: 'autorzy.id' }], relationshipsReadOnly: true });

    fireEvent.click(screen.getByRole('tab', { name: 'Relacje' }));
    expect(screen.getByText('Tylko odczyt')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edytuj relacje/i })).not.toBeInTheDocument();
  });
});
