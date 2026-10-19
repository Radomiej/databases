import {useEffect,useId,useRef,useState} from 'react';
import './StudentIdentity.css';
const statuses={online:'Połączono',connecting:'Łączenie…',offline:'Brak połączenia — możesz pracować dalej',too_large:'Projekt za duży do synchronizacji'};
export default function StudentIdentity({telemetry}){
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState('');
 const inputId=useId(),inputRef=useRef(null),editRef=useRef(null),wasEditing=useRef(false);
 useEffect(()=>{
  if(editing){inputRef.current?.focus();inputRef.current?.select();}
  else if(wasEditing.current)editRef.current?.focus();
  wasEditing.current=editing;
 },[editing]);
 if(!telemetry)return null;
 const begin=()=>{setDraft(telemetry.studentName||'');setEditing(true);};
 const save=event=>{event.preventDefault();telemetry.setStudentName(draft.trim());setEditing(false);};
 return <section className="student-identity" aria-label="Tożsamość ucznia">
  <div className="student-identity-heading">
   <div className="student-identity-copy">
    <span className="student-identity-id" title={telemetry.machineId}>ID: {telemetry.machineId?.slice(-6)||'—'}</span>
    <strong className="student-identity-name">{telemetry.studentName||'Bez nazwy'}</strong>
   </div>
   <button ref={editRef} type="button" className="student-identity-edit" aria-label="Edytuj nazwę ucznia" title="Edytuj nazwę ucznia" aria-expanded={editing} onClick={begin}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"/></svg>
   </button>
  </div>
  {editing&&<form className="student-identity-form" onSubmit={save} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setEditing(false);}}}>
   <label htmlFor={inputId}>Nick lub nazwa</label>
   <input ref={inputRef} id={inputId} type="text" maxLength={80} placeholder="Np. Ola · 3A" autoComplete="off" value={draft} onChange={event=>setDraft(event.target.value)}/>
   <span className="student-identity-hint">Opcjonalnie — nauczyciel zobaczy tę nazwę obok ID.</span>
   <div className="student-identity-actions"><button type="submit">Zapisz</button><button type="button" onClick={()=>setEditing(false)}>Anuluj</button></div>
  </form>}
  {telemetry.status!=='disabled'&&<p className="student-identity-status" role="status"><span className="student-identity-dot" data-online={telemetry.status==='online'} aria-hidden="true"/>{statuses[telemetry.status]||'Łączenie…'}<small>Kod, nazwa i statystyki edycji są udostępniane nauczycielowi.</small></p>}
 </section>;
}
