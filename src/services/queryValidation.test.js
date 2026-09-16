import { describe, expect, it } from 'vitest';
import { validateQueryResult } from './queryValidation.js';

describe('query validation', () => {
  it('accepts the expected columns and rows', () => {
    expect(validateQueryResult(
      { ok: true, columns: ['miasto', 'liczba'], rows: [['Gdańsk', 2], ['Kraków', 1]] },
      { columns: ['miasto', 'liczba'], rows: [['Gdańsk', 2], ['Kraków', 1]], strictOrder: true },
    ).passed).toBe(true);
  });

  it('rejects a missing condition and explains the mismatch', () => {
    const result = validateQueryResult(
      { ok: true, columns: ['nazwa'], rows: [['Laptop'], ['Mysz']] },
      { columns: ['nazwa'], rows: [['Laptop']], strictOrder: true },
    );
    expect(result.passed).toBe(false);
    expect(result.message).toMatch(/wiersz|wynik/i);
  });

  it('reports a query execution error as a failed attempt', () => {
    const result = validateQueryResult(
      { ok: false, errorType: 'syntax', message: 'Błąd składni' },
      { columns: ['id'], rows: [[1]], strictOrder: true },
    );
    expect(result.passed).toBe(false);
    expect(result.message).toMatch(/uruchom|błąd/i);
  });
});
