// Simple cache utility for frontend performance
class SimpleCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Create cache instances
export const productsCache = new SimpleCache(2 * 60 * 1000); // 2 minutes
export const customersCache = new SimpleCache(5 * 60 * 1000); // 5 minutes
export const dashboardCache = new SimpleCache(1 * 60 * 1000); // 1 minute