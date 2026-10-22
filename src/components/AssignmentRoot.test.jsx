import {act,fireEvent,render,screen,cleanup} from '@testing-library/react';
import AssignmentRoot from './AssignmentRoot.jsx';
vi.mock('./AssignmentWorkspace.jsx',()=>({default:({onBack})=><button onClick={onBack}>Wróć do kursu</button>}));
afterEach(()=>{cleanup();history.replaceState(null,'','#/');});

test('returns to the current task even when course navigation used pushState without hashchange',async()=>{
 history.replaceState(null,'','#/sqlite/sklep/first-task');
 render(<AssignmentRoot appId="databases"><p>Kurs</p></AssignmentRoot>);
 history.pushState(null,'','#/sqlite/sklep/second-task');
 const oldURL=location.href;
 act(()=>{history.replaceState(null,'','#zadania?lekcja=inner-join');dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));});
 fireEvent.click(await screen.findByRole('button',{name:'Wróć do kursu'}));
 expect(location.hash).toBe('#/sqlite/sklep/second-task');
 expect(screen.getByText('Kurs')).toBeVisible();
});
