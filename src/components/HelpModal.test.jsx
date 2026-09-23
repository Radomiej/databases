import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import HelpModal from './HelpModal.jsx';

it('explains the course flow and distinguishes SQLite checking from MySQL practice', () => {
  render(<HelpModal open onClose={vi.fn()} />);

  expect(screen.getByRole('dialog', { name: 'Jak korzystać z SQL Learning Lab' })).toBeInTheDocument();
  expect(screen.getByText(/Zadanie pokazowe/i)).toBeInTheDocument();
  expect(screen.getAllByText(/w trybie SQLite/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/MySQL/i).length).toBeGreaterThan(0);
});

it('closes when the student chooses the close control', () => {
  const onClose = vi.fn();
  render(<HelpModal open onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Zamknij pomoc' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
