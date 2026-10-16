import {createTelemetryHandlers} from '../../server/telemetry/handlers.js';
export const config={api:{bodyParser:false}};
export default (req,res)=>createTelemetryHandlers().events(req,res);
