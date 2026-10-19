const editorSelector='.monaco-editor, #sql-query, [aria-label^="Kod pliku "], [aria-label^="Edytor "]';
const limit=1_000_000_000;
export function createEditingActivity({documentRef=globalThis.document,now=Date.now}={}){
 const measuredSince=now();
 let typedCharacters=0,pastedCharacters=0,pasteCount=0,largestPaste=0,deletionActions=0,lastEditAt=0,lastPasteAt=0,started=false;
 const recent=[];
 const inEditor=event=>Boolean(event.target?.closest?.(editorSelector));
 const addTyped=count=>{if(!count)return;const time=now();typedCharacters=Math.min(limit,typedCharacters+count);lastEditAt=time;recent.push({time,count});trim(time);};
 const trim=time=>{while(recent.length&&recent[0].time<=time-60000)recent.shift();};
 const input=event=>{
  if(!inEditor(event)||event.isComposing)return;
  const type=event.inputType||'';
  if(type==='insertText')addTyped(event.data?.length||0);
  else if(type==='insertLineBreak'||type==='insertParagraph')addTyped(1);
  else if(type.startsWith('delete')){deletionActions=Math.min(limit,deletionActions+1);lastEditAt=now();}
 };
 const composition=event=>{if(inEditor(event))addTyped(event.data?.length||0);};
 const paste=event=>{
  if(!inEditor(event))return;
  // Count only the size. Clipboard text is never retained or transmitted here.
  let count=0;try{count=Math.min(limit,event.clipboardData?.getData('text/plain')?.length||0);}catch{}
  pasteCount=Math.min(limit,pasteCount+1);pastedCharacters=Math.min(limit,pastedCharacters+count);largestPaste=Math.max(largestPaste,count);lastPasteAt=now();lastEditAt=lastPasteAt;
 };
 return {
  start(){if(started)return;started=true;documentRef?.addEventListener?.('beforeinput',input,true);documentRef?.addEventListener?.('compositionend',composition,true);documentRef?.addEventListener?.('paste',paste,true);},
  stop(){started=false;documentRef?.removeEventListener?.('beforeinput',input,true);documentRef?.removeEventListener?.('compositionend',composition,true);documentRef?.removeEventListener?.('paste',paste,true);},
  snapshot(){
   const time=now();trim(time);
   const recentTypedCharacters=recent.reduce((sum,item)=>sum+item.count,0);
   const period=Math.max(10000,Math.min(60000,time-measuredSince));
   return {measuredSince,typedCharacters,pastedCharacters,pasteCount,largestPaste,deletionActions,lastEditAt,lastPasteAt,recentTypedCharacters,charactersPerMinute:Math.min(limit,Math.round(recentTypedCharacters*60000/period))};
  },
 };
}
