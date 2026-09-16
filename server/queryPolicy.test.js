import { describe, expect, it } from 'vitest';
import { classifyMysqlStatement, isMysqlReadOnly } from './queryPolicy.js';

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
});
