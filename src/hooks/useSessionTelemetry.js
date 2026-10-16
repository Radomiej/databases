import {useEffect,useRef,useState,useCallback} from 'react';
import {getInstallationId} from '../services/installationId.js';
import {createSessionTelemetry} from '../services/sessionTelemetry.js';
export function useSessionTelemetry(snapshot,active=true){
  const latest=useRef(snapshot);latest.current=snapshot;
  const client=useRef(null);
  const previous=useRef(null);
  const [machineId]=useState(()=>getInstallationId());
  const [status,setStatus]=useState('disabled');
  const [studentName,setName]=useState(()=>{try{return (localStorage.getItem('lab-student-name-v1')||'').slice(0,80);}catch{return '';}});
  const nameRef=useRef(studentName);nameRef.current=studentName;
  const setStudentName=value=>{const name=value.slice(0,80);setName(name);try{localStorage.setItem('lab-student-name-v1',name);}catch{}};
  useEffect(()=>{
    if(active){try{const name=(localStorage.getItem('lab-student-name-v1')||'').slice(0,80);setName(name);nameRef.current=name;}catch{}}
    const sender=createSessionTelemetry({machineId,appId:'databases',enabled:active&&import.meta.env.VITE_TELEMETRY_ENABLED==='true',getStudentName:()=>nameRef.current,getSnapshot:()=>latest.current,onStatus:setStatus});
    client.current=sender;sender.start();
    return ()=>{client.current=null;sender.stop();};
  },[machineId,active]);
  useEffect(()=>{const old=previous.current;if(old&&(old.lessonId!==snapshot.lessonId||old.taskId!==snapshot.taskId)){client.current?.changed('task_left',old);client.current?.changed('snapshot',snapshot);}previous.current=snapshot;});
  const capture=useCallback((type,value)=>client.current?.changed(type,value),[]);
  return {machineId,status,capture,studentName,setStudentName};
}
