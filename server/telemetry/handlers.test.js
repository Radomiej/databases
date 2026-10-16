// @vitest-environment node
import {test,expect} from 'vitest';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {createTelemetryHandlers} from './handlers.js';
const env={TELEMETRY_TOKEN_SECRET:'x'.repeat(40),TELEMETRY_ALLOWED_ORIGINS:'https://lab.test'};
const ids={machineId:randomUUID(),sessionId:randomUUID()};
const event={...ids,version:1,eventId:randomUUID(),sequence:1,type:'snapshot',sentAt:1,snapshot:{lessonId:'a',lessonTitle:'A',taskId:'1',files:{'Main.java':'hi'},activeFile:'Main.java',output:'',runnerStatus:'idle',passed:null,visibility:'visible'}};
async function call(handler,body,headers={}){const req=Readable.from([typeof body==='string'?body:JSON.stringify(body)]);req.method='POST';req.headers={origin:'https://lab.test','content-type':'application/json',...headers};let result;const res={writeHead(status){this.status=status;},end(raw){result={status:this.status,body:JSON.parse(raw)};}};await handler(req,res);return result;}
test('guards origins, JSON, byte limits and token identities',async()=>{const h=createTelemetryHandlers({env,publish:async()=>{}});expect((await call(h.session,ids,{origin:'https://bad.test'})).status).toBe(403);expect((await call(h.session,ids,{'content-type':'text/plain'})).status).toBe(415);expect((await call(h.session,'{')).status).toBe(400);expect((await call(h.session,' '.repeat(262145))).status).toBe(413);expect((await call(h.events,event)).status).toBe(401);const {body}=await call(h.session,ids);expect((await call(h.events,event,{authorization:`Bearer ${body.token}`})).status).toBe(202);expect((await call(h.events,{...event,sessionId:randomUUID()},{authorization:`Bearer ${body.token}`})).status).toBe(401);});
test('broker failure is retryable and does not disclose credentials',async()=>{const h=createTelemetryHandlers({env,publish:async()=>{throw new Error('password=SECRET');}});const {body}=await call(h.session,ids);const result=await call(h.events,event,{authorization:`Bearer ${body.token}`});expect(result.status).toBe(502);expect(JSON.stringify(result)).not.toContain('SECRET');});
