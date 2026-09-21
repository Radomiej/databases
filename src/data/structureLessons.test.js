import { createRequire } from 'node:module';
import initSqlJsForTest from 'sql.js';
import { describe, expect, it } from 'vitest';
import { DATASET_MAP } from './datasets.js';
import { STRUCTURE_LESSONS } from './structureLessons.js';
import { createSqliteDatabase, executeSqliteQuery, getSqliteSchema } from '../services/sqliteEngine.js';
import { validateSchema } from '../services/schemaValidation.js';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

describe('structure lessons', () => {
  it('contains four schema lessons with three tasks each', () => {
    expect(STRUCTURE_LESSONS).toHaveLength(4);
    STRUCTURE_LESSONS.forEach((lesson) => {
      expect(lesson.tasks).toHaveLength(3);
      lesson.tasks.forEach((task) => {
        expect(task.expectedSchema).toBeTruthy();
        expect(task.solution).toMatch(/^(CREATE|ALTER)\s+TABLE/i);
      });
    });
  });

  it('executes every schema task in course order and validates the resulting SQLite schema', async () => {
    const { db, destroy } = await createSqliteDatabase(DATASET_MAP['structure-lab'], initSqlJsForTest, () => wasmPath);

    STRUCTURE_LESSONS.forEach((lesson) => lesson.tasks.forEach((task) => {
      const result = executeSqliteQuery(db, task.solution);
      expect(result.ok, `${lesson.id}/${task.id}: ${result.message}`).toBe(true);
      const validation = validateSchema(getSqliteSchema(db), task.expectedSchema);
      expect(validation.passed, `${lesson.id}/${task.id}: ${validation.message}`).toBe(true);
    }));

    destroy();
  });
});
