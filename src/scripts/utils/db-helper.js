import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const OUTBOX_STORE_NAME = 'story-outbox';
const FAVORITE_STORE_NAME = 'story-favorites';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OUTBOX_STORE_NAME)) {
      db.createObjectStore(OUTBOX_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
    }
    if (!db.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
      db.createObjectStore(FAVORITE_STORE_NAME, { keyPath: 'id' });
    }
  },
});

const DbHelper = {
  async putStory(story) {
    return (await dbPromise).put(OUTBOX_STORE_NAME, story);
  },
  async getAllStories() {
    return (await dbPromise).getAll(OUTBOX_STORE_NAME);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(OUTBOX_STORE_NAME, id);
  },

  async putFavorite(story) {
    return (await dbPromise).put(FAVORITE_STORE_NAME, story);
  },

  async getAllFavorites() {
    return (await dbPromise).getAll(FAVORITE_STORE_NAME);
  },

  async getFavorite(id) {
    return (await dbPromise).get(FAVORITE_STORE_NAME, id);
  },

  async deleteFavorite(id) {
    return (await dbPromise).delete(FAVORITE_STORE_NAME, id);
  },
};

export default DbHelper;
