import { describe, expect, it } from 'vitest';
import { validateSchema } from './schemaValidation.js';

describe('schema validation', () => {
  it('treats an INTEGER PRIMARY KEY as non-null in SQLite metadata', () => {
    const result = validateSchema(
      [{
        name: 'osoby',
        columns: [{ name: 'id', type: 'INTEGER', primaryKey: true, notNull: false }],
        foreignKeys: [],
      }],
      {
        tables: [{
          name: 'osoby',
          columns: [{ name: 'id', type: 'INTEGER', primaryKey: true, notNull: true }],
        }],
      },
    );

    expect(result.passed, result.message).toBe(true);
  });

  it('accepts a matching SQLite schema with exact columns and constraints', () => {
    const result = validateSchema(
      [{
        name: 'notatki',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true, defaultValue: null },
          { name: 'tresc', type: 'TEXT', primaryKey: false, notNull: true, defaultValue: "'pusta'" },
        ],
        foreignKeys: [],
      }],
      {
        tables: [{
          name: 'notatki',
          exactColumns: true,
          columns: [
            { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true },
            { name: 'tresc', type: 'TEXT', notNull: true, defaultValue: "'pusta'" },
          ],
          foreignKeys: [],
        }],
      },
    );

    expect(result.passed, result.message).toBe(true);
  });

  it('accepts MySQL type spellings and additional unrelated tables', () => {
    const result = validateSchema(
      [{
        name: 'uczniowie',
        columns: [
          { name: 'id', type: 'int', primaryKey: true, notNull: true },
          { name: 'email', type: 'varchar(120)', primaryKey: false, notNull: false },
        ],
        foreignKeys: [],
      }, { name: 'inna_tabela', columns: [], foreignKeys: [] }],
      {
        tables: [{
          name: 'uczniowie',
          columns: [{ name: 'id', type: 'INTEGER', primaryKey: true, notNull: true }, { name: 'email', type: 'TEXT' }],
        }],
      },
    );

    expect(result.passed, result.message).toBe(true);
  });

  it('rejects missing columns, changed constraints and foreign keys', () => {
    const result = validateSchema(
      [{
        name: 'ksiazki',
        columns: [{ name: 'id', type: 'INTEGER', primaryKey: false, notNull: false }],
        foreignKeys: [],
      }],
      {
        tables: [{
          name: 'ksiazki',
          exactColumns: true,
          columns: [{ name: 'id', type: 'INTEGER', primaryKey: true, notNull: true }, { name: 'autor_id', type: 'INTEGER' }],
          foreignKeys: [{ from: 'autor_id', table: 'autorzy', to: 'id' }],
        }],
      },
    );

    expect(result.passed).toBe(false);
    expect(result.message).toMatch(/kolumn|klucz|relacj/i);
  });
});
