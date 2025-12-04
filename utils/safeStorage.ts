
// In-memory fallback store for when localStorage is inaccessible (e.g., Security Rules, Incognito mode)
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  /**
   * Safely retrieves an item from storage.
   * Returns null if not found or if storage is blocked/throws SecurityError.
   */
  getItem: (key: string): string | null => {
    try {
      // Accessing window.localStorage itself can throw a SecurityError in some iframe/privacy contexts
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Access denied or storage unavailable - silently fall back to memory
      console.warn('LocalStorage access denied. Using in-memory fallback.');
    }
    return memoryStore[key] || null;
  },

  /**
   * Safely saves an item to storage.
   * Falls back to memory store if storage is blocked.
   */
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Access denied - save to memory only
    }
    // Always save to memory sync for current session consistency
    memoryStore[key] = value;
  },

  /**
   * Safely removes an item.
   */
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // Access denied
    }
    delete memoryStore[key];
  }
};
