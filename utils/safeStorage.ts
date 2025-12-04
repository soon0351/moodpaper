
// In-memory fallback store for when localStorage is inaccessible (e.g., Security Rules, Incognito mode)
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  /**
   * Safely retrieves an item from storage.
   * Returns null if not found or if storage is blocked.
   */
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      // If storage access fails, try memory store
      return memoryStore[key] || null;
    }
  },

  /**
   * Safely saves an item to storage.
   * Falls back to memory store if storage is blocked.
   */
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // If storage access fails, save to memory store
      memoryStore[key] = value;
    }
  },

  /**
   * Safely removes an item.
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStore[key];
    }
  }
};
