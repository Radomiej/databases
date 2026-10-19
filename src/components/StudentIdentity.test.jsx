import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi,afterEach} from 'vitest';
import StudentIdentity from './StudentIdentity.jsx';
afterEach(cleanup);
const identity=()=>({machineId:'12345678-1234-4234-8234-123456789abc',studentName:'Ola',status:'online',setStudentName:vi.fn()});
test('shows ID and name, edits only after clicking the pencil and saves trimmed text',()=>{
 const telemetry=identity();render(<StudentIdentity telemetry={telemetry}/>);
 expect(screen.getByText(`ID: ${telemetry.machineId.slice(-6)}`)).toBeInTheDocument();
 expect(screen.getByText('Ola')).toBeInTheDocument();expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Edytuj nazwę ucznia'}));
 const input=screen.getByRole('textbox',{name:'Nick lub nazwa'});expect(input).toHaveFocus();
 fireEvent.change(input,{target:{value:'  Ada · 3A  '}});
 expect(telemetry.setStudentName).not.toHaveBeenCalled();
 fireEvent.submit(input.closest('form'));
 expect(telemetry.setStudentName).toHaveBeenCalledWith('Ada · 3A');
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Edytuj nazwę ucznia'})).toHaveFocus();
});
test('Escape cancels unsaved changes and preserves identity while offline',()=>{
 const telemetry={...identity(),status:'offline'};render(<StudentIdentity telemetry={telemetry}/>);
 fireEvent.click(screen.getByRole('button',{name:'Edytuj nazwę ucznia'}));
 const input=screen.getByRole('textbox',{name:'Nick lub nazwa'});
 fireEvent.change(input,{target:{value:'Inna nazwa'}});fireEvent.keyDown(input,{key:'Escape'});
 expect(telemetry.setStudentName).not.toHaveBeenCalled();expect(screen.getByText('Ola')).toBeInTheDocument();
 expect(screen.getByRole('status')).toHaveTextContent('Brak połączenia');
});
test('allows clearing an optional name and cancelling with a button',()=>{
 const telemetry=identity();render(<StudentIdentity telemetry={telemetry}/>);
 fireEvent.click(screen.getByRole('button',{name:'Edytuj nazwę ucznia'}));
 fireEvent.click(screen.getByRole('button',{name:'Anuluj'}));expect(telemetry.setStudentName).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Edytuj nazwę ucznia'}));
 const input=screen.getByRole('textbox',{name:'Nick lub nazwa'});expect(input).toHaveAttribute('maxlength','80');
 fireEvent.change(input,{target:{value:''}});fireEvent.submit(input.closest('form'));
 expect(telemetry.setStudentName).toHaveBeenCalledWith('');
});
