import { expect, it } from 'vitest';
import { formatRelativeHistoryTime } from './historyTime.js';

it('shows recently executed queries in minutes and keeps exact timestamp details separate', () => {
  expect(formatRelativeHistoryTime('2026-09-23T10:00:00.000Z', new Date('2026-09-23T10:03:00.000Z'))).toBe('3 minuty temu');
  expect(formatRelativeHistoryTime('2026-09-23T10:02:45.000Z', new Date('2026-09-23T10:03:00.000Z'))).toBe('przed chwilą');
});
