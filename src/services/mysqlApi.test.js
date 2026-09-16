import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testConnection } from './mysqlApi.js';

describe('mysql api client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('posts connection fields without storing them', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true, serverVersion: '8.0' }) });
    await testConnection({ host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: 'secret' });
    expect(fetch).toHaveBeenCalledWith('/api/mysql/test-connection', expect.objectContaining({ method: 'POST' }));
    expect(JSON.stringify(fetch.mock.calls[0])).not.toContain('localStorage');
    expect(JSON.stringify(fetch.mock.calls[0])).toContain('secret');
  });
});
