import {createHmac,timingSafeEqual} from 'node:crypto';
const sign=(payload,secret)=>createHmac('sha256',secret).update(payload).digest('base64url');
export function issueToken({machineId,sessionId},secret,now=Date.now()) {
  if(!secret || secret.length<32)throw new Error('Brak konfiguracji tokenów.');
  const payload=Buffer.from(JSON.stringify({machineId,sessionId,expiresAt:now+3600000})).toString('base64url');
  return `${payload}.${sign(payload,secret)}`;
}
export function verifyToken(token,secret,now=Date.now()) {
  if(!secret || secret.length<32 || typeof token!=='string' || token.length>2048)throw new Error('Nieprawidłowy token.');
  const [payload,signature,...rest]=token.split('.');
  const expected=Buffer.from(sign(payload||'',secret)),actual=Buffer.from(signature||'');
  if(rest.length||expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new Error('Nieprawidłowy token.');
  const data=JSON.parse(Buffer.from(payload,'base64url').toString());
  if(!Number.isFinite(data.expiresAt)||data.expiresAt<=now)throw new Error('Token wygasł.');
  return data;
}
