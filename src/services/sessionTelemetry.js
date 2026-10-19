import {CLIENT_VERSION} from './clientVersion.js';
import {createEditingActivity} from './editingActivity.js';
import {getInstallationId,newId} from './installationId.js';
import {validateEvent,MAX_EVENT_BYTES} from '../../shared/telemetry/schema.js';
export function createSessionTelemetry({fetchImpl=(...args)=>fetch(...args),getSnapshot,onStatus=()=>{},documentRef=globalThis.document,enabled=false,machineId=getInstallationId(),appId='databases',getStudentName=()=>''}={}) {
  const editingActivity=createEditingActivity({documentRef});
  const sessionId=newId();let sequence=0,queue=[],running=false,busy=false,token=null,expiresAt=0,retry=null,heartbeat=null,sampling=null,lastSample='',backoff=2000,controller;
  const status=s=>{try{onStatus(s);}catch{}};
  const request=async(url,body,headers={})=>{
    controller=new AbortController();let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller?.abort();reject(new Error('Timeout'));},8000);});
    try{return await Promise.race([Promise.resolve().then(async()=>{const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:controller.signal});if(url.endsWith('/session')&&response.ok)return {ok:true,session:await response.json()};return response;}),timeout]);}finally{clearTimeout(timer);}
  };
  const signature=s=>JSON.stringify([s.lessonId,s.taskId,s.files]);
  const boundQueue=event=>{
    let lost=0;
    const discard=()=>{let index=queue.findIndex((e,i)=>i>0&&e.type==='heartbeat');if(index<0)index=queue.findIndex((e,i)=>i>0&&e.type==='snapshot');if(index<0)index=queue.findIndex((e,i)=>i>0&&e.type!=='history_gap');const removed=queue.splice(index<0?1:index,1)[0];if(removed?.type!=='heartbeat')lost+=removed?.droppedEvents||1;};
    while(queue.length>20)discard();
    if(!lost)return;
    const gap=queue.find((e,i)=>e.type==='history_gap'&&i>0);
    if(gap){gap.droppedEvents+=lost;return;}
    while(queue.length>=20)discard();
    queue.push(validateEvent({...event,eventId:newId(),sequence:++sequence,sentAt:Date.now(),type:'history_gap',droppedEvents:lost,snapshot:{...event.snapshot,files:{},output:'',passed:null}}));
  };
  const enqueue=(type,override)=>{
    if(!running)return;
    try{
      const snapshot={...(override||getSnapshot()),editingActivity:editingActivity.snapshot(),visibility:documentRef?.visibilityState==='hidden'?'hidden':'visible',focused:typeof documentRef?.hasFocus==='function'?documentRef.hasFocus():null};
      const raw={version:1,clientVersion:CLIENT_VERSION,eventId:newId(),machineId,sessionId,appId,studentName:getStudentName(),sequence:++sequence,type,sentAt:Date.now(),snapshot};
      if(new TextEncoder().encode(JSON.stringify(raw)).length>MAX_EVENT_BYTES){status('too_large');return;}
      const event=validateEvent(raw);
      // Keep the in-flight event immutable for idempotent retries; coalesce all unsent snapshots.
      if(type==='heartbeat')queue=queue.filter((e,i)=>i===0&&busy || e.type!=='heartbeat');
      queue.push(event);
      boundQueue(event);
      if(type!=='heartbeat'&&type!=='task_left')lastSample=signature(snapshot);
      void flush();
    }catch{status('offline');}
  };
  async function flush(){
    if(!running||busy||retry||!queue.length)return;
    busy=true;const event=queue[0];
    try{
      if(!token || expiresAt<Date.now()+60000){
        const response=await request('/api/telemetry/session',{machineId,sessionId});
        if(!response.ok)throw new Error('Session');const data=response.session;
        if(typeof data.token!=='string'||!Number.isFinite(data.expiresAt))throw new Error('Session');
        token=data.token;expiresAt=data.expiresAt;
      }
      if(!running)return;
      const response=await request('/api/telemetry/events',event,{Authorization:`Bearer ${token}`});
      if(response.status===401){token=null;throw new Error('Token');}
      if(!response.ok)throw new Error('Publish');
      if(queue[0]===event)queue.shift();backoff=2000;status('online');
    }catch{
      if(running){status('offline');retry=setTimeout(()=>{retry=null;enqueue('heartbeat');void flush();},backoff);backoff=Math.min(30000,backoff*2);}
    }finally{busy=false;if(running&&!retry)void flush();}
  }
  const sample=()=>{try{if(signature(getSnapshot())!==lastSample)enqueue('snapshot');}catch{status('offline');}};
  const online=()=>{if(!running)return;clearTimeout(retry);retry=null;sample();enqueue('heartbeat');};
  const visibility=()=>enqueue('heartbeat');
  return {
    machineId,sessionId,pendingCount:()=>queue.length,
    start(){if(running||!enabled){status(enabled?'offline':'disabled');return;}running=true;editingActivity.start();status('connecting');enqueue('session_started');heartbeat=setInterval(()=>enqueue('heartbeat'),15000);sampling=setInterval(sample,30000);globalThis.addEventListener?.('online',online);globalThis.addEventListener?.('focus',visibility);globalThis.addEventListener?.('blur',visibility);documentRef?.addEventListener('visibilitychange',visibility);},
    changed(type='snapshot',override){if(running&&(type!=='snapshot'||override))enqueue(type,override);},
    stop(){running=false;editingActivity.stop();clearTimeout(retry);clearInterval(heartbeat);clearInterval(sampling);retry=null;controller?.abort();queue=[];globalThis.removeEventListener?.('online',online);globalThis.removeEventListener?.('focus',visibility);globalThis.removeEventListener?.('blur',visibility);documentRef?.removeEventListener('visibilitychange',visibility);},
  };
}
