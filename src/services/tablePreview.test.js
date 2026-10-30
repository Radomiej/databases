import { describe, expect, it } from 'vitest';
import { buildTablePreviewSql } from './tablePreview.js';

describe('table preview query builder', () => {
  it('builds a bounded SQLite preview query with a quoted table name', () => {
    expect(buildTablePreviewSql('wypozyczenia')).toBe('SELECT * FROM "wypozyczenia" LIMIT 50;');
  });

  it('honours a custom limit', () => {
    expect(buildTablePreviewSql('raport', 12)).toBe('SELECT * FROM "raport" LIMIT 12;');
  });

  it('rejects an invalid table name before it reaches the SQL engine', () => {
    expect(() => buildTablePreviewSql('tabele; DROP TABLE uczniowie')).toThrow('Niepoprawna nazwa tabeli');
  });
});
