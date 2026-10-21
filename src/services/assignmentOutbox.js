// Dedicated persistent queue. Never evicts an unsent submission.
export function createIndexedOutbox(indexedDB=globalThis.indexedDB){
  let database;
  const open=()=>database??=new Promise((resolve,reject)=>{
    if(!indexedDB)return reject(Error('Przeglądarka nie udostępnia trwałego zapisu. Pobierz kopię pracy przed zamknięciem.'));
    const request=indexedDB.open('lab-assignment-outbox-v1',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('submissions',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(Error('Nie można otworzyć kolejki oddań. Pobierz kopię pracy.'));
    request.onblocked=()=>reject(Error('Zamknij pozostałe karty generatora i spróbuj ponownie.'));
  });
  const execute=async(mode,action)=>{const db=await open();return new Promise((resolve,reject)=>{
    const tx=db.transaction('submissions',mode),request=action(tx.objectStore('submissions'));let result;
    request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(Error('Nie udało się zapisać oddania. Pobierz kopię pracy.'));tx.onabort=tx.onerror;
  });};
  return {list:()=>execute('readonly',store=>store.getAll()),put:row=>execute('readwrite',store=>store.put(row)),remove:id=>execute('readwrite',store=>store.delete(id))};
}
