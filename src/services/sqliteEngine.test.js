import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import initSqlJsForTest from 'sql.js';
import { DATASETS } from '../data/datasets.js';
import {
  classifyStatement,
  createSqliteDatabase,
  executeSqliteQuery,
  getSqliteSchema,
  normalizeSqliteRows,
} from './sqliteEngine.js';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

describe('sqlite engine helpers', () => {
  it('normalizes result columns and rows', () => {
    expect(normalizeSqliteRows({ columns: ['id'], values: [[1], [2]] })).toEqual({
      columns: ['id'],
      rows: [[1], [2]],
      rowCount: 2,
    });
  });

  it('classifies SQL statements without changing their contents', () => {
    expect(classifyStatement(' select * from ksiazki ')).toBe('SELECT');
    expect(classifyStatement('WITH x AS (SELECT 1) SELECT * FROM x')).toBe('WITH');
    expect(classifyStatement("insert into autorzy values (1, 'Jan', 'Kowalski', 'PL')")).toBe('INSERT');
  });

  it('executes GROUP BY and LEFT JOIN against the seeded shop dataset', async () => {
    const { db, destroy } = await createSqliteDatabase(DATASETS.find((item) => item.id === 'sklep'), initSqlJsForTest, () => wasmPath);
    const grouped = executeSqliteQuery(db, 'SELECT k.miasto, COUNT(*) AS liczba FROM klienci k GROUP BY k.miasto ORDER BY k.miasto');
    const joined = executeSqliteQuery(db, 'SELECT p.nazwa, z.id FROM produkty p LEFT JOIN pozycje_zamowien z ON z.produkt_id = p.id ORDER BY p.id');
    const schema = getSqliteSchema(db);
    expect(grouped.ok).toBe(true);
    expect(grouped.columns).toEqual(['miasto', 'liczba']);
    expect(joined.ok).toBe(true);
    expect(joined.columns).toEqual(['nazwa', 'id']);
    expect(schema.map((item) => item.name)).toEqual(['klienci', 'pozycje_zamowien', 'produkty', 'zamowienia']);
    destroy();
  });

  it('reports zero changed rows for DDL statements', async () => {
    const { db, destroy } = await createSqliteDatabase(DATASETS[0], initSqlJsForTest, () => wasmPath);
    const result = executeSqliteQuery(db, 'CREATE TABLE notatki (id INTEGER PRIMARY KEY, tresc TEXT)');
    expect(result).toMatchObject({ ok: true, statementType: 'CREATE', changedRows: 0 });
    destroy();
  });
});
