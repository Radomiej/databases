export function runAssignment(assignment,files,{signal}={}){
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./assignmentSql.worker.js',import.meta.url),{type:'module'});
    let timer;const finish=(error,value)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();error?reject(error):resolve(value);};
    const abort=()=>finish(Error('Uruchomienie zatrzymane.'));
    worker.onmessage=event=>event.data.error?finish(Error(event.data.error)):finish(null,{output:event.data.output});
    worker.onerror=()=>finish(Error('Nie udało się uruchomić SQLite. Sprawdź dostępność pliku sql-wasm.wasm.'));
    timer=setTimeout(()=>finish(Error('Zapytanie przekroczyło limit 8 sekund.')),8000);
    signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted)return abort();
    worker.postMessage({seedSql:assignment.params.seedSql,sql:files['answer.sql']});
  });
}
