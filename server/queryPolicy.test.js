import { describe, expect, it } from 'vitest';
import { classifyMysqlStatement, createMysqlConfig, isMysqlReadOnly } from './queryPolicy.js';

describe('MySQL query policy', () => {
  it('allows read statements', () => {
    expect(classifyMysqlStatement('SELECT * FROM klienci')).toBe('SELECT');
    expect(isMysqlReadOnly('SHOW TABLES')).toBe(true);
    expect(isMysqlReadOnly('WITH x AS (SELECT 1) SELECT * FROM x')).toBe(true);
  });

  it('blocks mutations by default', () => {
    expect(isMysqlReadOnly('DROP TABLE klienci')).toBe(false);
    expect(isMysqlReadOnly("UPDATE klienci SET miasto = 'Gdańsk'")).toBe(false);
  });

  it('enables mutations only when the environment flag and UI flag are both true', () => {
    const enabled = createMysqlConfig({ database: 'inf03_lab', allowMutations: true }, { MYSQL_ALLOW_MUTATIONS: 'true' });
    const disabled = createMysqlConfig({ database: 'inf03_lab', allowMutations: true }, { MYSQL_ALLOW_MUTATIONS: 'false' });
    expect(enabled.allowMutations).toBe(true);
    expect(disabled.allowMutations).toBe(false);
  });
});
