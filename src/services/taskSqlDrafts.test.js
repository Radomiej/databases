import { describe, expect, it } from 'vitest';
import { getTaskSqlDraft, getTaskSqlDraftKey } from './taskSqlDrafts.js';

describe('task SQL drafts', () => {
  it('uses a separate stable storage key for each lesson and task', () => {
    expect(getTaskSqlDraftKey('where', 'price-filter')).toBe('where:price-filter');
  });

  it('restores a saved draft for the selected task', () => {
    const tasks = [{ id: 'showcase', solution: 'SELECT title FROM books;' }, { id: 'independent', solution: 'SELECT id FROM books;' }];
    const drafts = { 'where:independent': 'SELECT id FROM books WHERE price > 20;' };

    expect(getTaskSqlDraft(drafts, 'where', tasks[1], tasks[0])).toBe('SELECT id FROM books WHERE price > 20;');
  });

  it('keeps an intentionally empty draft and only prefills the showcase task', () => {
    const tasks = [{ id: 'showcase', solution: 'SELECT title FROM books;' }, { id: 'independent', solution: 'SELECT id FROM books;' }];

    expect(getTaskSqlDraft({ 'where:independent': '' }, 'where', tasks[1], tasks[0])).toBe('');
    expect(getTaskSqlDraft({}, 'where', tasks[0], tasks[0])).toBe('SELECT title FROM books;');
    expect(getTaskSqlDraft({}, 'where', tasks[1], tasks[0])).toBe('');
  });
});
