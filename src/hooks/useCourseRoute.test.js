// @vitest-environment jsdom
import {test,expect,afterEach,vi} from 'vitest';
import {renderHook,act,cleanup} from '@testing-library/react';
import {useState} from 'react';
import {createCourseRoutes,resolveCourseRoute,slug} from '../services/courseRoutes.js';
import {useCourseRoute} from './useCourseRoute.js';
const lessons=[{id:'one',track:'html',order:1,title:'Łącza i zdjęcia',tasks:[{id:'a',title:'Żółw'},{id:'b',title:'Kontakt'}]},{id:'two',track:'css',order:2,title:'Kolory',tasks:[{id:'c',title:'Tło'}]}];
const routes=createCourseRoutes(lessons);
afterEach(()=>{cleanup();history.replaceState(null,'','/');vi.restoreAllMocks();});
test('slugs are readable and topic/lesson links resolve to first task',()=>{
 expect(slug('Łącza: Żółć!')).toBe('lacza-zolc');
 expect(resolveCourseRoute(routes,'#/html')).toBe(routes[0]);
 expect(resolveCourseRoute(routes,'#/html/1-lacza-i-zdjecia')).toBe(routes[0]);
 expect(resolveCourseRoute(routes,routes[1].hash)).toBe(routes[1]);
 expect(resolveCourseRoute(routes,'#/%E0%A4%A')).toBe(null);
 expect(resolveCourseRoute(routes,'#zadania')).toBe(null);
});
function useFixture(){const [key,setKey]=useState(routes[0].key);useCourseRoute(routes,key,target=>setKey(target.key));return {key,setKey};}
test('initial deep link overrides saved selection and UI navigation adds history',()=>{
 history.replaceState(null,'',routes[1].hash);
 const push=vi.spyOn(history,'pushState');const {result}=renderHook(useFixture);
 expect(result.current.key).toBe(routes[1].key);
 expect(location.hash).toBe(routes[1].hash);
 act(()=>result.current.setKey(routes[2].key));
 expect(location.hash).toBe(routes[2].hash);expect(push).toHaveBeenCalledTimes(1);
});
test('browser navigation restores task without creating extra history',()=>{
 const {result}=renderHook(useFixture);const push=vi.spyOn(history,'pushState');
 act(()=>{history.replaceState(null,'',routes[2].hash);window.dispatchEvent(new PopStateEvent('popstate'));});
 expect(result.current.key).toBe(routes[2].key);expect(push).not.toHaveBeenCalled();
 act(()=>result.current.setKey(routes[1].key));expect(location.hash).toBe(routes[1].hash);expect(push).toHaveBeenCalledTimes(1);
});
test('generator hash stays untouched',()=>{history.replaceState(null,'','#zadania');renderHook(useFixture);expect(location.hash).toBe('#zadania');});
