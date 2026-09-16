import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConnectorHealth, listRelations, testConnection } from './mysqlApi.js';

describe('mysql api client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('posts connection fields without storing them', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true, serverVersion: '8.0' }) });
    await testConnection({ host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: 'secret' });
    expect(fetch).toHaveBeenCalledWith('/api/mysql/test-connection', expect.objectContaining({ method: 'POST' }));
    expect(JSON.stringify(fetch.mock.calls[0])).not.toContain('localStorage');
    expect(JSON.stringify(fetch.mock.calls[0])).toContain('secret');
  });

  it('reads connector capabilities from the health endpoint', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true, allowMutationsAvailable: false }) });
    await expect(getConnectorHealth()).resolves.toMatchObject({ ok: true, allowMutationsAvailable: false });
    expect(fetch).toHaveBeenCalledWith('/api/health');
  });

  it('loads read-only relationship metadata from the connector', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, relationships: [{ from: 'zamowienia.klient_id', to: 'klienci.id' }] }),
    });

    await expect(listRelations({ host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: '' }))
      .resolves.toMatchObject({ relationships: [{ from: 'zamowienia.klient_id', to: 'klienci.id' }] });
    expect(fetch).toHaveBeenCalledWith('/api/mysql/relations', expect.objectContaining({ method: 'POST' }));
  });
});
