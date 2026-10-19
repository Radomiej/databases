import {CLIENT_VERSION} from './clientVersion.js';
// Production only. Do not pass editor content, SQL, prompts, credentials or raw errors.
const config = {domain: 'databases-mauve.vercel.app', aliases:['databaselab2.nekko.software'], websiteId: '7bc5731c-db35-4f0b-a163-2caa4a43cb39'};
const allowed = new Set(['client_version','execution_ok','task_mode','track_id','lesson_id','lesson_number','task_id','mode','action','passed','total','error_count','failure_stage','duration_seconds','duration_bucket','resource','kind','length_bucket']);
let enabled = true;
let started = false;
let context = {};
const recentEvents = new Map();
const queue = [];
const production = () => typeof location !== 'undefined' && (location.hostname === config.domain || config.aliases.includes(location.hostname)) && navigator.doNotTrack !== '1' && import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';
function deliver(name,data) { try { Promise.resolve(window.umami.track(name,data)).catch(() => {}); } catch {} }
export function trackLabEvent(name,data={}) {
 if (!enabled || !production() || typeof name!=='string' || !name || name.length>50) return;
 const safe=Object.fromEntries(Object.entries({...context,...data,client_version:CLIENT_VERSION}).filter(([key,value])=>allowed.has(key)&&['string','number','boolean'].includes(typeof value)&&(typeof value!=='number'||Number.isFinite(value))).map(([key,value])=>[key,typeof value==='string'?value.slice(0,80):value]));
 const key=JSON.stringify([name,safe]);
 if(Date.now()-(recentEvents.get(key)||0)<500)return;
 recentEvents.set(key,Date.now());
 if(recentEvents.size>50)recentEvents.delete(recentEvents.keys().next().value);
 if(typeof window.umami?.track==='function') deliver(name,safe);
 else {queue.push([name,safe]);if(queue.length>50)queue.shift();}
}
export function setLabContext(value) {context=value;}
export function setLabAnalyticsEnabled(value) {enabled=Boolean(value);if(!enabled)queue.length=0;else startLabAnalytics();}
export function startLabAnalytics() {
 if(started||!enabled||!production())return;
 started=true;
 const script=document.createElement('script');script.defer=true;
 script.src='https://mws03-52051.wykr.es/script.js';
 script.dataset.websiteId=config.websiteId;script.dataset.domains=[config.domain,...config.aliases].join(',');
 script.dataset.excludeSearch='true';script.dataset.excludeHash='true';script.dataset.doNotTrack='true';
 script.addEventListener('load',()=>{if(enabled && typeof window.umami?.track==='function')queue.splice(0).forEach(([name,data])=>deliver(name,data));},{once:true});
 script.addEventListener('error',()=>{queue.length=0;},{once:true});document.head.append(script);
 trackLabEvent('client_loaded');
 let errors=0;
 const error=kind=>{if(++errors<=10)trackLabEvent('technical_error',{kind});};
 window.addEventListener('error',()=>error('uncaught_error'));
 window.addEventListener('unhandledrejection',()=>error('unhandled_rejection'));
 document.addEventListener('click',event=>{
  const link=event.target instanceof Element?event.target.closest('a[href]'):null;if(!link)return;
  const url=new URL(link.href,location.href);
  if(link.hasAttribute('download')||/\.(pdf|zip|json|7z)$/.test(url.pathname))trackLabEvent('resource_download',{resource:url.protocol==='blob:'?'project_export':url.pathname.endsWith('.pdf')?'pdf':'archive'});
 });
 let timer;
 document.addEventListener('input',event=>{
  const input=event.target;if(!(input instanceof HTMLInputElement)||input.type!=='search')return;
  clearTimeout(timer);timer=setTimeout(()=>{if(input.value.trim())trackLabEvent('lesson_search',{length_bucket:input.value.length<10?'1_9':'10_plus'});},1000);
 });
}
