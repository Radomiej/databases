import {loadEnv} from 'vite';
import {createTelemetryHandlers} from './telemetry/handlers.js';
import {createAssignmentHandlers} from './assignments/handlers.js';
export function telemetryPlugin(){return {name:'lab-telemetry',configureServer(server){
 const env={...loadEnv(server.config.mode,server.config.root,''),...process.env};
 const handlers=createTelemetryHandlers({env});
 const assignments=createAssignmentHandlers({env,appId:'databases'});
 server.middlewares.use((req,res,next)=>{const route={'/api/telemetry/session':handlers.session,'/api/telemetry/events':handlers.events,'/api/assignments':assignments.generate,'/api/submissions':assignments.submit}[req.url];if(route)return route(req,res);next();});
}};}
