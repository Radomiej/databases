import { describe, expect, it, vi } from 'vitest';
import { getFreeOpenRouterModels, sendTutorMessage } from './aiTutorApi.js';

describe('klient API korepetytora AI', () => {
  it('wysyła rozmowę do backendu i zwraca odpowiedź', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, reply: 'Wskazówka' }) }));
    const payload = { provider: 'openai', apiKey: 'temporary-key', messages: [{ role: 'user', content: 'Pomóż' }], context: {} };
    await expect(sendTutorMessage(payload, fetchImpl)).resolves.toEqual({ ok: true, reply: 'Wskazówka' });
    expect(fetchImpl).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }));
  });

  it('pokazuje błąd backendu czytelnym komunikatem', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ ok: false, message: 'Sprawdź klucz API.' }) }));
    await expect(sendTutorMessage({ }, fetchImpl)).rejects.toThrow('Sprawdź klucz API.');
  });

  it('pobiera listę darmowych modeli z backendu bez ujawniania klucza', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, configured: true, models: [{ id: 'stealth/space-bunny-alpha', name: 'Space Bunny Alpha' }] }) }));
    await expect(getFreeOpenRouterModels(fetchImpl)).resolves.toMatchObject({ configured: true, models: [{ id: 'stealth/space-bunny-alpha' }] });
    expect(fetchImpl).toHaveBeenCalledWith('/api/ai/free-models');
  });
});
