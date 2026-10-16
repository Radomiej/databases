const key='databases-installation-id-v1';
let temporary;
export function newId(){return globalThis.crypto.randomUUID();}
export function getInstallationId(storage) {
  try {
    storage ??= globalThis.localStorage;
    const saved=storage?.getItem(key);
    if(typeof saved==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved))return saved;
    const id=newId();if(storage){storage.setItem(key,id);return id;}
  }catch{ /* Storage blocked: keep an ephemeral ID, never break the editor. */ }
  return temporary ??= newId();
}
