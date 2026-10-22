import {useEffect,useRef,useState} from 'react';
import {templates,GENERATOR_VERSION} from '../../shared/assignments/catalog.js';
import {createSubmissionClient} from '../services/assignmentSubmissions.js';
import {runAssignment} from '../services/assignmentRunner.js';
import {trackLabEvent} from '../services/labAnalytics.js';
import SqlEditor from './SqlEditor.jsx';
import ResultsPanel from './ResultsPanel.jsx';
import './assignments.css';

function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const levels={easy:'Podstawowy',standard:'Standardowy',challenge:'Wyzwanie'};
export default function AssignmentWorkspace({appId,onBack,clientFactory=createSubmissionClient}){
  const catalog=templates.filter(t=>t.appId===appId),key=`${appId}-generated-work-v1`;
  const requestedParams = new URLSearchParams(location.hash.split('?')[1] || '');
  const requestedLesson = requestedParams.get('lekcja');
  const requestedTask = requestedParams.get('zadanie') || '';
  const requestedLevel = requestedParams.get('poziom');
  const requestedTemplate = catalog.find(template => template.lessonId === requestedLesson);
  const [saved]=useState(()=>load(key,{}));
  const [seed,setSeed]=useState(''),[templateId,setTemplateId]=useState(requestedTemplate?.id||saved.templateId||catalog[0].id),[difficulty,setDifficulty]=useState(Object.hasOwn(levels,requestedLevel)?requestedLevel:saved.difficulty||'standard'),[count,setCount]=useState(3);
  const sameContext=!requestedLesson||(saved.lessonId===requestedLesson&&saved.taskId===requestedTask);
  const [tasks,setTasks]=useState(()=>sameContext&&Array.isArray(saved.tasks)?saved.tasks:[]),[drafts,setDrafts]=useState(saved.drafts||{}),[selected,setSelected]=useState(0);
  const [studentId,setStudentId]=useState(()=>load(`${appId}-assignment-identity`,{}).studentId||''),[studentName,setStudentName]=useState(()=>load(`${appId}-assignment-identity`,{}).studentName||'');
  const [error,setError]=useState(''),[storageError,setStorageError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[running,setRunning]=useState(false),[result,setResult]=useState(null),[outbox,setOutbox]=useState([]);
  const [lastSubmissionId,setLastSubmissionId]=useState('');
  const lastSubmission=outbox.find(row=>row.id===lastSubmissionId);
  const client=useRef(null),alive=useRef(true),generation=useRef(null),execution=useRef(null),epoch=useRef(0);
  const task=tasks[selected]||tasks[0],files=task?(drafts[task.id]||task.starterFiles):{},activeFile=Object.keys(files)[0]||'answer.sql';
  function editCode(value){stop();setDrafts(current=>({...current,[task.id]:{...files,[activeFile]:value}}));}
  useEffect(()=>{alive.current=true;client.current=clientFactory({appId,onChange:(rows,failure)=>{if(alive.current){setOutbox(rows);if(failure)setError(failure);}}});client.current.start();return()=>{alive.current=false;generation.current?.abort();execution.current?.abort();client.current?.stop();};},[appId,clientFactory]);
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify({seed,templateId,difficulty,count,tasks,drafts,lessonId:requestedLesson,taskId:requestedTask}));localStorage.setItem(`${appId}-assignment-identity`,JSON.stringify({studentId,studentName}));setStorageError('');}catch{setStorageError('Nie można zapisać edycji w przeglądarce. Pobierz kopię pracy przed zamknięciem.');}},[key,appId,seed,templateId,difficulty,count,tasks,drafts,studentId,studentName,requestedLesson,requestedTask]);
  function stop(){epoch.current++;execution.current?.abort();setRunning(false);}
  async function generate(event){
    event.preventDefault();setError('');setNotice('');setBusy(true);stop();
    generation.current?.abort();const controller=new AbortController();generation.current=controller;
    const selectedSeed=seed.trim()||`${studentId.trim().slice(0,16)||'LAB'}:${requestedTask.slice(-20)||templateId.slice(-20)}:${crypto.randomUUID().slice(0,12)}`;
    try{
      const next=[];
      for(let index=0;index<count;index++){
        const response=await fetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({generatorVersion:GENERATOR_VERSION,seed:selectedSeed,templateId,difficulty,index}),signal:controller.signal});
        const body=await response.json();if(!response.ok)throw Error(body.message||'Generator jest niedostępny.');next.push(body.assignment);
      }
      if(controller.signal.aborted)return;
      setTasks(next);setSelected(0);setResult(null);
      trackLabEvent('assignment_generated',{kind:'sql',lesson_id:requestedLesson||'',total:next.length});
    }catch(failure){if(failure.name!=='AbortError')setError(failure.message||'Brak połączenia z generatorem.');}
    finally{if(!controller.signal.aborted)setBusy(false);}
  }
  async function run(){
    stop();const version=epoch.current,controller=new AbortController();execution.current=controller;setRunning(true);setResult(null);setError('');
    try{const output=await runAssignment(task,files,{signal:controller.signal});if(alive.current&&version===epoch.current)setResult(output);}
    catch(failure){if(alive.current&&version===epoch.current)setError(failure.message);}
    finally{if(alive.current&&version===epoch.current)setRunning(false);}
  }
  async function submit(){
    setError('');setNotice('');if(!studentId.trim()){setError('Podaj swoje ID ucznia przed oddaniem pracy.');return;}
    setSending(true);
    try{const id=await client.current.submit({assignment:task,studentId,studentName,files});if(alive.current){setLastSubmissionId(id);setNotice('Praca zapisana. Trwa wysyłka…');trackLabEvent('assignment_submitted',{kind:'sql',lesson_id:task.params?.lessonId||'',action:'queued'});void client.current.flush().catch(failure=>setError(failure.message));}}
    catch(failure){if(alive.current)setError(failure.message);}finally{if(alive.current)setSending(false);}
  }
  return <main className="assignments-page">
    <header className="assignments-heading"><div><span className="assignments-eyebrow">Ćwiczenia do lekcji</span><h1>Generator zadań</h1></div><button type="button" onClick={onBack}>Wróć do kursu</button></header>
    <form className="assignments-setup" onSubmit={generate}>
      <label>Zagadnienie<select value={templateId} onChange={e=>setTemplateId(e.target.value)}>{catalog.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <div className="assignment-level-control"><label htmlFor="assignment-difficulty">Poziom: <strong>{levels[difficulty]}</strong></label><input id="assignment-difficulty" type="range" min="0" max="2" step="1" value={Object.keys(levels).indexOf(difficulty)} aria-valuetext={levels[difficulty]} onChange={e=>setDifficulty(Object.keys(levels)[Number(e.target.value)])} style={{'--level-progress':`${Object.keys(levels).indexOf(difficulty)*50}%`}}/><div className="assignment-level-labels" aria-hidden="true"><span>Podstawy</span><span>Praktyka</span><span>Wyzwanie</span></div></div>
      <button className="assignments-primary" disabled={busy}>{busy?'Generowanie…':'Generuj zestaw'}</button>
      <details className="assignment-advanced"><summary>Szczegóły zestawu</summary><div><label>Seed zestawu<input value={seed} onChange={e=>setSeed(e.target.value)} maxLength={80} placeholder="Automatyczny, indywidualny wariant"/></label><label>Liczba zadań<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,3,5,10].map(n=><option key={n} value={n}>{n}</option>)}</select></label><p className="assignments-caption">Domyślnie dostajesz nowy wariant. Własny seed pozwala odtworzyć ten sam zestaw.</p></div></details>
    </form>
    <details className="assignment-student-details"><summary>ID: {studentId||'Uzupełnij ID ucznia'}{studentName?` · ${studentName}`:''} <span aria-hidden="true">✎</span></summary><section className="assignments-identity" aria-label="Identyfikacja oddania"><label>Twoje ID ucznia<input value={studentId} onChange={e=>setStudentId(e.target.value)} maxLength={80} placeholder="Np. 3A-12" autoComplete="off"/></label><label>Imię lub nazwa (opcjonalnie)<input value={studentName} onChange={e=>setStudentName(e.target.value)} maxLength={80}/></label></section></details>
    {error&&<p className="assignments-error" role="alert">{error}</p>}{storageError&&<p className="assignments-error" role="alert">{storageError}</p>}{notice&&<p role="status">{lastSubmission?.status==='broker_accepted'?'✓ Wysłano':lastSubmission?.status==='rejected'?'Nie udało się wysłać. Pobierz kopię pracy.':notice}</p>}
    {!task?<section className="assignments-empty"><p>Wybierz poziom i wygeneruj ćwiczenia.</p></section>:<>
      <nav className="assignments-task-tabs" aria-label="Zadania zestawu">{tasks.map((entry,index)=><button key={entry.id} type="button" aria-current={entry.id===task.id?'step':undefined} onClick={()=>{stop();setSelected(index);setResult(null);setNotice('');}}>{index+1}. {entry.title}</button>)}</nav>
      <div className="assignments-workspace"><div className="assignments-main"><section className="assignments-instructions"><span className="assignments-eyebrow">Zadanie {task.index+1} · {levels[task.difficulty]}</span><h2>{task.title}</h2><p>{task.prompt}</p><ul>{task.criteria.map((criterion,i)=><li key={i}>{criterion}</li>)}</ul><details><summary>Parametry wariantu</summary><p className="assignments-caption">Seed: <code>{task.seed}</code> · wersja {task.generatorVersion} · <code>{task.id}</code></p></details>{task.params.seedSql&&<details><summary>Schema i dane do zapytania</summary><pre>{task.params.seedSql}</pre></details>}</section>
      <section className="assignments-editor"><SqlEditor value={files[activeFile]||''} onChange={editCode} onRun={run} onReset={()=>editCode(task.starterFiles[activeFile]||'')} showSolution={false} disabled={busy||running}/><div className="assignments-actions">{running&&<button type="button" onClick={stop}>Zatrzymaj</button>}<button type="button" className="assignments-primary" onClick={submit} disabled={sending||busy}>{sending?'Zapisywanie…':'Oddaj do oceny'}</button><button type="button" onClick={()=>download(`zadanie-${task.id}.json`,{assignment:task,studentId,studentName,files})}>Pobierz kopię</button></div><p className="assignments-caption">Uruchomienie pokazuje wynik zapytania. Ocenę wystawia nauczyciel po otrzymaniu oddania.</p></section></div><aside className="assignments-preview" aria-label="Wynik zapytania">{!result&&<section className="assignments-preview-empty"><h2>Wynik zapytania</h2><button type="button" onClick={run} disabled={running||busy}>{running?'Uruchamianie…':'Uruchom zapytanie'}</button></section>}
      {result&&<ResultsPanel result={result} showHistory={false}/>}</aside></div>
    </>}
    {outbox.length>0&&<details className="assignments-outbox"><summary>Historia oddań ({outbox.length})</summary>{outbox.some(row=>row.status==='queued')&&<button type="button" onClick={()=>client.current.flush().catch(failure=>setError(failure.message))}>Ponów niewysłane</button>}<ul>{outbox.map(row=><li key={row.id}><strong>{row.message.studentId}</strong> · zadanie {row.message.assignment.index+1}<span role="status">{({queued:'Czeka na wysłanie',broker_accepted:'✓ Wysłano',rejected:'Wysyłka nieudana'})[row.status]}</span>{row.error&&<p>{row.error}</p>}<button type="button" onClick={()=>download(`oddanie-${row.id}.json`,row.message)}>Pobierz oddaną wersję</button></li>)}</ul></details>}
  </main>;
}
