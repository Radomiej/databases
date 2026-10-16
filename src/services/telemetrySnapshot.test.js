import {describe,it,expect} from 'vitest';
import {sqlSnapshot,sqlOutcome} from './telemetrySnapshot.js';
describe('SQL telemetry',()=>{
  it('keeps only editor code and task context, excluding connection credentials and database rows',()=>{
    const snapshot=sqlSnapshot({lesson:{id:'select',title:'SELECT'},task:{id:'one'},sql:'SELECT 1',connection:{password:'secret'}});
    expect(snapshot.files).toEqual({'query.sql':'SELECT 1'});
    expect(snapshot.taskId).toBe('one');
    expect(JSON.stringify(snapshot)).not.toContain('secret');
    expect(sqlOutcome({ok:true,columns:['id'],rows:[['private']],rowCount:1})).toContain('1');
    expect(sqlOutcome({ok:true,columns:['id'],rows:[['private']],rowCount:1})).not.toContain('private');
  });
});
