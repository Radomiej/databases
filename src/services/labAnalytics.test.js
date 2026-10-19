// @vitest-environment node
import {CLIENT_VERSION} from './clientVersion.js';
import {test,expect,vi,afterEach} from 'vitest';
const scripts=[];
async function setup(host='databases-mauve.vercel.app',dnt='0'){
 vi.resetModules();scripts.length=0;vi.stubGlobal('location',{hostname:host});vi.stubGlobal('navigator',{doNotTrack:dnt});
 vi.stubGlobal('window',{umami:{track:vi.fn()},addEventListener:vi.fn()});
 vi.stubGlobal('document',{head:{append:script=>scripts.push(script)},createElement:()=>({dataset:{},addEventListener:vi.fn()}),addEventListener:vi.fn()});
 return import('./labAnalytics.js');
}
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
test('adds build version, retains controlled context and drops student code, IDs and nonfinite values',async()=>{const api=await setup();api.setLabContext({lesson_id:'102',lesson_number:102,task_id:'2'});api.trackLabEvent('task_open',{code:'private',studentName:'private',machineId:'private',total:Infinity,execution_ok:true,task_mode:'guided'});const [name,data]=window.umami.track.mock.calls[0];expect(name).toBe('task_open');expect(data).toEqual({client_version:CLIENT_VERSION,lesson_id:'102',lesson_number:102,task_id:'2',execution_ok:true,task_mode:'guided'});});
test('one loader and client_loaded; immediate duplicate events suppressed and tracker failure harmless',async()=>{const api=await setup();api.startLabAnalytics();api.startLabAnalytics();expect(scripts).toHaveLength(1);expect(window.umami.track.mock.calls.filter(([name])=>name==='client_loaded')).toHaveLength(1);api.trackLabEvent('task_open');api.trackLabEvent('task_open');expect(window.umami.track.mock.calls.filter(([name])=>name==='task_open')).toHaveLength(1);window.umami.track.mockImplementation(()=>{throw Error('blocked')});expect(()=>api.trackLabEvent('technical_error')).not.toThrow();});
test('localhost, preview and Do Not Track do not collect',async()=>{for(const [host,dnt] of [['localhost','0'],['preview.vercel.app','0'],['databases-mauve.vercel.app','1']]){const api=await setup(host,dnt);api.startLabAnalytics();api.trackLabEvent('task_open');expect(window.umami.track).not.toHaveBeenCalled();expect(scripts).toHaveLength(0);}});
test('disabled analytics does not inject tracker',async()=>{vi.stubEnv('VITE_ANALYTICS_ENABLED','false');const api=await setup();api.startLabAnalytics();api.trackLabEvent('task_open');expect(scripts).toHaveLength(0);expect(window.umami.track).not.toHaveBeenCalled();});

test('verified custom production domain shares the database website tracker',async()=>{const api=await setup('databaselab2.nekko.software');api.startLabAnalytics();api.trackLabEvent('task_open');expect(window.umami.track).toHaveBeenCalledWith('task_open',expect.objectContaining({client_version:CLIENT_VERSION}));expect(scripts[0].dataset.domains).toBe('databases-mauve.vercel.app,databaselab2.nekko.software');});
