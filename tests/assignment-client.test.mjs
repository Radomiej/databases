import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubmissionClient} from '../src/services/assignmentSubmissions.js';
const uuid='11111111-1111-4111-8111-111111111111';
const task={generatorVersion:'1',templateId:'java-array',seed:'A',difficulty:'standard',index:0};
function memory(){const rows=new Map();return {list:async()=>structuredClone([...rows.values()]),put:async row=>rows.set(row.id,structuredClone(row))};}
test('offline outbox preserves exact code and IDs across reload and retry; acceptance means RabbitMQ only',async()=>{
  const store=memory(),posted=[];let offline=true;
  const fetchImpl=async(path,options)=>{if(offline)throw Error('offline');const body=JSON.parse(options.body);if(path.endsWith('/session'))return {ok:true,json:async()=>({token:'test',expiresAt:Date.now()+1000000})};posted.push(body);return {ok:true,status:202,json:async()=>({accepted:true,submissionId:body.submissionId,status:'broker_accepted'})};};
  const client=createSubmissionClient({store,fetchImpl,machineId:uuid,sessionId:uuid,appId:'java-lab'});
  const files={'Main.java':'original'};
  const id=await client.submit({assignment:task,studentId:'3A-12',files});files['Main.java']='changed';
  await client.flush();assert.equal((await store.list())[0].status,'queued');
  client.stop();offline=false;
  const reloaded=createSubmissionClient({store,fetchImpl,machineId:uuid,sessionId:'22222222-2222-4222-8222-222222222222',appId:'java-lab'});
  await reloaded.flush();
  assert.equal(posted[0].submissionId,id);assert.equal(posted[0].files['Main.java'],'original');assert.equal(posted[0].sessionId,uuid);
  assert.equal((await store.list())[0].status,'broker_accepted');
  await reloaded.flush();assert.equal(posted.length,1);
});
test('failed persistent storage never pretends work was queued',async()=>{
  const client=createSubmissionClient({store:{list:async()=>[],put:async()=>{throw Error('storage denied');}},machineId:uuid,sessionId:uuid,appId:'java-lab'});
  await assert.rejects(client.submit({assignment:task,studentId:'A',files:{'Main.java':'x'}}),/storage denied/);
});
test('retry keeps submission ID and an API validation failure does not endlessly retry',async()=>{
  const store=memory();let posts=0;
  const client=createSubmissionClient({store,machineId:uuid,sessionId:uuid,appId:'java-lab',fetchImpl:async path=>path.endsWith('/session')?{ok:true,json:async()=>({token:'t',expiresAt:Date.now()+1000000})}:{ok:false,status:400,json:async()=>{posts++;return {message:'old version'};}}});
  await client.submit({assignment:task,studentId:'A',files:{'Main.java':'x'}});await client.flush();await client.flush();
  assert.equal(posts,1);assert.equal((await store.list())[0].status,'rejected');
});
test('history cleanup never deletes rejected work that has not reached RabbitMQ',async()=>{
  const rows=Array.from({length:55},(_,index)=>({id:`rejected-${index}`,status:'rejected',message:{sentAt:index}})),removed=[];
  const store={list:async()=>rows,put:async row=>rows.push(row),remove:async id=>removed.push(id)};
  const client=createSubmissionClient({store,machineId:uuid,sessionId:uuid,appId:'java-lab'});
  await client.submit({assignment:task,studentId:'A',files:{'Main.java':'x'}});
  assert.deepEqual(removed,[]);
});
