import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import SettingsModal from './SettingsModal.jsx';

it('shows the application version and requires confirmation before resetting the active SQLite dataset', () => {
  const onResetDatabase = vi.fn();
  render(<SettingsModal open version="1.2.3" datasetLabel="Biblioteka" onClose={vi.fn()} onResetDatabase={onResetDatabase} onFactoryReset={vi.fn()} />);

  expect(screen.getByText('1.2.3')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Resetuj lokalną bazę/i }));
  expect(onResetDatabase).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Potwierdź reset lokalnej bazy/i }));

  expect(onResetDatabase).toHaveBeenCalledTimes(1);
});

it('requires confirmation before restoring factory settings', async () => {
  const onFactoryReset = vi.fn();
  render(<SettingsModal open version="1.2.3" datasetLabel="Biblioteka" onClose={vi.fn()} onResetDatabase={vi.fn()} onFactoryReset={onFactoryReset} />);

  fireEvent.click(screen.getByRole('button', { name: /Przywróć ustawienia fabryczne/i }));
  expect(screen.getByText(/Usunąć wszystkie wymienione dane lokalne/i)).toBeInTheDocument();
  expect(onFactoryReset).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Potwierdź przywrócenie ustawień fabrycznych/i }));

  expect(onFactoryReset).toHaveBeenCalledTimes(1);
  await screen.findByRole('status');
});
