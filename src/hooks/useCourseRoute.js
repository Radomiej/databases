import {useEffect,useRef} from 'react';
import {resolveCourseRoute} from '../services/courseRoutes.js';
export function useCourseRoute(routes,currentKey,onNavigate,{enabled=true}={}){
 const live=useRef();live.current={routes,currentKey,onNavigate,enabled};
 const pending=useRef(null),replace=useRef(true);
 useEffect(()=>{
  const read=()=>{
   const state=live.current;if(!state.enabled)return;
   const target=resolveCourseRoute(state.routes,location.hash);
   if(!target){pending.current=null;return;}
   replace.current=true;
   if(target.key!==state.currentKey){pending.current=target.key;state.onNavigate(target);}
   else {replace.current=false;pending.current=null;if(location.hash!==target.hash)history.replaceState(null,'',location.pathname+location.search+target.hash);}
  };
  read();window.addEventListener('hashchange',read);window.addEventListener('popstate',read);
  return()=>{window.removeEventListener('hashchange',read);window.removeEventListener('popstate',read);};
 },[enabled]);
 useEffect(()=>{
  if(!enabled)return;
  if(pending.current&&pending.current!==currentKey)return;
  pending.current=null;
  if(location.hash&&!location.hash.startsWith('#/'))return;
  const route=routes.find(item=>item.key===currentKey);if(!route)return;
  if(location.hash!==route.hash){const method=replace.current?'replaceState':'pushState';history[method](null,'',location.pathname+location.search+route.hash);}
  replace.current=false;
 },[routes,currentKey,enabled]);
}
