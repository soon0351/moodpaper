
// In-memory fallback store for when localStorage is inaccessible (e.g., Security Rules, Incognito mode)
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  /**
   * Safely retrieves an item from storage.
   * Returns null if not found or if storage is blocked/throws SecurityError.
   * Suppresses all errors to prevent app crashes.
   */
  getItem: (key: string): string | null => {
    try {
      // We wrap the entire access in try-catch because simply accessing window.localStorage
      // can throw a SecurityError in strict privacy modes/iframes.
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Silently fail - do not log to console to avoid noise
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
      // Silently fail
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
      // Silently fail
    }
    delete memoryStore[key];
  }
};
