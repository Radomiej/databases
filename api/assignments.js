import {createAssignmentHandlers} from '../server/assignments/handlers.js';
export const config={api:{bodyParser:false}};
export default (req,res)=>createAssignmentHandlers({appId:'databases'}).generate(req,res);
