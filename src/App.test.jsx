import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders SQL Learning Lab shell', () => {
  render(<App />);
  expect(screen.getByText('SQL Learning Lab')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /uruchom/i })).toBeInTheDocument();
});
