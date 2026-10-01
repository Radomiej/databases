import { describe, expect, it, vi } from 'vitest';
import { requestTutorReply } from './aiTutor.js';

const messages = [{ role: 'user', content: 'Pokaż mi wskazówkę.' }];
const context = { lesson: { order: 1, title: 'SELECT i LIMIT', theory: 'SELECT wybiera kolumny.' }, task: { title: 'Tytuły', prompt: 'Wypisz tytuły.', hint: 'Wybierz kolumnę tytul.' }, schema: [{ name: 'ksiazki', columns: [{ name: 'tytul', type: 'TEXT' }] }] };

describe('AI tutor provider connector', () => {
  it('wysyła wiadomość do Claude Messages API z kluczem tylko w nagłówku', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'Użyj SELECT.' }] }) }));
    const result = await requestTutorReply({ provider: 'claude', apiKey: 'sk-ant-test-secret', messages, context }, fetchImpl);
    expect(result).toEqual({ ok: true, reply: 'Użyj SELECT.', provider: 'claude', model: expect.stringContaining('claude-haiku') });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(options.headers['x-api-key']).toBe('sk-ant-test-secret');
    expect(options.body).not.toContain('sk-ant-test-secret');
    expect(options.headers['anthropic-version']).toBeTruthy();
  });

  it('wysyła rozmowę do OpenAI Responses API z uwierzytelnianiem Bearer', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ output_text: 'Zacznij od SELECT.' }) }));
    const result = await requestTutorReply({ provider: 'openai', apiKey: 'sk-test-secret', messages, context }, fetchImpl);
    expect(result).toEqual({ ok: true, reply: 'Zacznij od SELECT.', provider: 'openai', model: expect.any(String) });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(options.headers.authorization).toBe('Bearer sk-test-secret');
    expect(options.body).not.toContain('sk-test-secret');
  });

  it('przekazuje wyłącznie jawny kontekst lekcji, zadania i schematu; odrzuca nadmiarowe wiadomości', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'Pomoc.' }] }) }));
    await requestTutorReply({ provider: 'claude', apiKey: 'secret', messages, context }, fetchImpl);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain('SELECT i LIMIT');
    expect(JSON.stringify(body)).toContain('ksiazki');
    expect(JSON.stringify(body)).not.toContain('haslo_mysql');
    await expect(requestTutorReply({ provider: 'claude', apiKey: 'secret', messages: Array(20).fill(messages[0]), context }, fetchImpl)).rejects.toThrow();
  });

  it('odrzuca nieznanego dostawcę i brak klucza bez wysyłania żądania', async () => {
    const fetchImpl = vi.fn();
    await expect(requestTutorReply({ provider: 'other', apiKey: 'secret', messages, context }, fetchImpl)).rejects.toThrow();
    await expect(requestTutorReply({ provider: 'openai', apiKey: '', messages, context }, fetchImpl)).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('zwraca czytelny błąd dostawcy bez ujawniania klucza', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid API key' } }) }));
    await expect(requestTutorReply({ provider: 'openai', apiKey: 'secret-key', messages, context }, fetchImpl)).rejects.toThrow(/klucz API/i);
  });
});
