import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import initSqlJsForTest from 'sql.js';
import { DATASETS } from '../data/datasets.js';
import { executeSqliteQuery, createSqliteDatabase, getSqliteSchema } from './sqliteEngine.js';
import { applySqliteRelationships } from './sqliteRelations.js';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
const dataset = DATASETS.find((item) => item.id === 'biblioteka');

async function openDatabase() {
  return createSqliteDatabase(dataset, initSqlJsForTest, () => wasmPath);
}

describe('sqlite relationship editor engine', () => {
  it('adds a foreign key and keeps existing table rows', async () => {
    const { db, destroy } = await openDatabase();
    db.run('CREATE TABLE notatki (id INTEGER PRIMARY KEY, autor_id INTEGER, tresc TEXT);');
    db.run("INSERT INTO notatki (id, autor_id, tresc) VALUES (1, 1, 'uwaga');");

    const result = applySqliteRelationships(db, [
      ...dataset.relationships,
      { from: 'notatki.autor_id', to: 'autorzy.id' },
    ]);

    expect(result.ok).toBe(true);
    expect(getSqliteSchema(db).find((table) => table.name === 'notatki').foreignKeys).toEqual([
      { table: 'autorzy', from: 'autor_id', to: 'id' },
    ]);
    expect(executeSqliteQuery(db, 'SELECT id, autor_id, tresc FROM notatki').rows).toEqual([[1, 1, 'uwaga']]);
    destroy();
  });

  it('edits an existing foreign key without dropping rows', async () => {
    const { db, destroy } = await openDatabase();

    const result = applySqliteRelationships(db, [
      { from: 'ksiazki.autor_id', to: 'ksiazki.id' },
      { from: 'wypozyczenia.ksiazka_id', to: 'ksiazki.id' },
    ]);

    expect(result.ok).toBe(true);
    expect(getSqliteSchema(db).find((table) => table.name === 'ksiazki').foreignKeys).toEqual([
      { table: 'ksiazki', from: 'autor_id', to: 'id' },
    ]);
    expect(executeSqliteQuery(db, 'SELECT COUNT(*) AS liczba FROM ksiazki').rows).toEqual([[8]]);
    destroy();
  });

  it('removes a foreign key when it is missing from the next relationship list', async () => {
    const { db, destroy } = await openDatabase();

    const result = applySqliteRelationships(db, [
      { from: 'wypozyczenia.ksiazka_id', to: 'ksiazki.id' },
    ]);

    expect(result.ok).toBe(true);
    expect(getSqliteSchema(db).find((table) => table.name === 'ksiazki').foreignKeys).toEqual([]);
    expect(executeSqliteQuery(db, 'SELECT COUNT(*) AS liczba FROM ksiazki').rows).toEqual([[8]]);
    destroy();
  });

  it('rejects invalid data and leaves the original schema intact', async () => {
    const { db, destroy } = await openDatabase();
    db.run('CREATE TABLE notatki (id INTEGER PRIMARY KEY, autor_id INTEGER);');
    db.run('INSERT INTO notatki (id, autor_id) VALUES (1, 999);');

    const result = applySqliteRelationships(db, [
      ...dataset.relationships,
      { from: 'notatki.autor_id', to: 'autorzy.id' },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('relationship');
    expect(getSqliteSchema(db).find((table) => table.name === 'notatki').foreignKeys).toEqual([]);
    destroy();
  });
});
