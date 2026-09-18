import { createRequire } from 'node:module';
import initSqlJsForTest from 'sql.js';
import { describe, expect, it } from 'vitest';
import { DATASET_MAP } from './datasets.js';
import { LESSONS } from './lessons.js';
import {
  LESSON_TOPIC_PLAN,
  getSqlTopics,
  getTopicPlan,
  topicAppearsInText,
} from './lessonCurriculum.js';
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

  it('provides three actionable tasks for every lesson', () => {
    expect(LESSONS).toHaveLength(12);
    LESSONS.forEach((lesson) => {
      expect(lesson.tasks).toHaveLength(3);
      expect(new Set(lesson.tasks.map((task) => task.id)).size).toBe(3);
      lesson.tasks.forEach((task) => {
        expect(task.prompt).toBeTruthy();
        expect(task.solution).toBeTruthy();
        expect(task.expected).toBeTruthy();
      });
    });
  });

  it('keeps every task within the material introduced so far', () => {
    const knownTopics = new Set();

    LESSONS.forEach((lesson) => {
      const plan = getTopicPlan(lesson.id);
      expect(plan, `missing curriculum plan for ${lesson.id}`).toBeTruthy();

      const lessonMaterial = [lesson.theory, lesson.example, ...lesson.syntax].join(' ');
      plan.introduces.forEach((topic) => {
        expect(
          topicAppearsInText(topic, lessonMaterial),
          `${lesson.id} should explain the newly introduced topic: ${topic}`,
        ).toBe(true);
      });

      const allowedTopics = new Set([...knownTopics, ...plan.introduces]);
      lesson.tasks.forEach((task) => {
        const unsupportedTopics = [...getSqlTopics(task.solution)].filter((topic) => !allowedTopics.has(topic));
        expect(unsupportedTopics, `${lesson.id}/${task.id} uses future SQL topics`).toEqual([]);
      });

      plan.introduces.forEach((topic) => knownTopics.add(topic));
    });

    expect(LESSON_TOPIC_PLAN).toHaveLength(LESSONS.length);
  });

  it('keeps the first lesson limited to SELECT and LIMIT on different tables', () => {
    const firstLesson = LESSONS[0];
    const taskTopics = firstLesson.tasks.map((task) => getSqlTopics(task.solution));

    expect(taskTopics.every((topics) => topics.has('select') && topics.has('limit'))).toBe(true);
    expect(taskTopics.every((topics) => !topics.has('order-by'))).toBe(true);
    expect(firstLesson.tasks.map((task) => task.solution)).toEqual([
      'SELECT tytul FROM ksiazki LIMIT 3;',
      'SELECT imie, nazwisko FROM autorzy LIMIT 3;',
      'SELECT czytelnik FROM wypozyczenia LIMIT 2;',
    ]);
  });

  it.each(LESSONS.flatMap((lesson) => lesson.tasks.map((task) => ({ lesson, task }))))('solution for task $task.id executes', async ({ lesson, task }) => {
    const { db, destroy } = await createSqliteDatabase(DATASET_MAP[lesson.datasetId], initSqlJsForTest, () => wasmPath);
    const result = executeSqliteQuery(db, task.solution);
    const validation = validateQueryResult(result, task.expected);
    destroy();

    expect(result.ok).toBe(true);
    expect(validation.passed, validation.message).toBe(true);
  });
});
