import { COURSE_LESSONS } from './lessons.js';
import { STRUCTURE_LESSONS } from './structureLessons.js';
import { getSqlQuickCheck } from './sqlQuickChecks.js';

test('every database lesson has a focused, answerable quick check', () => {
  for (const lesson of [...COURSE_LESSONS, ...STRUCTURE_LESSONS]) {
    const check = getSqlQuickCheck(lesson.id);
    expect(check, lesson.id).toBeTruthy();
    expect(check.question.length).toBeGreaterThan(10);
    expect(check.options).toHaveLength(3);
    expect(check.options[check.correctIndex]).toBeTruthy();
    expect(new Set(check.options).size).toBe(3);
  }
});
