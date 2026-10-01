import { describe, expect, it, vi } from 'vitest';
import { listFreeOpenRouterModels, requestTutorReply } from './aiTutor.js';

const messages = [{ role: 'user', content: 'Pokaż mi wskazówkę.' }];
const context = { lesson: { order: 1, title: 'SELECT i LIMIT', theory: 'SELECT wybiera kolumny.' }, task: { title: 'Tytuły', prompt: 'Wypisz tytuły.', hint: 'Wybierz kolumnę tytul.' }, schema: [{ name: 'ksiazki', columns: [{ name: 'tytul', type: 'TEXT' }] }] };

describe('AI tutor provider connector', () => {
  it('korzysta z serwerowego klucza OpenRouter i wymusza darmowy model po kontroli cennika', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 'stealth/space-bunny-alpha', pricing: { prompt: '0', completion: '0' } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'Oto wskazówka.' } }] }) });
    const result = await requestTutorReply({ provider: 'openrouter', model: 'stealth/space-bunny-alpha', messages, context }, fetchImpl, undefined, { OPENROUTER_API_KEY: 'server-only-key' });
    expect(result).toEqual({ ok: true, reply: 'Oto wskazówka.', provider: 'openrouter', model: 'stealth/space-bunny-alpha' });
    expect(fetchImpl).toHaveBeenNthCalledWith(1, expect.stringContaining('/models'), expect.objectContaining({ method: 'GET' }));
    const [url, options] = fetchImpl.mock.calls[1];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options.headers.authorization).toBe('Bearer server-only-key');
    expect(options.body).toContain('stealth/space-bunny-alpha');
  });

  it('blokuje OpenRouter, jeśli model przestaje być całkowicie darmowy', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ data: [{ id: 'stealth/space-bunny-alpha', pricing: { prompt: '0.1', completion: '0' } }] }) }));
    await expect(requestTutorReply({ provider: 'openrouter', model: 'stealth/space-bunny-alpha', messages, context }, fetchImpl, undefined, { OPENROUTER_API_KEY: 'server-only-key' })).rejects.toThrow(/nie jest już darmowy/i);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('odmawia trybu OpenRouter, jeśli sekret serwera nie jest skonfigurowany', async () => {
    const fetchImpl = vi.fn();
    await expect(requestTutorReply({ provider: 'openrouter', model: 'stealth/space-bunny-alpha', messages, context }, fetchImpl, undefined, {})).rejects.toThrow(/nie jest skonfigurowany/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('zwraca w selektorze tylko modele, których oba tokeny kosztują zero', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ data: [
      { id: 'free/example', name: 'Free Example', pricing: { prompt: '0', completion: '0' } },
      { id: 'paid/example', name: 'Paid Example', pricing: { prompt: '0', completion: '0.01' } },
      { id: 'request-fee/example', name: 'Request Fee Example', pricing: { prompt: '0', completion: '0', request: '0.001' } },
    ] }) }));
    await expect(listFreeOpenRouterModels(fetchImpl, { OPENROUTER_API_KEY: 'server-only-key' })).resolves.toEqual({
      configured: true,
      models: [{ id: 'free/example', name: 'Free Example' }],
    });
  });

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

  it('obsługuje własny endpoint OpenAI-compatible i model, np. OpenRouter Chat Completions', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Wskazówka z routera.' } }] }) }));
    const lookupImpl = vi.fn(async () => [{ address: '104.18.7.15', family: 4 }]);
    const result = await requestTutorReply({ provider: 'openai', apiKey: 'router-secret', baseUrl: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-haiku-4.5', messages, context }, fetchImpl, lookupImpl);
    expect(result).toMatchObject({ ok: true, reply: 'Wskazówka z routera.', provider: 'openai', model: 'anthropic/claude-haiku-4.5' });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options.headers.authorization).toBe('Bearer router-secret');
    expect(JSON.parse(options.body)).toMatchObject({ model: 'anthropic/claude-haiku-4.5', messages: [{ role: 'system' }, ...messages] });
    expect(lookupImpl).toHaveBeenCalledWith('openrouter.ai', { all: true, verbatim: true });
  });

  it('blokuje niebezpieczne custom endpointy przed wysłaniem klucza API', async () => {
    const fetchImpl = vi.fn();
    const privateLookup = vi.fn(async () => [{ address: '10.0.0.8', family: 4 }]);
    await expect(requestTutorReply({ provider: 'openai', apiKey: 'secret', baseUrl: 'https://api.example.net/v1', messages, context }, fetchImpl, privateLookup)).rejects.toThrow(/publiczny serwer/i);
    await expect(requestTutorReply({ provider: 'openai', apiKey: 'secret', baseUrl: 'http://example.com/v1', messages, context }, fetchImpl, privateLookup)).rejects.toThrow(/publicznym adresem HTTPS/i);
    await expect(requestTutorReply({ provider: 'openai', apiKey: 'secret', baseUrl: 'https://127.0.0.1/v1', messages, context }, fetchImpl, privateLookup)).rejects.toThrow(/publicznym adresem HTTPS/i);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(privateLookup).toHaveBeenCalledTimes(1);
  });

  it('odrzuca niepoprawny typ custom URL bez wysyłania żądania', async () => {
    const fetchImpl = vi.fn();
    await expect(requestTutorReply({ provider: 'openai', apiKey: 'secret', baseUrl: null, messages, context }, fetchImpl)).rejects.toThrow(/HTTPS/i);
    expect(fetchImpl).not.toHaveBeenCalled();
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
