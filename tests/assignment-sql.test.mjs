import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import initSqlJs from 'sql.js';
import {generateAssignment} from '../shared/assignments/generator.js';
const wasm=createRequire(import.meta.url).resolve('sql.js/dist/sql-wasm.wasm');
test('SQL references execute on every level; challenge HAVING removes a real group',async()=>{
  const SQL=await initSqlJs({locateFile:()=>wasm});
  for(const templateId of ['sql-select','sql-group'])for(const difficulty of ['easy','standard','challenge'])for(let index=0;index<10;index++){
    const task=generateAssignment({templateId,difficulty,index,seed:'SQL-REFERENCE',generatorVersion:'1'}),db=new SQL.Database();
    try{db.run(task.params.seedSql);const result=db.exec(task.referenceFiles['answer.sql'])[0];assert.ok(result?.values.length);
      if(templateId==='sql-group'&&difficulty==='challenge')assert.ok(db.exec(task.referenceFiles['answer.sql'].replace(' HAVING COUNT(*) >= 2',''))[0].values.length>result.values.length,'HAVING must actually exclude a group');
    }finally{db.close();}
  }
});
