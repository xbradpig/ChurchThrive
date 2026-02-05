const DB_NAME = 'ct_audio_chunks';
const STORE_NAME = 'chunks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: ['noteId', 'index'] });
      }
    };
  });
}

export async function saveAudioChunk(noteId: string, index: number, chunk: Blob): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ noteId, index, chunk, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAudioChunks(noteId: string): Promise<Blob[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const chunks = (request.result || [])
        .filter((r: any) => r.noteId === noteId)
        .sort((a: any, b: any) => a.index - b.index)
        .map((r: any) => r.chunk);
      resolve(chunks);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAudioChunks(noteId: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = (request.result || []).filter((r: any) => r.noteId === noteId);
      items.forEach((item: any) => store.delete([item.noteId, item.index]));
      tx.oncomplete = () => resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAudioBlob(noteId: string, mimeType = 'audio/webm'): Promise<Blob | null> {
  const chunks = await getAudioChunks(noteId);
  if (chunks.length === 0) return null;
  return new Blob(chunks, { type: mimeType });
}
