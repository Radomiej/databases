import {useEffect,useRef,useState} from 'react';
import {templates,GENERATOR_VERSION} from '../../shared/assignments/catalog.js';
import {createSubmissionClient} from '../services/assignmentSubmissions.js';
import {runAssignment} from '../services/assignmentRunner.js';
import './assignments.css';

function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const levels={easy:'Podstawowy',standard:'Standardowy',challenge:'Wyzwanie'};
export default function AssignmentWorkspace({appId,onBack,clientFactory=createSubmissionClient}){
  const catalog=templates.filter(t=>t.appId===appId),key=`${appId}-generated-work-v1`;
  const [saved]=useState(()=>load(key,{}));
  const [seed,setSeed]=useState(saved.seed||''),[templateId,setTemplateId]=useState(saved.templateId||catalog[0].id),[difficulty,setDifficulty]=useState(saved.difficulty||'standard'),[count,setCount]=useState(saved.count||5);
  const [tasks,setTasks]=useState(()=>Array.isArray(saved.tasks)?saved.tasks:[]),[drafts,setDrafts]=useState(saved.drafts||{}),[selected,setSelected]=useState(0),[file,setFile]=useState('');
  const [studentId,setStudentId]=useState(()=>load(`${appId}-assignment-identity`,{}).studentId||''),[studentName,setStudentName]=useState(()=>load(`${appId}-assignment-identity`,{}).studentName||'');
  const [error,setError]=useState(''),[storageError,setStorageError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[running,setRunning]=useState(false),[result,setResult]=useState(null),[outbox,setOutbox]=useState([]);
  const client=useRef(null),alive=useRef(true),generation=useRef(null),execution=useRef(null),epoch=useRef(0);
  const task=tasks[selected]||tasks[0],files=task?(drafts[task.id]||task.starterFiles):{},activeFile=Object.hasOwn(files,file)?file:Object.keys(files)[0];
  useEffect(()=>{alive.current=true;client.current=clientFactory({appId,onChange:(rows,failure)=>{if(alive.current){setOutbox(rows);if(failure)setError(failure);}}});client.current.start();return()=>{alive.current=false;generation.current?.abort();execution.current?.abort();client.current?.stop();};},[appId,clientFactory]);
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify({seed,templateId,difficulty,count,tasks,drafts}));localStorage.setItem(`${appId}-assignment-identity`,JSON.stringify({studentId,studentName}));setStorageError('');}catch{setStorageError('Nie można zapisać edycji w przeglądarce. Pobierz kopię pracy przed zamknięciem.');}},[key,appId,seed,templateId,difficulty,count,tasks,drafts,studentId,studentName]);
  function stop(){epoch.current++;execution.current?.abort();setRunning(false);}
  async function generate(event){
    event.preventDefault();setError('');setNotice('');setBusy(true);stop();
    generation.current?.abort();const controller=new AbortController();generation.current=controller;
    const selectedSeed=seed.trim()||`LAB-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    try{
      const next=[];
      for(let index=0;index<count;index++){
        const response=await fetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({generatorVersion:GENERATOR_VERSION,seed:selectedSeed,templateId,difficulty,index}),signal:controller.signal});
        const body=await response.json();if(!response.ok)throw Error(body.message||'Generator jest niedostępny.');next.push(body.assignment);
      }
      if(controller.signal.aborted)return;
      setSeed(selectedSeed);setTasks(next);setSelected(0);setFile('');setResult(null);
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
    try{const id=await client.current.submit({assignment:task,studentId,studentName,files});if(alive.current){setNotice(`Zapisano oddanie ${id.slice(0,8)} w lokalnej kolejce. Dalsza edycja nie zmieni oddanej wersji.`);void client.current.flush().catch(failure=>setError(failure.message));}}
    catch(failure){if(alive.current)setError(failure.message);}finally{if(alive.current)setSending(false);}
  }
  return <main className="assignments-page">
    <header className="assignments-heading"><div><span className="assignments-eyebrow">Laboratorium · zadania z seedem</span><h1>Generator zadań</h1><p>Wygeneruj zestaw, rozwiąż zadanie i oddaj kod nauczycielowi.</p></div><button type="button" onClick={onBack}>Wróć do kursu</button></header>
    <form className="assignments-setup" onSubmit={generate}>
      <label>Rodzina zadań<select value={templateId} onChange={e=>setTemplateId(e.target.value)}>{catalog.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Poziom<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{Object.entries(levels).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Seed zestawu<input value={seed} onChange={e=>setSeed(e.target.value)} maxLength={80} placeholder="Puste pole = nowy seed"/></label>
      <label>Liczba zadań<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,5,10].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
      <button className="assignments-primary" disabled={busy}>{busy?'Generowanie…':'Generuj zestaw'}</button>
      <p className="assignments-caption">Ten sam seed, rodzina, poziom i wersja generatora odtwarzają zestaw. Generowanie zastępuje widoczny zestaw; kopie oddań pozostają w kolejce.</p>
    </form>
    <section className="assignments-identity" aria-label="Identyfikacja oddania"><label>Twoje ID ucznia<input value={studentId} onChange={e=>setStudentId(e.target.value)} maxLength={80} placeholder="Np. 3A-12" autoComplete="off"/></label><label>Imię lub nazwa (opcjonalnie)<input value={studentName} onChange={e=>setStudentName(e.target.value)} maxLength={80}/></label><p>ID podajesz samodzielnie. Oddanie udostępnia nauczycielowi zadanie i Twój kod.</p></section>
    {error&&<p className="assignments-error" role="alert">{error}</p>}{storageError&&<p className="assignments-error" role="alert">{storageError}</p>}{notice&&<p role="status">{notice}</p>}
    {!task?<section className="assignments-empty"><h2>Wybierz temat pierwszego zestawu</h2><p>Zadania od prostych ćwiczeń po algorytmy. Rozwiązanie wzorcowe będzie dostępne nauczycielowi w panelu oceniania.</p></section>:<>
      <nav className="assignments-task-tabs" aria-label="Zadania zestawu">{tasks.map((entry,index)=><button key={entry.id} type="button" aria-current={entry.id===task.id?'step':undefined} onClick={()=>{stop();setSelected(index);setFile('');setResult(null);setNotice('');}}>{index+1}. {entry.title}</button>)}</nav>
      <div className="assignments-workspace"><section className="assignments-instructions"><span className="assignments-eyebrow">Zadanie {task.index+1} · {levels[task.difficulty]}</span><h2>{task.title}</h2><p>{task.prompt}</p><ul>{task.criteria.map((criterion,i)=><li key={i}>{criterion}</li>)}</ul><p className="assignments-caption">Seed: <code>{task.seed}</code> · wersja {task.generatorVersion} · <code>{task.id}</code></p>{task.params.seedSql&&<details><summary>Schema i dane do zapytania</summary><pre>{task.params.seedSql}</pre></details>}</section>
      <section className="assignments-editor"><label>Plik<select value={activeFile||''} onChange={e=>setFile(e.target.value)}>{Object.keys(files).map(path=><option key={path} value={path}>{path}</option>)}</select></label><label className="assignments-code-label">Kod pliku {activeFile}<textarea spellCheck="false" value={files[activeFile]||''} onChange={e=>{stop();setResult(null);setDrafts(current=>({...current,[task.id]:{...files,[activeFile]:e.target.value}}));}}/></label><div className="assignments-actions"><button type="button" disabled={busy||running} onClick={run}>{running?'Uruchamianie…':'Uruchom kod'}</button>{running&&<button type="button" onClick={stop}>Zatrzymaj</button>}<button type="button" className="assignments-primary" onClick={submit} disabled={sending||busy}>{sending?'Zapisywanie…':'Oddaj do oceny'}</button><button type="button" onClick={()=>download(`zadanie-${task.id}.json`,{assignment:task,studentId,studentName,files})}>Pobierz kopię</button></div><p className="assignments-caption">Uruchomienie pokazuje działanie kodu. Ocenę wystawia nauczyciel po otrzymaniu oddania.</p></section></div>
      {result&&<section className="assignments-result" aria-label="Wynik uruchomienia"><h2>Wynik uruchomienia</h2>{result.html?<iframe title="Podgląd rozwiązania" sandbox="allow-scripts" srcDoc={result.html}/>:<pre>{result.output||'Program nie zwrócił tekstu.'}</pre>}</section>}
    </>}
    <section className="assignments-outbox"><div className="assignments-heading"><h2>Oddania</h2><button type="button" onClick={()=>client.current.flush().catch(failure=>setError(failure.message))}>Ponów wysyłkę</button></div><p className="assignments-caption">„Przyjęte przez RabbitMQ” oznacza przekazanie do kolejki. Odbiór i ocenę w panelu potwierdza nauczyciel.</p>{outbox.length?<ul>{outbox.map(row=><li key={row.id}><strong>{row.message.studentId}</strong> · {row.message.assignment.templateId} · zadanie {row.message.assignment.index+1} · <code>{row.id.slice(0,8)}</code><span role="status">{({queued:'Czeka na wysyłkę',broker_accepted:'Przyjęte przez RabbitMQ',rejected:'Odrzucone przez serwer'})[row.status]}</span>{row.error&&<p>{row.error}</p>}<button type="button" onClick={()=>download(`oddanie-${row.id}.json`,row.message)}>Pobierz oddaną wersję</button></li>)}</ul>:<p>Nie oddano jeszcze żadnej pracy w tej przeglądarce.</p>}</section>
  </main>;
}
