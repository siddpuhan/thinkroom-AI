import { openDB } from 'idb';

const DB_NAME = 'thinkroom-ai-db';
const MESSAGES_STORE = 'messages';
const RESOURCES_STORE = 'resources';

export async function initDB() {
  const db = await openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(RESOURCES_STORE)) {
        db.createObjectStore(RESOURCES_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return db;
}

// Messages
export async function addMessage(message: any) {
  const db = await initDB();
  const tx = db.transaction(MESSAGES_STORE, 'readwrite');
  const store = tx.objectStore(MESSAGES_STORE);
  await store.add(message);
  await tx.done;
}

export async function getAllMessages() {
  const db = await initDB();
  const tx = db.transaction(MESSAGES_STORE, 'readonly');
  const store = tx.objectStore(MESSAGES_STORE);
  return store.getAll();
}

// Resources
export async function saveResource(resource: any) {
  const db = await initDB();
  const tx = db.transaction(RESOURCES_STORE, 'readwrite');
  const store = tx.objectStore(RESOURCES_STORE);
  await store.add(resource);
  await tx.done;
}

export async function getAllResources() {
  const db = await initDB();
  const tx = db.transaction(RESOURCES_STORE, 'readonly');
  const store = tx.objectStore(RESOURCES_STORE);
  return store.getAll();
}
