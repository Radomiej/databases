import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import SettingsModal from './SettingsModal.jsx';

it('shows the application version and requires confirmation before resetting the active SQLite dataset', () => {
  const onResetDatabase = vi.fn();
  render(<SettingsModal open version="1.2.3" mode="sqlite" datasetLabel="Biblioteka" onClose={vi.fn()} onResetDatabase={onResetDatabase} onFactoryReset={vi.fn()} />);

  expect(screen.getByText('1.2.3')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Resetuj lokalną bazę/i }));
  expect(onResetDatabase).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Potwierdź reset lokalnej bazy/i }));

  expect(onResetDatabase).toHaveBeenCalledTimes(1);
});

it('warns that factory reset leaves MySQL data untouched and requires confirmation', async () => {
  const onFactoryReset = vi.fn();
  render(<SettingsModal open version="1.2.3" mode="mysql" datasetLabel="Biblioteka" onClose={vi.fn()} onResetDatabase={vi.fn()} onFactoryReset={onFactoryReset} />);

  fireEvent.click(screen.getByRole('button', { name: /Przywróć ustawienia fabryczne/i }));
  expect(screen.getByText(/nie zmienia danych na serwerze MySQL/i)).toBeInTheDocument();
  expect(onFactoryReset).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Potwierdź przywrócenie ustawień fabrycznych/i }));

  expect(onFactoryReset).toHaveBeenCalledTimes(1);
  await screen.findByRole('status');
});

it('does not offer a local SQLite reset while MySQL mode is selected', () => {
  render(<SettingsModal open version="1.2.3" mode="mysql" datasetLabel="Biblioteka" onClose={vi.fn()} onResetDatabase={vi.fn()} onFactoryReset={vi.fn()} />);

  expect(screen.getByRole('button', { name: /Resetuj lokalną bazę/i })).toBeDisabled();
});
