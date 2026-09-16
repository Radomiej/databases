import { createRequire } from 'node:module';
import initSqlJsForTest from 'sql.js';
import { describe, expect, it } from 'vitest';
import { DATASET_MAP } from './datasets.js';
import { LESSONS } from './lessons.js';
import { createSqliteDatabase, executeSqliteQuery } from '../services/sqliteEngine.js';
import { validateQueryResult } from '../services/queryValidation.js';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

describe('lesson solutions', () => {
  it.each(LESSONS)('solution for lesson $order executes and matches expected result', async (lesson) => {
    const { db, destroy } = await createSqliteDatabase(DATASET_MAP[lesson.datasetId], initSqlJsForTest, () => wasmPath);
    const result = executeSqliteQuery(db, lesson.solution);
    const validation = validateQueryResult(result, lesson.expected);
    destroy();

    expect(result.ok).toBe(true);
    expect(validation.passed, validation.message).toBe(true);
  });
});
