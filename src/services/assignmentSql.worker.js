import {createSqliteDatabase} from './sqliteEngine.js';
import {runTrainingQuery} from './trainingGenerator.js';
self.onmessage=async({data})=>{
  let destroy;
  try{
    const database=await createSqliteDatabase({seedSql:data.seedSql});destroy=database.destroy;
    database.db.run('PRAGMA query_only = ON;');
    const started=performance.now();
    const result=runTrainingQuery(database.db,data.sql);
    self.postMessage({result:{...result,rowCount:result.rows?.length??0,durationMs:performance.now()-started}});
  }catch(error){self.postMessage({error:error.message});}finally{destroy?.();}
};
