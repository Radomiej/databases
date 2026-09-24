import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LessonWalkthrough from './LessonWalkthrough.jsx';

const walkthrough = {
  question: 'Który film nie ma seansu?',
  steps: [
    { title: 'Połącz', explanation: 'Brak seansu daje NULL.', sql: 'SELECT 1;', expected: { columns: ['seans_id'], rows: [[null]] } },
    { title: 'Pusty wynik', explanation: 'Brak dopasowań.', sql: 'SELECT 1 WHERE 0;', expected: { columns: ['id'], rows: [] } },
  ],
  takeaway: 'Lewa tabela pozostaje.',
  pitfall: 'Nie używaj = NULL.',
};

describe('LessonWalkthrough', () => {
  it('reveals and hides the question, SQL, result tables and teaching notes', () => {
    render(<LessonWalkthrough walkthrough={walkthrough} />);
    const button = screen.getByRole('button', { name: /Zobacz krok po kroku/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Który film nie ma seansu?')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Który film nie ma seansu?')).toBeInTheDocument();
    expect(screen.getByText('SELECT 1;')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'seans_id' })).toBeInTheDocument();
    expect(screen.getByText('NULL')).toBeInTheDocument();
    expect(screen.getByText('Brak wierszy')).toBeInTheDocument();
    expect(screen.getByText('Lewa tabela pozostaje.')).toBeInTheDocument();
    expect(screen.getByText('Nie używaj = NULL.')).toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Który film nie ma seansu?')).not.toBeInTheDocument();
  });

  it('renders nothing without steps', () => {
    const { container } = render(<LessonWalkthrough walkthrough={{ question: 'Pusty', steps: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
