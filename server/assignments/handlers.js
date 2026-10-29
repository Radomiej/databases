import {generateAssignment,publicAssignment} from '../../shared/assignments/generator.js';
import {templates} from '../../shared/assignments/catalog.js';
import {validateSubmission,MAX_SUBMISSION_BYTES} from '../../shared/assignments/contract.js';
import {verifyToken} from '../telemetry/token.js';
import {createRabbitPublisher} from '../telemetry/rabbitPublisher.js';

const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
async function read(req){
  if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>MAX_SUBMISSION_BYTES)throw Error('size');return JSON.parse(raw);}
  let size=0;const chunks=[];for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>MAX_SUBMISSION_BYTES)throw Error('size');chunks.push(bytes);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createAssignmentHandlers({env=process.env,appId='java-lab',publish=createRabbitPublisher({env})}={}){
  const guard=(req,res)=>{
    if(req.method!=='POST'){send(res,405,{message:'Wymagany POST.'});return false;}
    const origins=(env.TELEMETRY_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
    let sameOrigin=false,loopback=false;
    try{const origin=new URL(req.headers.origin);const isLoopback=name=>['127.0.0.1','localhost','[::1]'].includes(name);
      sameOrigin=origin.host===req.headers.host;loopback=isLoopback(origin.hostname)&&isLoopback(new URL(`http://${req.headers.host||'x'}`).hostname);}catch{}
    if(!sameOrigin&&!loopback&&!origins.includes(req.headers.origin)){send(res,403,{message:'Niedozwolone źródło.'});return false;}
    if(!req.headers['content-type']?.startsWith('application/json')){send(res,415,{message:'Wymagany JSON.'});return false;}
    return true;
  };
  const generate=async(req,res)=>{
    if(!guard(req,res))return;
    try{const descriptor=await read(req);if(!templates.some(t=>t.id===descriptor.templateId&&t.appId===appId))throw Error();send(res,200,{assignment:publicAssignment(generateAssignment(descriptor))});}
    catch{send(res,400,{message:'Nie udało się wygenerować zadania. Sprawdź seed i parametry.'});}
  };
  const submit=async(req,res)=>{
    if(!guard(req,res))return;
    if(!env.TELEMETRY_TOKEN_SECRET||env.TELEMETRY_TOKEN_SECRET.length<32)return send(res,503,{message:'Wysyłka nie jest skonfigurowana.'});
    let auth;try{auth=verifyToken(req.headers.authorization?.replace(/^Bearer /,''),env.TELEMETRY_TOKEN_SECRET,Date.now());}catch{return send(res,401,{message:'Odnów sesję wysyłki.'});}
    let message;
    try{
      const body=await read(req);
      if(body.machineId!==auth.machineId||body.sessionId!==auth.sessionId)return send(res,401,{message:'Inna sesja wysyłki.'});
      const assignment=generateAssignment(body.assignment);
      // Reconstruct all teacher materials; never accept a client reference or grade.
      message=validateSubmission({...body,kind:'submission',version:1,appId,assignment});
      const expected=Object.keys(assignment.starterFiles).sort();if(JSON.stringify(Object.keys(message.files).sort())!==JSON.stringify(expected))throw Error();
    }catch{return send(res,400,{message:'Nieprawidłowe oddanie. Sprawdź ID ucznia, pliki i wersję zadania.'});}
    try{await publish(message);send(res,202,{accepted:true,submissionId:message.submissionId,status:'broker_accepted'});}
    catch{send(res,502,{message:'RabbitMQ chwilowo niedostępny. Praca pozostaje w kolejce wysyłki.'});}
  };
  return {generate,submit};
}
