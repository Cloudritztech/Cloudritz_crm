// Simple in-memory cache with TTL
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 300000) { // 5 minutes default
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear(keyOrPrefix) {
    if (!keyOrPrefix) {
      this.cache.clear();
      return;
    }
    
    // If exact key exists, delete it
    if (this.cache.has(keyOrPrefix)) {
      this.cache.delete(keyOrPrefix);
    }
    
    // Also clear all keys that start with this prefix
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const apiCache = new Cache();
