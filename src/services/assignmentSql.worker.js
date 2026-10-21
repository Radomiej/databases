import {createSqliteDatabase} from './sqliteEngine.js';
import {runTrainingQuery} from './trainingGenerator.js';
self.onmessage=async({data})=>{
  let destroy;
  try{
    const database=await createSqliteDatabase({seedSql:data.seedSql});destroy=database.destroy;
    database.db.run('PRAGMA query_only = ON;');
    const result=runTrainingQuery(database.db,data.sql);
    if(!result.ok)throw Error(result.message);
    self.postMessage({output:JSON.stringify({columns:result.columns,rows:result.rows},null,2)});
  }catch(error){self.postMessage({error:error.message});}finally{destroy?.();}
};
