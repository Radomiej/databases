export function createFakeIndexedDb() {
  let database;

  return {
    open(_name, version) {
      const request = {};
      queueMicrotask(() => {
        if (!database) {
          const stores = new Map();
          database = {
            version,
            objectStoreNames: { contains: (name) => stores.has(name) },
            createObjectStore(name, { keyPath }) {
              stores.set(name, { keyPath, records: new Map() });
              return {};
            },
            transaction(name) {
              const table = stores.get(name);
              let pending = 0;
              const transaction = {};
              const finishIfIdle = () => {
                if (pending === 0) queueMicrotask(() => transaction.oncomplete?.({ target: transaction }));
              };
              const requestFor = (operation) => {
                const operationRequest = {};
                pending += 1;
                queueMicrotask(() => {
                  operationRequest.result = operation();
                  operationRequest.onsuccess?.({ target: operationRequest });
                  pending -= 1;
                  finishIfIdle();
                });
                return operationRequest;
              };
              transaction.objectStore = () => ({
                getAll: () => requestFor(() => [...table.records.values()]),
                put: (value) => requestFor(() => {
                  table.records.set(value[table.keyPath], structuredClone(value));
                  return value[table.keyPath];
                }),
                clear: () => requestFor(() => table.records.clear()),
              });
              return transaction;
            },
          };
          request.result = database;
          request.onupgradeneeded?.({ target: request });
        }
        request.result = database;
        request.onsuccess?.({ target: request });
      });
      return request;
    },
  };
}
