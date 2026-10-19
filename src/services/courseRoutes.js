export function slug(value){return String(value||'').toLowerCase().replaceAll('ł','l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function createCourseRoutes(lessons,{topics=lesson=>[lesson.track]}={}){
 return lessons.flatMap(lesson=>topics(lesson).flatMap(topic=>lesson.tasks.map((task,index)=>({
  key:JSON.stringify([topic,lesson.id,task.id]),topic,lesson,task,
  hash:`#/${topic}/${lesson.order}-${slug(lesson.title)||slug(lesson.id)}/${index+1}-${slug(task.title)||slug(task.id)}`,
 }))));
}
export function resolveCourseRoute(routes,hash){
 if(!hash?.startsWith('#/'))return null;
 let path;try{path=decodeURIComponent(hash).replace(/\/$/,'');}catch{return null;}
 return routes.find(route=>route.hash===path)||routes.find(route=>route.hash.startsWith(path+'/'))||null;
}
