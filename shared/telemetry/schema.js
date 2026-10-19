export const MAX_EVENT_BYTES = 256 * 1024;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateEvent(value) {
  const fail = () => { throw new Error('Nieprawidłowe zdarzenie sesji.'); };
  if (!value || new TextEncoder().encode(JSON.stringify(value)).length > MAX_EVENT_BYTES) fail();
  const {version,eventId,machineId,sessionId,sequence,type,sentAt,snapshot:s,appId='java-lab',studentName='',clientVersion='unknown'} = value;
  if (typeof appId!=='string'||! /^[a-z][a-z0-9-]{0,63}$/.test(appId))fail();
  if (version !== 1 || ![eventId,machineId,sessionId].every(id=>typeof id==='string'&&uuidPattern.test(id)) || !Number.isSafeInteger(sequence) || sequence<1 || !Number.isSafeInteger(sentAt) || sentAt<0 || !['session_started','snapshot','heartbeat','run_started','run_result','task_left','history_gap'].includes(type)) fail();
  if(type==='history_gap'&&(!Number.isSafeInteger(value.droppedEvents)||value.droppedEvents<1))fail();
  if (!s || !s.files || typeof s.files !== 'object' || Array.isArray(s.files)) fail();
  const string = (v,max) => {if(typeof v!=='string'||v.length>max)fail(); return v;};
  const count=(v,max=100000)=>{if(!Number.isSafeInteger(v)||v<0||v>max)fail();return v;};
  const progress=s.progress==null?null:{completed:count(s.progress.completed),total:count(s.progress.total)};
  if(progress&&progress.completed>progress.total)fail();
  const lessonNumber=s.lessonNumber==null?null:count(s.lessonNumber);
  const taskTitle=s.taskTitle===undefined?'':string(s.taskTitle,500);
  let editingActivity=null;
  if(s.editingActivity!=null){
    const value=s.editingActivity;
    editingActivity={};
    for(const key of ['typedCharacters','pastedCharacters','pasteCount','largestPaste','deletionActions','recentTypedCharacters','charactersPerMinute'])editingActivity[key]=count(value[key],1000000000);
    for(const key of ['measuredSince','lastEditAt','lastPasteAt'])editingActivity[key]=count(value[key],8640000000000000);
    if(editingActivity.recentTypedCharacters>editingActivity.typedCharacters||editingActivity.largestPaste>editingActivity.pastedCharacters)fail();
  }
  const files=Object.create(null), entries=Object.entries(s.files);
  if(entries.length>100)fail();
  for(const [path,code] of entries){if(!path || path.length>200 || path.startsWith('/') || path.includes('..') || path.includes('\\') || ['__proto__','prototype','constructor'].includes(path))fail();files[path]=string(code,MAX_EVENT_BYTES);}
  if(!['visible','hidden'].includes(s.visibility)||![true,false,null].includes(s.passed))fail();
  return {version,eventId,machineId,sessionId,sequence,type,sentAt,appId,clientVersion:string(clientVersion,120),studentName:string(studentName,80).trim(),...(type==='history_gap'?{droppedEvents:value.droppedEvents}:{}),snapshot:{lessonNumber,taskTitle,progress,editingActivity,lessonId:string(s.lessonId,200),lessonTitle:string(s.lessonTitle,500),taskId:string(s.taskId,200),activeFile:string(s.activeFile,200),files,runnerStatus:string(s.runnerStatus,40),output:string(s.output,20000),passed:s.passed,visibility:s.visibility}};
}
