import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AiTutorPanel from './AiTutorPanel.jsx';

describe('pływający panel korepetytora AI', () => {
  it('otwiera się z ikonki robota i wysyła bieżący kontekst bez ukrytego rozwiązania', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true, reply: 'Użyj SELECT i FROM.' });
    render(<AiTutorPanel lesson={{ id: 'select-limit', order: 1, title: 'SELECT i LIMIT', theory: 'SELECT wybiera kolumny.' }} task={{ id: 'independent', title: 'Tytuły', prompt: 'Wypisz tytuły.', hint: 'Wybierz tytul.', solution: 'SELECT tytul FROM ksiazki;' }} schema={[{ name: 'ksiazki', columns: [{ name: 'tytul', type: 'TEXT' }] }]} sendMessage={send} />);
    fireEvent.click(screen.getByRole('button', { name: 'Otwórz korepetytora AI' }));
    expect(screen.getByRole('complementary', { name: 'Korepetytor AI' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Klucz API'), { target: { value: 'session-secret' } });
    fireEvent.change(screen.getByLabelText('Wiadomość do asystenta'), { target: { value: 'Jaka będzie kolejność?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Wyślij wiadomość' }));
    await waitFor(() => expect(screen.getByText('Użyj SELECT i FROM.')).toBeInTheDocument());
    const request = send.mock.calls[0][0];
    expect(request.apiKey).toBe('session-secret');
    expect(request.messages.at(-1)).toEqual({ role: 'user', content: 'Jaka będzie kolejność?' });
    expect(request.context.task).not.toHaveProperty('solution');
    expect(JSON.stringify(request.context)).not.toContain('SELECT tytul FROM ksiazki');
  });

  it('zamyka panel klawiszem Escape i nie zachowuje klucza w web storage', () => {
    render(<AiTutorPanel lesson={{ order: 1, title: 'SELECT', theory: '' }} task={{ prompt: 'Pokaż tytuły.' }} schema={[]} sendMessage={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Otwórz korepetytora AI' }));
    fireEvent.change(screen.getByLabelText('Klucz API'), { target: { value: 'temporary-secret' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('complementary', { name: 'Korepetytor AI' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('temporary-secret')).toBeNull();
    expect(localStorage.getItem('temporary-secret')).toBeNull();
  });
});
