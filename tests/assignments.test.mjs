import test from 'node:test';
import assert from 'node:assert/strict';
import {generateAssignment,publicAssignment} from '../shared/assignments/generator.js';
import {templates} from '../shared/assignments/catalog.js';
import {validateSubmission} from '../shared/assignments/contract.js';
import {createAssignmentHandlers} from '../server/assignments/handlers.js';
import {issueToken} from '../server/telemetry/token.js';

const request={generatorVersion:'1',templateId:'java-array',seed:'KLASA-A',difficulty:'standard',index:0};
const uuid='11111111-1111-4111-8111-111111111111';
const env={TELEMETRY_TOKEN_SECRET:'x'.repeat(40),TELEMETRY_ALLOWED_ORIGINS:'https://lab.test'};
const ids={machineId:uuid,sessionId:uuid};
const headers={origin:'https://lab.test','content-type':'application/json',authorization:`Bearer ${issueToken(ids,env.TELEMETRY_TOKEN_SECRET,Date.now())}`};
const call=async(handler,body,customHeaders=headers)=>{let status,data;await handler({method:'POST',headers:customHeaders,body},{writeHead(code){status=code;},end(value){data=JSON.parse(value);}});return {status,data};};

test('same full descriptor recreates the complete assignment; other seeds change data',()=>{
  assert.deepEqual(generateAssignment(request),generateAssignment(request));
  assert.notDeepEqual(generateAssignment(request).params,generateAssignment({...request,seed:'KLASA-B'}).params);
  assert.notEqual(generateAssignment(request).id,generateAssignment({...request,difficulty:'easy'}).id);
  assert.throws(()=>generateAssignment({...request,generatorVersion:'2'}));
});
test('all families and levels have starters, references, unambiguous criteria and public payload without references',()=>{
  for(const template of templates)for(const difficulty of ['easy','standard','challenge'])for(let index=0;index<10;index++){
    const full=generateAssignment({...request,templateId:template.id,difficulty,index});
    assert.ok(full.prompt.length>30);assert.ok(full.criteria.length>=2);
    assert.ok(Object.keys(full.starterFiles).length);assert.ok(Object.keys(full.referenceFiles).length);
    const publicTask=publicAssignment(full);assert.equal('referenceFiles' in publicTask,false);
    assert.equal(JSON.stringify(publicTask).includes('referenceFiles'),false);
  }
});
test('submission validation rejects unsafe files, empty student IDs and mismatched app',()=>{
  const assignment=generateAssignment(request);
  const value={kind:'submission',version:1,eventId:uuid,submissionId:uuid,appId:'java-lab',...ids,studentId:' 3A-12 ',studentName:'Ola',sentAt:Date.now(),assignment,files:assignment.starterFiles};
  assert.equal(validateSubmission(value).studentId,'3A-12');
  for(const patch of [{studentId:''},{files:{'../secret':'x'}},{files:{'Main.java':123}},{appId:'www-lab'}])assert.throws(()=>validateSubmission({...value,...patch}));
});
test('API keeps references private and reconstructs references instead of trusting client input',async()=>{
  const published=[];const handlers=createAssignmentHandlers({env,appId:'java-lab',publish:async message=>published.push(message)});
  const generated=await call(handlers.generate,request);
  assert.equal(generated.status,200);assert.equal('referenceFiles' in generated.data.assignment,false);
  const response=await call(handlers.submit,{...ids,submissionId:uuid,eventId:uuid,studentId:'3A-12',studentName:'Ola',sentAt:123,assignment:{...request,referenceFiles:{'Main.java':'FAKE'}},files:{'Main.java':'student code'}});
  assert.equal(response.status,202);assert.equal(published.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(published[0].assignment)),generateAssignment(request));
  assert.equal(published[0].files['Main.java'],'student code');
  assert.equal((await call(handlers.submit,{...ids,assignment:request}, {...headers,authorization:''})).status,401);
  assert.equal((await call(handlers.generate,{...request,templateId:'sql-select'})).status,400);
  assert.equal((await call(handlers.generate,request,{...headers,origin:'https://evil.test'})).status,403);
});
test('broker failure is retryable and is not reported as accepted',async()=>{
  const handlers=createAssignmentHandlers({env,appId:'java-lab',publish:async()=>{throw Error('broker');}});
  const response=await call(handlers.submit,{...ids,submissionId:uuid,eventId:uuid,studentId:'A',studentName:'',sentAt:123,assignment:request,files:{'Main.java':'code'}});
  assert.equal(response.status,502);
});
