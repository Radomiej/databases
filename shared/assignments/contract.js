import {templates} from './catalog.js';
export const MAX_SUBMISSION_BYTES=256*1024;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=()=>{throw Error('Nieprawidłowe oddanie zadania.');};
function string(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail();return value;}
export function validateFiles(value){
  if(!value||typeof value!=='object'||Array.isArray(value))fail();
  const entries=Object.entries(value);if(!entries.length||entries.length>100)fail();
  const result=Object.create(null);
  for(const [path,source] of entries){if(path.length>200||!path||path.startsWith('/')||path.includes('..')||path.includes('\\')||path.includes(':')||path.split('/').some(p=>['__proto__','constructor','prototype'].includes(p)))fail();result[path]=string(source,MAX_SUBMISSION_BYTES);}
  return result;
}
export function validateSubmission(value){
  if(!value||new TextEncoder().encode(JSON.stringify(value)).length>MAX_SUBMISSION_BYTES)fail();
  if(value.kind!=='submission'||value.version!==1||![value.eventId,value.submissionId,value.machineId,value.sessionId].every(v=>typeof v==='string'&&uuid.test(v))||!Number.isSafeInteger(value.sentAt)||value.sentAt<0)fail();
  const a=value.assignment;if(!a||a.generatorVersion!=='1'||!templates.some(t=>t.id===a.templateId&&t.appId===value.appId)||!['easy','standard','challenge'].includes(a.difficulty)||!Number.isInteger(a.index)||a.index<0||a.index>9)fail();
  if(!Array.isArray(a.criteria)||a.criteria.length>30||!a.params||typeof a.params!=='object'||Array.isArray(a.params))fail();
  const assignment={id:string(a.id,200,true),templateId:a.templateId,generatorVersion:'1',seed:string(a.seed,80,true),difficulty:a.difficulty,index:a.index,title:string(a.title,500,true),prompt:string(a.prompt,20000,true),criteria:a.criteria.map(c=>string(c,2000,true)),starterFiles:validateFiles(a.starterFiles),referenceFiles:validateFiles(a.referenceFiles),params:JSON.parse(JSON.stringify(a.params))};
  return {kind:'submission',version:1,eventId:value.eventId,submissionId:value.submissionId,appId:value.appId,machineId:value.machineId,sessionId:value.sessionId,studentId:string(value.studentId,80,true).trim(),studentName:string(value.studentName??'',80).trim(),sentAt:value.sentAt,assignment,files:validateFiles(value.files)};
}
