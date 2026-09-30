import { CONFIG } from './statistics.js';
const memory = new Map();
const keyFor = (p, length = 100) => `${CONFIG.version}:${p}:${length}`;
let database;
// Some WebKit/storage failures never dispatch success or error. Cache is optional:
// bound the wait so model preparation cannot remain disabled indefinitely.
export function withDeadline(operation, milliseconds = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Cache timeout')), milliseconds);
    Promise.resolve(operation).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
function openDB() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('binary-lab', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('models', { keyPath: 'key' });
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = null; };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cache unavailable'));
  });
  return database;
}
function remember(key, model) {
  memory.delete(key);
  memory.set(key, model);
  if (memory.size > 6) memory.delete(memory.keys().next().value);
}
export async function getCached(p, length = 100) {
  const key = keyFor(p, length);
  if (memory.has(key)) {
    const model = memory.get(key); remember(key, model); return model;
  }
  try {
    const db = await withDeadline(openDB());
    const entry = await withDeadline(new Promise((resolve, reject) => {
      const request = db.transaction('models').objectStore('models').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }));
    if (entry?.model?.version === CONFIG.version && entry.model.p === p && entry.model.length === length) {
      remember(key, entry.model);
      void putCached(entry.model);
      return entry.model;
    }
  } catch { /* Private browsing or quota failures must not prevent playing. */ }
  return null;
}
export async function putCached(model) {
  const key = keyFor(model.p, model.length);
  remember(key, model);
  try {
    const db = await withDeadline(openDB());
    await withDeadline(new Promise((resolve, reject) => {
      const transaction = db.transaction('models', 'readwrite');
      const store = transaction.objectStore('models');
      store.put({ key, model, used: Date.now() });
      const request = store.getAll();
      request.onsuccess = () => {
        const entries = request.result.sort((a, b) => b.used - a.used);
        entries.slice(6).forEach(entry => store.delete(entry.key));
      };
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    }));
  } catch { /* Memory cache is enough to keep the current experiment usable. */ }
}
