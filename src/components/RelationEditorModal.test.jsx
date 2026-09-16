import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RelationEditorModal from './RelationEditorModal.jsx';

const schema = [
  {
    name: 'autorzy',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true },
      { name: 'imie', type: 'TEXT' },
    ],
  },
  {
    name: 'ksiazki',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true },
      { name: 'autor_id', type: 'INTEGER' },
    ],
  },
];

describe('RelationEditorModal', () => {
  it('adds a relation and sends the normalized format on save', async () => {
    const onSave = vi.fn();
    render(<RelationEditorModal open schema={schema} relationships={[]} onClose={vi.fn()} onSave={onSave} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Dodaj relację/i }));
    fireEvent.change(screen.getByLabelText('Tabela źródłowa 1'), { target: { value: 'ksiazki' } });
    fireEvent.change(screen.getByLabelText('Kolumna źródłowa 1'), { target: { value: 'autor_id' } });
    fireEvent.change(screen.getByLabelText('Tabela docelowa 1'), { target: { value: 'autorzy' } });
    fireEvent.change(screen.getByLabelText('Kolumna docelowa 1'), { target: { value: 'id' } });
    fireEvent.click(screen.getByRole('button', { name: /Zapisz relacje/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith([{ from: 'ksiazki.autor_id', to: 'autorzy.id' }]));
  });

  it('removes a relation row before saving', async () => {
    const onSave = vi.fn();
    render(<RelationEditorModal open schema={schema} relationships={[{ from: 'ksiazki.autor_id', to: 'autorzy.id' }]} onClose={vi.fn()} onSave={onSave} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Usuń relację 1/i }));
    fireEvent.click(screen.getByRole('button', { name: /Zapisz relacje/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith([]));
  });

  it('requests reset of saved relationships after confirmation', async () => {
    const onReset = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<RelationEditorModal open schema={schema} relationships={[]} onClose={vi.fn()} onSave={vi.fn()} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: /Resetuj relacje/i }));

    await waitFor(() => expect(onReset).toHaveBeenCalledTimes(1));
  });

  it('locks page scrolling while open', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<RelationEditorModal open schema={schema} relationships={[]} onClose={vi.fn()} onSave={vi.fn()} onReset={vi.fn()} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
  });
});
