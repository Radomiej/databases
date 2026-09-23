import { createRequire } from 'node:module';
import initSqlJsForTest from 'sql.js';
import { describe, expect, it } from 'vitest';
import { DATASET_MAP } from './datasets.js';
import { COURSE_LESSONS, getLesson, LESSONS } from './lessons.js';
import {
  LESSON_TOPIC_PLAN,
  getSqlTopics,
  getTopicPlan,
  topicAppearsInText,
} from './lessonCurriculum.js';
import { createSqliteDatabase, executeSqliteQuery } from '../services/sqliteEngine.js';
import { validateQueryResult } from '../services/queryValidation.js';

const QUERY_LESSONS = LESSONS.filter((lesson) => lesson.datasetId !== 'structure-lab');

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

describe('lesson solutions', () => {
  it.each(QUERY_LESSONS)('solution for lesson $order executes and matches expected result', async (lesson) => {
    const { db, destroy } = await createSqliteDatabase(DATASET_MAP[lesson.datasetId], initSqlJsForTest, () => wasmPath);
    const result = executeSqliteQuery(db, lesson.solution);
    const validation = validateQueryResult(result, lesson.expected);
    destroy();

    expect(result.ok).toBe(true);
    expect(validation.passed, validation.message).toBe(true);
  });

  it('provides three actionable tasks for every lesson', () => {
    expect(LESSONS).toHaveLength(16);
    expect(QUERY_LESSONS).toHaveLength(12);
    LESSONS.forEach((lesson) => {
      expect(lesson.tasks).toHaveLength(3);
      expect(new Set(lesson.tasks.map((task) => task.id)).size).toBe(3);
      lesson.tasks.forEach((task) => {
        expect(task.prompt).toBeTruthy();
        expect(task.solution).toBeTruthy();
        expect(task.expected ?? task.expectedSchema).toBeTruthy();
      });
    });
  });

  it('exposes schema lessons as the continuation of the course', () => {
    expect(COURSE_LESSONS).toHaveLength(16);
    expect(COURSE_LESSONS.slice(-4).map((lesson) => lesson.datasetId)).toEqual([
      'structure-lab',
      'structure-lab',
      'structure-lab',
      'structure-lab',
    ]);
    expect(getLesson('create-table').datasetId).toBe('structure-lab');
    expect(getLesson('schema-relations').tasks).toHaveLength(3);
  });

  it('keeps every task within the material introduced so far', () => {
    const knownTopics = new Set();

    QUERY_LESSONS.forEach((lesson) => {
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

    expect(LESSON_TOPIC_PLAN).toHaveLength(QUERY_LESSONS.length);
  });

  it('keeps the first lesson limited to SELECT and LIMIT on different tables', () => {
    const firstLesson = QUERY_LESSONS[0];
    const taskTopics = firstLesson.tasks.map((task) => getSqlTopics(task.solution));

    expect(taskTopics.every((topics) => topics.has('select') && topics.has('limit'))).toBe(true);
    expect(taskTopics.every((topics) => !topics.has('order-by'))).toBe(true);
    expect(firstLesson.tasks.map((task) => task.solution)).toEqual([
      'SELECT tytul FROM ksiazki LIMIT 3;',
      'SELECT imie, nazwisko FROM autorzy LIMIT 3;',
      'SELECT czytelnik FROM wypozyczenia LIMIT 2;',
    ]);
  });

  it('uses natural Polish wording that matches the task data', () => {
    expect(LESSONS[0].tasks[0].title).toBe('Zadanie pokazowe');
    expect(LESSONS.flatMap((lesson) => lesson.tasks).every((task) => task.title !== 'Zadanie prowadzone')).toBe(true);
    expect(LESSONS.find((lesson) => lesson.id === 'having').tasks.find((task) => task.id === 'popular-products').prompt)
      .toContain('identyfikatory produktów');
    expect(LESSONS.find((lesson) => lesson.id === 'multi-join').task)
      .toContain('przedmiotu „Bazy danych”');
  });

  it('keeps task wording, sort direction, and filter conditions consistent', () => {
    const lessonTasks = Object.fromEntries(QUERY_LESSONS.map((lesson) => [
      lesson.id,
      Object.fromEntries(lesson.tasks.map((task) => [task.id, task])),
    ]));

    expect(lessonTasks['select-limit']['authors-list'].prompt).not.toContain('pierwszych');
    expect(lessonTasks['select-limit']['loans-list'].prompt).not.toContain('pierwszych');
    expect(lessonTasks['order-by']['oldest-books'].solution).toMatch(/ORDER BY rok_wydania ASC, id ASC/i);
    expect(lessonTasks['order-by']['recent-loans'].solution).toMatch(/ORDER BY data_wypozyczenia DESC/i);
    expect(lessonTasks['multi-join']['top-grades'].solution).toContain('WHERE o.ocena = 5');
    expect(lessonTasks.subqueries['subqueries-guided'].solution)
      .toContain('WHERE ocena = 5');
    expect(lessonTasks.subqueries['high-averages'].solution)
      .toContain('ROUND(s.srednia, 2) AS srednia');
    expect(lessonTasks.subqueries['high-averages'].solution)
      .toContain('WHERE s.srednia >= 4.5');
    expect(lessonTasks['left-join']['tickets-by-customer'].expected.rows)
      .toContainEqual(['Paweł', 'Wiśniewski', 0]);
  });

  it.each(QUERY_LESSONS.flatMap((lesson) => lesson.tasks.map((task) => ({ lesson, task }))))('solution for task $task.id executes', async ({ lesson, task }) => {
    const { db, destroy } = await createSqliteDatabase(DATASET_MAP[lesson.datasetId], initSqlJsForTest, () => wasmPath);
    const result = executeSqliteQuery(db, task.solution);
    const validation = validateQueryResult(result, task.expected);
    destroy();

    expect(result.ok).toBe(true);
    expect(validation.passed, validation.message).toBe(true);
  });
});
