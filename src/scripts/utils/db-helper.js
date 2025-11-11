import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const STORE_NAME = 'story-outbox';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

const DbHelper = {
  async putStory(story) {
    return (await dbPromise).put(STORE_NAME, story);
  },
  
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  
  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
};

export default DbHelper;