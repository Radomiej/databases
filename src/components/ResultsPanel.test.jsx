import { render, screen } from '@testing-library/react';
import ResultsPanel from './ResultsPanel.jsx';

test('renders tabular query result with row count', () => {
  render(
    <ResultsPanel
      result={{ ok: true, columns: ['id'], rows: [[1], [2]], rowCount: 2, durationMs: 3 }}
      history={[]}
      onHistorySelect={vi.fn()}
    />,
  );
  expect(screen.getByText('2 rekordy')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument();
});

test('renders an educational error state', () => {
  render(
    <ResultsPanel
      result={{ ok: false, errorType: 'syntax', message: 'Nieznana kolumna' }}
      history={[]}
      onHistorySelect={vi.fn()}
    />,
  );
  expect(screen.getByText('Nieznana kolumna')).toBeInTheDocument();
});
