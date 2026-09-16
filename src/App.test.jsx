import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

vi.mock('./hooks/useSqliteDatabase.js', () => ({
  useSqliteDatabase: () => ({
    status: 'ready',
    error: null,
    schema: [],
    execute: vi.fn(),
    reset: vi.fn(),
    applyRelationships: vi.fn(() => ({ ok: true })),
  }),
}));

test('renders SQL Learning Lab shell', () => {
  render(<App />);
  expect(screen.getAllByText('SQL Learning Lab').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: /uruchom/i })).toBeInTheDocument();
});
