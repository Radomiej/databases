import {lazy,Suspense,useEffect,useState} from 'react';
const Workspace=lazy(()=>import('./AssignmentWorkspace.jsx'));
export default function AssignmentRoot({appId,children}){
  const [open,setOpen]=useState(()=>location.hash==='#zadania');
  useEffect(()=>{const change=()=>setOpen(location.hash==='#zadania');addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  if(open)return <Suspense fallback={<p role="status">Wczytywanie generatora…</p>}><Workspace appId={appId} onBack={()=>{location.hash='';setOpen(false);}}/></Suspense>;
  return <>{children}<button type="button" aria-label="Otwórz generator zadań" onClick={()=>{location.hash='zadania';setOpen(true);}} style={{position:'fixed',bottom:12,left:12,zIndex:50,border:'1px solid #24587a',borderRadius:8,padding:'10px 14px',background:'#fff',color:'#173c56',fontWeight:700,boxShadow:'0 2px 8px #0002'}}>Generator zadań</button></>;
}
