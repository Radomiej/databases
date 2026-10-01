import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import { generateTraining, validateTrainingResult, runTrainingQuery } from './trainingGenerator.js';
import { createSqliteDatabase } from './sqliteEngine.js';
import { LESSON_TOPIC_PLAN, getSqlTopics } from '../data/lessonCurriculum.js';

const wasm = createRequire(import.meta.url).resolve('sql.js/dist/sql-wasm.wasm');
const generate = (options) => generateTraining(options, initSqlJs, () => wasm);
const base = { start: 1, end: 8, count: 10, difficulty: 'standard', theme: 'shop', rows: 24, seed: 'KLASA-A' };

describe('samodzielny trening SQL', () => {
  it('odtwarza identyczny zestaw z kodu i parametrów, a inny kod zmienia dane', async () => {
    const first = await generate(base);
    expect(await generate(base)).toEqual(first);
    expect((await generate({ ...base, seed: 'KLASA-B' })).dataset.seedSql).not.toEqual(first.dataset.seedSql);
  });

  it('wszystkie poziomy i tematy mają rozwiązywalne zadania wyłącznie z poznanego materiału', async () => {
    for (const theme of ['shop', 'sport', 'rental']) {
      for (const difficulty of ['easy', 'standard', 'challenge']) {
        const session = await generate({ ...base, theme, difficulty });
        expect(new Set(session.tasks.map((task) => task.lessonOrder)).size).toBe(8);
        const { db, destroy } = await createSqliteDatabase(session.dataset, initSqlJs, () => wasm);
        try {
          for (const task of session.tasks) {
            const allowed = new Set(LESSON_TOPIC_PLAN.slice(0, task.lessonOrder).flatMap((lesson) => lesson.introduces));
            expect([...getSqlTopics(task.solution)].filter((topic) => !allowed.has(topic)), task.solution).toEqual([]);
            const result = runTrainingQuery(db, task.solution);
            expect(result.ok, result.message).toBe(true);
            expect(result.rows.length).toBeGreaterThan(0);
            expect(validateTrainingResult(result, task).passed, task.prompt).toBe(true);
          }
        } finally { destroy(); }
      }
    }
  });

  it('pierwsza lekcja ćwiczy proste SELECT i LIMIT na różnych tabelach', async () => {
    const session = await generate({ ...base, start: 1, end: 1, count: 5 });
    expect(new Set(session.tasks.map((task) => task.table)).size).toBe(2);
    for (const task of session.tasks) expect([...getSqlTopics(task.solution)]).toEqual(expect.arrayContaining(['select', 'from']));
  });

  it('LIMIT bez sortowania akceptuje dowolny poprawny podzbiór, ale nie zmyślone dane ani duplikaty', () => {
    const task = { expected: { columns: ['id'], rows: [[1], [2]] }, subsetRows: [[1], [2], [3]] };
    expect(validateTrainingResult({ ok: true, columns: ['id'], rows: [[3], [1]] }, task).passed).toBe(true);
    expect(validateTrainingResult({ ok: true, columns: ['id'], rows: [[1], [1]] }, task).passed).toBe(false);
    expect(validateTrainingResult({ ok: true, columns: ['id'], rows: [[1], [99]] }, task).passed).toBe(false);
  });

  it('nie pozwala uczniowi zmieniać danych ani dopisywać drugiego polecenia', async () => {
    const session = await generate(base);
    const { db, destroy } = await createSqliteDatabase(session.dataset, initSqlJs, () => wasm);
    try {
      const table = session.tasks[0].table;
      expect(runTrainingQuery(db, `DELETE FROM ${table}`).ok).toBe(false);
      expect(runTrainingQuery(db, `SELECT * FROM ${table}; DELETE FROM ${table}`).ok).toBe(false);
      expect(runTrainingQuery(db, `SELECT ';' FROM ${table} LIMIT 1;`).ok).toBe(true);
      expect(runTrainingQuery(db, `SELECT * FROM ${table}`).rows.length).toBe(24);
    } finally { destroy(); }
  });

  it('odrzuca zakres spoza generatora i liczbę zadań za małą na wybrany zakres', async () => {
    await expect(generate({ ...base, end: 9 })).rejects.toThrow();
    await expect(generate({ ...base, count: 5 })).rejects.toThrow();
  });

  it('zadania HAVING naprawdę wymagają odfiltrowania grup', async () => {
    const session = await generate({ ...base, start: 7, end: 7, count: 5 });
    const { db, destroy } = await createSqliteDatabase(session.dataset, initSqlJs, () => wasm);
    try {
      for (const task of session.tasks) {
        const withoutHaving = runTrainingQuery(db, task.solution.replace(/ HAVING[\s\S]*;/, ';'));
        expect(validateTrainingResult(withoutHaving, task).passed).toBe(false);
      }
    } finally { destroy(); }
  });

  it('pojedyncza lekcja daje dziesięć różnych zadań, a nie powtórzenia tego samego polecenia', async () => {
    for (const rows of [12, 24, 48]) {
      for (const difficulty of ['easy', 'standard', 'challenge']) {
        for (let lesson = 1; lesson <= 8; lesson += 1) {
          const session = await generate({ ...base, start: lesson, end: lesson, count: 10, difficulty, rows });
          expect(new Set(session.tasks.map((task) => task.solution)).size, `Lekcja ${lesson}, ${difficulty}, ${rows}`).toBe(10);
        }
      }
    }
  });
});
