import {getInstallationId,newId} from './installationId.js';
import {createIndexedOutbox} from './assignmentOutbox.js';
import {MAX_SUBMISSION_BYTES} from '../../shared/assignments/contract.js';

export function createSubmissionClient({store=createIndexedOutbox(),fetchImpl=(...args)=>fetch(...args),machineId=getInstallationId(),sessionId=newId(),appId,onChange=()=>{}}={}){
  let flight=null,timer=null,stopped=false;const tokens=new Map();
  const notify=async()=>{try{onChange((await store.list()).sort((a,b)=>b.message.sentAt-a.message.sentAt));}catch(error){onChange([],error.message);}};
  const post=async(path,body,token)=>fetchImpl(path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  async function send(row){
    const message=row.message,key=message.sessionId;let token=tokens.get(key);
    if(!token||token.expiresAt<Date.now()+60000){const response=await post('/api/telemetry/session',{machineId:message.machineId,sessionId:key});if(!response.ok)throw Error('Nie można otworzyć sesji wysyłki.');token=await response.json();tokens.set(key,token);}
    const response=await post('/api/submissions',message,token.token);
    const data=await response.json().catch(()=>({}));
    if(response.status===401)tokens.delete(key);
    if(response.status===202&&data.accepted===true&&data.submissionId===message.submissionId){await store.put({...row,status:'broker_accepted',error:''});return;}
    if([400,403,413,415].includes(response.status)){await store.put({...row,status:'rejected',error:data.message||'Serwer odrzucił oddanie. Pobierz kopię pracy i skontaktuj się z nauczycielem.'});return;}
    throw Error(data.message||'Brak połączenia. Praca czeka w kolejce wysyłki.');
  }
  const flush=()=>{
    if(flight)return flight;
    flight=(async()=>{try{for(const row of await store.list()){
      if(row.status!=='queued')continue;
      try{await send(row);}catch(error){await store.put({...row,error:error.message});break;}
    }}finally{await notify();}})().finally(()=>{flight=null;});
    return flight;
  };
  return {
    async submit({assignment,studentId,studentName='',files}){
      if(typeof studentId!=='string'||!studentId.trim()||studentId.trim().length>80)throw Error('Podaj swoje ID ucznia (do 80 znaków).');
      const submissionId=newId();
      const {generatorVersion,templateId,seed,difficulty,index}=assignment;
      const message=JSON.parse(JSON.stringify({submissionId,eventId:submissionId,appId,machineId,sessionId,studentId:studentId.trim(),studentName:studentName.trim(),sentAt:Date.now(),assignment:{generatorVersion,templateId,seed,difficulty,index},files}));
      if(new TextEncoder().encode(JSON.stringify(message)).length>MAX_SUBMISSION_BYTES)throw Error('Praca przekracza limit 256 KiB. Pobierz kopię i przekaż ją nauczycielowi.');
      const rows=await store.list();if(rows.filter(r=>r.status==='queued').length>=20)throw Error('Kolejka ma 20 niewysłanych prac. Najpierw ponów wysyłkę.');
      await store.put({id:submissionId,status:'queued',error:'',message});
      const accepted=rows.filter(r=>r.status==='broker_accepted').sort((a,b)=>b.message.sentAt-a.message.sentAt);
      if(store.remove)for(const row of accepted.slice(49))await store.remove(row.id);
      await notify();return submissionId;
    },
    flush,
    start(){stopped=false;void flush().catch(error=>onChange([],error.message));timer=setInterval(()=>{if(!stopped)void flush().catch(error=>onChange([],error.message));},15000);globalThis.addEventListener?.('online',flush);},
    stop(){stopped=true;clearInterval(timer);globalThis.removeEventListener?.('online',flush);},
  };
}
