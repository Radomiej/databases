import { fireEvent, render, screen } from '@testing-library/react';
import SqlEditor from './SqlEditor.jsx';

test('emits edited SQL and run action', () => {
  const onChange = vi.fn();
  const onRun = vi.fn();
  render(
    <SqlEditor
      value="SELECT 1"
      onChange={onChange}
      onRun={onRun}
      onCheck={vi.fn()}
      onReset={vi.fn()}
      onShowSolution={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByRole('textbox', { name: /zapytanie sql/i }), { target: { value: 'SELECT 2' } });
  fireEvent.click(screen.getByRole('button', { name: /uruchom/i }));

  expect(onChange).toHaveBeenCalledWith('SELECT 2');
  expect(onRun).toHaveBeenCalledTimes(1);
});

test('hides only the solution control for independent tasks', () => {
  const props = { value: '', onChange: vi.fn(), onRun: vi.fn(), onCheck: vi.fn(), onReset: vi.fn(), onShowSolution: vi.fn() };
  const { rerender } = render(<SqlEditor {...props} showSolution={false} />);
  expect(screen.queryByRole('button', { name: 'Rozwiązanie' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sprawdź' })).toBeInTheDocument();
  rerender(<SqlEditor {...props} showSolution />);
  expect(screen.getByRole('button', { name: 'Rozwiązanie' })).toBeInTheDocument();
});
