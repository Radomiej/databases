import {validateEvent,MAX_EVENT_BYTES,uuidPattern} from '../../shared/telemetry/schema.js';
import {issueToken,verifyToken} from './token.js';
import {createRabbitPublisher} from './rabbitPublisher.js';
const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
async function read(req) {
  // Vercel may provide an already parsed body; local Node streams remain raw.
  if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>MAX_EVENT_BYTES){const error=new Error();error.status=413;throw error;}return JSON.parse(raw);}
  let size=0;const chunks=[];
  for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>MAX_EVENT_BYTES){const error=new Error();error.status=413;throw error;}chunks.push(bytes);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createTelemetryHandlers({env=process.env,publish=createRabbitPublisher({env}),now=Date.now}={}){
  const guard=(req,res)=>{
    if(req.method!=='POST'){send(res,405,{message:'Wymagany POST.'});return false;}
    const origins=(env.TELEMETRY_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
    let sameOrigin=false;try{sameOrigin=!!req.headers.origin&&new URL(req.headers.origin).host===req.headers.host;}catch{}
    if(!sameOrigin&&!origins.includes(req.headers.origin)){send(res,403,{message:'Niedozwolone źródło.'});return false;}
    if(!req.headers['content-type']?.startsWith('application/json')){send(res,415,{message:'Wymagany JSON.'});return false;}
    if(!env.TELEMETRY_TOKEN_SECRET || env.TELEMETRY_TOKEN_SECRET.length<32){send(res,503,{message:'Synchronizacja niedostępna.'});return false;}
    return true;
  };
  return {
    async session(req,res){
      if(!guard(req,res))return;
      try{const ids=await read(req);if(![ids.machineId,ids.sessionId].every(id=>typeof id==='string'&&uuidPattern.test(id)))throw new Error();
        send(res,200,{token:issueToken(ids,env.TELEMETRY_TOKEN_SECRET,now()),expiresAt:now()+3600000});
      }catch(error){send(res,error.status||400,{message:'Nieprawidłowa sesja.'});}
    },
    async events(req,res){
      if(!guard(req,res))return;
      let auth;try{auth=verifyToken(req.headers.authorization?.replace(/^Bearer /,''),env.TELEMETRY_TOKEN_SECRET,now());}catch{return send(res,401,{message:'Odnów sesję.'});}
      let event;try{event=validateEvent(await read(req));}catch(error){return send(res,error.status||400,{message:'Nieprawidłowe zdarzenie.'});}
      if(auth.machineId!==event.machineId||auth.sessionId!==event.sessionId)return send(res,401,{message:'Inna sesja.'});
      try{await publish(event);send(res,202,{accepted:true});}catch{send(res,502,{message:'Synchronizacja chwilowo niedostępna.'});}
    },
  };
}
