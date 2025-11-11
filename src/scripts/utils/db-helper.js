// src/scripts/utils/db-helper.js
import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const STORE_NAME = 'story-outbox';
const DB_VERSION = 1;

// Buka database
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Buat object store (tabel) 'story-outbox' jika belum ada
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      // Gunakan 'id' sebagai primary key yang auto-increment
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

const DbHelper = {
  // Create: Menyimpan cerita ke outbox
  async putStory(story) {
    return (await dbPromise).put(STORE_NAME, story);
  },
  
  // Read: Mengambil semua cerita dari outbox
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  
  // Delete: Menghapus cerita dari outbox berdasarkan id
  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
};

export default DbHelper;