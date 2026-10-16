export function sqlOutcome(result){
 if(!result)return '';
 return JSON.stringify({ok:result.ok===true,columns:result.columns||[],rowCount:result.rowCount??result.changedRows??0,message:result.message||'',hint:result.hint||''}).slice(-20000);
}
export function sqlSnapshot({lesson,task,sql,result,passed=null,status,progress=null}){
 return {lessonNumber:lesson?.order??null,taskTitle:task?.title||'',progress,lessonId:lesson?.id||'sql',lessonTitle:lesson?.title||'SQL',taskId:task?.id||'',activeFile:'query.sql',files:{'query.sql':sql||''},runnerStatus:status||(result?.ok===false?'error':result?'ready':'idle'),output:sqlOutcome(result),passed,visibility:'visible'};
}
