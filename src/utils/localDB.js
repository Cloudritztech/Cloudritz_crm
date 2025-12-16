// IndexedDB wrapper for offline storage
const DB_NAME = 'CloudritzCRM';
const DB_VERSION = 1;

class LocalDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for products (non-essential data)
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: '_id' });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store for customers (non-essential data)
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: '_id' });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store for draft invoices (offline capability)
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
        }

        // Store for app settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async set(storeName, data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async bulkSet(storeName, dataArray) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      dataArray.forEach(data => store.put(data));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const localDB = new LocalDB();

// Helper to check if running as installed app
export const isInstalledApp = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Sync strategy: Use local DB for reads, sync to server in background
export const syncStrategy = {
  // Get data: Try local first, then server
  async getData(storeName, fetchFn) {
    try {
      // If installed app, prefer local data
      if (isInstalledApp()) {
        const localData = await localDB.getAll(storeName);
        if (localData && localData.length > 0) {
          // Return local data immediately
          setTimeout(() => {
            // Sync in background
            fetchFn().then(serverData => {
              if (serverData?.data?.success) {
                const items = serverData.data[storeName] || serverData.data.data || [];
                localDB.bulkSet(storeName, items).catch(console.error);
              }
            }).catch(console.error);
          }, 100);
          return { data: { success: true, [storeName]: localData } };
        }
      }
      
      // Fetch from server
      const response = await fetchFn();
      if (response?.data?.success) {
        const items = response.data[storeName] || response.data.data || [];
        // Store in local DB for next time
        localDB.bulkSet(storeName, items).catch(console.error);
      }
      return response;
    } catch (error) {
      // If server fails, try local as fallback
      const localData = await localDB.getAll(storeName);
      if (localData && localData.length > 0) {
        return { data: { success: true, [storeName]: localData } };
      }
      throw error;
    }
  },

  // Save data: Save to server, then update local
  async saveData(storeName, saveFn, data) {
    try {
      const response = await saveFn();
      if (response?.data?.success && response.data.data) {
        await localDB.set(storeName, response.data.data);
      }
      return response;
    } catch (error) {
      // If offline, save to drafts
      if (!navigator.onLine) {
        await localDB.set('drafts', {
          id: Date.now(),
          storeName,
          data,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  }
};
