import { describe, expect, it } from 'vitest';
import { buildTablePreviewSql } from './tablePreview.js';

describe('table preview query builder', () => {
  it('builds a bounded SQLite preview query with a quoted table name', () => {
    expect(buildTablePreviewSql('wypozyczenia', 'sqlite')).toBe('SELECT * FROM "wypozyczenia" LIMIT 50;');
  });

  it('builds a bounded MySQL preview query with escaped identifier', () => {
    expect(buildTablePreviewSql('raport`miesiac', 'mysql', 12)).toBe('SELECT * FROM `raport``miesiac` LIMIT 12;');
  });

  it('rejects an invalid table name before it reaches the SQL engine', () => {
    expect(() => buildTablePreviewSql('tabele; DROP TABLE uczniowie', 'sqlite')).toThrow('Niepoprawna nazwa tabeli');
  });
});
