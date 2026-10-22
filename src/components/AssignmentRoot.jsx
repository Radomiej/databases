import {lazy,Suspense,useEffect,useRef,useState} from 'react';
const Workspace=lazy(()=>import('./AssignmentWorkspace.jsx'));
export default function AssignmentRoot({appId,children}){
  const [open,setOpen]=useState(()=>location.hash.split('?')[0]==='#zadania');
  const previousRoute=useRef(location.hash.startsWith('#/')?location.hash:'');
  useEffect(()=>{const change=event=>{if(location.hash.split('?')[0]==='#zadania'&&event.oldURL){const oldHash=new URL(event.oldURL).hash;if(oldHash.startsWith('#/'))previousRoute.current=oldHash;}else if(location.hash.startsWith('#/'))previousRoute.current=location.hash;setOpen(location.hash.split('?')[0]==='#zadania');};addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  if(open)return <Suspense fallback={<p role="status">Wczytywanie generatora…</p>}><Workspace appId={appId} onBack={()=>{location.hash=previousRoute.current;setOpen(false);}}/></Suspense>;
  return children;
}
