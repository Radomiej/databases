import {test,expect,afterEach} from 'vitest';
import {createEditingActivity} from './editingActivity.js';
afterEach(()=>{document.body.innerHTML='';});
function fixture(){let time=100000;document.body.innerHTML='<textarea id="sql-query"></textarea><input id="name">';const editor=document.querySelector('textarea'),name=document.querySelector('input');const activity=createEditingActivity({documentRef:document,now:()=>time});activity.start();return {activity,editor,name,advance:ms=>{time+=ms;}};}
const type=(target,data,inputType='insertText',isComposing=false)=>target.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,data,inputType,isComposing}));
function paste(target,text){const event=new Event('paste',{bubbles:true});Object.defineProperty(event,'clipboardData',{value:{getData:()=>text}});target.dispatchEvent(event);}
test('counts manual characters separately from pastes and ignores identity fields',()=>{
 const f=fixture();type(f.editor,'abc');paste(f.editor,'code'.repeat(100));type(f.editor,'code'.repeat(100),'insertFromPaste');type(f.name,'student');paste(f.name,'ignored');type(f.editor,null,'deleteContentBackward');
 expect(f.activity.snapshot()).toMatchObject({typedCharacters:3,pastedCharacters:400,pasteCount:1,largestPaste:400,deletionActions:1});
 expect(JSON.stringify(f.activity.snapshot())).not.toContain('code');f.activity.stop();
});
test('uses only the last minute for speed and ages to zero while idle',()=>{
 const f=fixture();f.advance(60000);type(f.editor,'a'.repeat(120));expect(f.activity.snapshot().charactersPerMinute).toBe(120);f.advance(60001);expect(f.activity.snapshot()).toMatchObject({typedCharacters:120,charactersPerMinute:0,recentTypedCharacters:0});f.activity.stop();
});
test('counts completed composition once and stops listening on disposal',()=>{
 const f=fixture();type(f.editor,'ą','insertCompositionText',true);f.editor.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'ą'}));type(f.editor,'ą','insertFromComposition');expect(f.activity.snapshot().typedCharacters).toBe(1);f.activity.stop();type(f.editor,'ignored');paste(f.editor,'ignored');expect(f.activity.snapshot()).toMatchObject({typedCharacters:1,pasteCount:0});
});
