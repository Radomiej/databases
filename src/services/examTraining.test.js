import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import { createExamTraining } from './examTraining.js';
import { createSqliteDatabase } from './sqliteEngine.js';
import { runTrainingQuery, validateTrainingResult } from './trainingGenerator.js';

const wasm = createRequire(import.meta.url).resolve('sql.js/dist/sql-wasm.wasm');

describe('trening egzaminacyjny', () => {
  it('uruchamia i ocenia wszystkie kwerendy na powiązanych tabelach', async () => {
    const session = await createExamTraining({}, initSqlJs, () => wasm);
    expect(session.tasks).toHaveLength(4);
    const { db, destroy } = await createSqliteDatabase(session.dataset, initSqlJs, () => wasm);
    try {
      for (const task of session.tasks) {
        expect(validateTrainingResult(runTrainingQuery(db, task.solution), task).passed).toBe(true);
        expect(validateTrainingResult(runTrainingQuery(db, 'SELECT 1;'), task).passed).toBe(false);
      }
      expect(session.tasks[0].expected.rows).toHaveLength(4);
      expect(session.tasks[1].expected.rows).toHaveLength(4);
      expect(session.tasks[2].expected.rows).toHaveLength(2);
      expect(session.tasks[3].expected.rows).toHaveLength(2);
    } finally { destroy(); }
  });

  it('pozwala wybrać pojedynczą kwerendę i odrzuca nieistniejące identyfikatory', async () => {
    const session = await createExamTraining({ taskId: 'rzeki-3' }, initSqlJs, () => wasm);
    expect(session.tasks.map((task) => task.id)).toEqual(['rzeki-3']);
    await expect(createExamTraining({ taskId: 'unknown' }, initSqlJs, () => wasm)).rejects.toThrow();
  });
});
