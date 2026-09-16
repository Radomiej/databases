import { describe, expect, it } from 'vitest';
import { buildCreateTableSql } from './schemaBuilder.js';

describe('schema builder', () => {
  it('builds a safe CREATE TABLE statement', () => {
    expect(buildCreateTableSql({
      tableName: 'notatki',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true },
        { name: 'tresc', type: 'TEXT', primaryKey: false, notNull: false },
      ],
    })).toBe('CREATE TABLE "notatki" ("id" INTEGER PRIMARY KEY NOT NULL, "tresc" TEXT);');
  });

  it('rejects identifiers outside the supported SQL name format', () => {
    expect(() => buildCreateTableSql({ tableName: 'notatki; DROP TABLE x', columns: [] })).toThrow(/nazwa/i);
  });
});
